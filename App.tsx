
import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutGrid, 
  Package, 
  Users, 
  ClipboardCheck, 
  Bot,
  Plus,
  Search, 
  CheckCircle2,
  XCircle,
  Calendar,
  Phone,
  Mail,
  MapPin,
  TrendingUp,
  History,
  X,
  Save,
  Trash2,
  Download,
  Filter,
  Layers,
  Tag,
  Send,
  ShoppingCart,
  Percent,
  Calculator,
  AlertCircle,
  ChevronRight,
  FileText,
  DollarSign,
  ArrowDownCircle,
  LogOut,
  User as UserIcon,
  Menu,
  X as XIcon,
  Wallet
} from 'lucide-react';
import { 
  TabType, 
  EquipmentModel, 
  StockItem, 
  Client, 
  ServiceOrder, 
  EquipmentStatus, 
  OSStatus, 
  RentalUnit,
  OSItem,
  DocumentType,
  Despesa,
  AgrupadorDespesa,
  Retirada,
} from './types';
import { askArchitect } from './services/geminiService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { jsPDF } from 'jspdf';
import { useSyncState } from './hooks/useSyncState';
import { useSheetsSync } from './hooks/useSheetsSync';
import { GoogleAuth } from './components/GoogleAuth';
import { SyncStatus } from './components/SyncStatus';
import { ToastContainer, useToastContainer } from './components/ToastContainer';
import { formatDocument, getMaxLength } from './utils/documentFormatter';

const App: React.FC = () => {

  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Filtro de período do Dashboard
  const [dashboardStartDate, setDashboardStartDate] = useState<string>('');
  const [dashboardEndDate, setDashboardEndDate] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<'catalogo' | 'client' | 'os' | 'finish-os' | 'despesa' | 'retirada' | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCliId, setEditingCliId] = useState<string | null>(null);
  const [editingOSId, setEditingOSId] = useState<string | null>(null);
  const [finishingOSId, setFinishingOSId] = useState<string | null>(null);
  const [dataConclusao, setDataConclusao] = useState<string>('');
  const [descontoManualFinalizacao, setDescontoManualFinalizacao] = useState<number>(0);

  // 🔒 TRAVA DE SEGURANÇA: Controla se os dados já foram carregados pelo menos uma vez
  // Começa como FALSE para evitar que o auto-sync salve dados vazios antes do carregamento
  const [dataLoaded, setDataLoaded] = useState(false);

  // --- Toast Notifications ---
  const { toast, ToastComponent } = useToastContainer();

  // --- Google Sheets Sync ---
  const {
    isAuthenticated,
    accessToken,
    isSyncing,
    lastSync,
    syncError,
    spreadsheetId,
    authenticate,
    disconnect,
    setSpreadsheetId,
    loadAll, // <--- IMPORTANTE: Carregar dados usando o token
    syncAll, // <--- IMPORTANTE: Salvar dados usando o token
  } = useSheetsSync();

  // --- Persistence Logic (agora com sincronização) ---
  const {
    catalogo,
    stock,
    clients,
    orders,
    retiradas,
    setCatalogo,
    setStock,
    setClients,
    setOrders,
    setRetiradas,
    // NÃO vamos mais usar syncToSheets ou loadFromSheets daqui
  } = useSyncState();

  // Estoque é calculado dinamicamente - não precisa de base separada
  // O estoque disponível é calculado em tempo real baseado nos equipamentos e locações ativas

  // Auto-sync quando houver mudanças (com debounce melhorado)
  useEffect(() => {
    // 🛑 TRAVA DE SEGURANÇA: PARE TUDO SE:
    // 1. Não tiver token
    // 2. OU se os dados ainda não foram carregados pela primeira vez (dataLoaded é false)
    // Isso evita que o app salve arrays vazios na planilha antes de carregar os dados
    if (!isAuthenticated || !accessToken || !dataLoaded) {
      console.log('⏸️ Auto-sync bloqueado:', { isAuthenticated, hasToken: !!accessToken, dataLoaded });
      return;
    }
    
    const timeoutId = setTimeout(async () => {
      try {
        console.log("🔄 Salvando alterações automaticamente...");
        // Passa todos os dados atuais para a função de sincronização
        await syncAll({
          catalogo,
          stock,
          clients,
          orders,
          retiradas,
          despesas
        });
      } catch (err: any) {
        console.error('Erro ao sincronizar (auto-save):', err);
      }
    }, 5000); // Aumentei para 5s para evitar muitas chamadas

    return () => clearTimeout(timeoutId);
  }, [catalogo, stock, clients, orders, retiradas, despesas, isAuthenticated, accessToken, syncAll, dataLoaded]);

  // --- Derived Logic ---
  const activeOrders = useMemo(() => orders.filter(os => os.status === OSStatus.ATIVO), [orders]);
  const historyOrders = useMemo(() => orders.filter(os => os.status === OSStatus.FINALIZADO), [orders]);
  
  const getItemStatus = (id: string) => {
    const isLocado = activeOrders.some(os => os.items.some(item => item.stockItemId === id));
    return isLocado ? EquipmentStatus.LOCADO : EquipmentStatus.DISPONIVEL;
  };

  const getItemClient = (id: string) => {
    const os = activeOrders.find(os => os.items.some(item => item.stockItemId === id));
    return os ? clients.find(c => c.id === os.clientId)?.nome : null;
  };

  // Função para formatar data de YYYY-MM-DD para DD/MM/YY
  const formatDateBR = (dateString: string): string => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    const yearShort = year.slice(-2); // Pega apenas os últimos 2 dígitos do ano
    return `${day}/${month}/${yearShort}`;
  };

  // Calcula quantidade locada de um equipamento (para equipamentos com quantidade)
  const getLocadaQuantity = (equipmentId: string): number => {
    return activeOrders.reduce((total, os) => {
      return total + os.items
        .filter(item => item.equipmentModelId === equipmentId)
        .reduce((sum, item) => sum + (item.quantidade || 1), 0);
    }, 0);
  };

  // Verifica se um equipamento está disponível (não totalmente locado)
  // Calculado dinamicamente baseado nos equipamentos e locações ativas
  const isEquipmentAvailable = (equipment: EquipmentModel): boolean => {
    const quantidadeValue = equipment.quantidade;
    const hasQuantidade = quantidadeValue !== undefined && 
                         quantidadeValue !== null && 
                         (typeof quantidadeValue === 'number' ? quantidadeValue > 0 : false);
    
    if (hasQuantidade) {
      // Equipamento com controle por quantidade
      const locada = getLocadaQuantity(equipment.id);
      return locada < equipment.quantidade;
    } else {
      // Equipamento sem quantidade (controle por ID) - verifica se está locado
      const isLocado = activeOrders.some(os => 
        os.items.some(item => item.equipmentModelId === equipment.id)
      );
      return !isLocado; // Disponível se não estiver locado
    }
  };

  // Gera lista base de estoque disponível (sem considerar newOS ainda - será ajustado depois)
  const availableStockBase = useMemo(() => {
    const items: Array<{
      id: string;
      equipment: EquipmentModel;
      tipo: 'quantidade' | 'id';
      disponivel: number;
      total?: number;
    }> = [];

    // Processa todos os equipamentos cadastrados
    catalogo.forEach(equipment => {
      // Verifica se o equipamento tem controle por quantidade (quantidade definida e > 0)
      const quantidadeValue = equipment.quantidade;
      const hasQuantidade = quantidadeValue !== undefined && 
                           quantidadeValue !== null && 
                           (typeof quantidadeValue === 'number' ? quantidadeValue > 0 : false);
      
      if (hasQuantidade) {
        // Equipamento com controle por quantidade
        // Calcula quantidade disponível = quantidade total - quantidade locada - quantidade na OS atual
        const locadaEmOSAtivas = activeOrders.reduce((total, os) => {
          return total + os.items
            .filter(item => item.equipmentModelId === equipment.id)
            .reduce((sum, item) => sum + (item.quantidade || 1), 0);
        }, 0);
        
        const locada = locadaEmOSAtivas;
        const disponivel = equipment.quantidade - locada;
        
        if (disponivel > 0) {
          items.push({
            id: equipment.id,
            equipment,
            tipo: 'quantidade',
            disponivel,
            total: equipment.quantidade,
          });
        }
      } else {
        // Equipamento sem quantidade (controle por ID)
        // Verifica se está locado em alguma OS ativa ou na OS atual
        const isLocadoEmOSAtivas = activeOrders.some(os => 
          os.items.some(item => item.equipmentModelId === equipment.id)
        );
        
        // Se não está locado, mostra como disponível
        if (!isLocadoEmOSAtivas) {
          items.push({
            id: equipment.id,
            equipment,
            tipo: 'id',
            disponivel: 1,
          });
        }
      }
    });

    return items;
  }, [catalogo, activeOrders]);

  // --- Financial Calculations ---
  const calculateItemCost = (item: OSItem, isReal: boolean = false) => {
    const start = new Date(item.dataInicio);
    const end = isReal && item.dataDevolucaoReal ? new Date(item.dataDevolucaoReal) : new Date(item.dataFimPrevista);
    
    // Calcula a diferença em milissegundos
    const diffTime = Math.max(0, end.getTime() - start.getTime());
    // Converte para dias e arredonda para cima (garantindo pelo menos 1 dia)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1; 
    
    const quantidade = item.quantidade || 1; // Quantidade padrão é 1 se não especificada
    
    // Busca o equipamento para obter a unidade
    // Primeiro tenta usar a unidade armazenada no item, senão busca no equipamento
    let unidade: RentalUnit = item.unidade || RentalUnit.DIARIA; // Usa a unidade do item ou padrão: Diária
    let equipmentFound = null;
    
    // Se o item já tem unidade, usa ela; senão busca no equipamento
    if (!item.unidade) {
      if (item.equipmentModelId) {
        // Busca direta pelo ID do equipamento
        equipmentFound = catalogo.find(e => e.id === item.equipmentModelId);
        if (equipmentFound && equipmentFound.unidade) {
          unidade = equipmentFound.unidade;
        }
      } else if (item.stockItemId) {
        // Para itens por ID, busca o modelo através do stock
        const stockItem = stock.find(s => s.id === item.stockItemId);
        if (stockItem && stockItem.modelId) {
          equipmentFound = catalogo.find(e => e.id === stockItem.modelId);
          if (equipmentFound && equipmentFound.unidade) {
            unidade = equipmentFound.unidade;
          }
        }
      }
    } else {
      // Se já tem unidade no item, busca o equipamento apenas para referência
      if (item.equipmentModelId) {
        equipmentFound = catalogo.find(e => e.id === item.equipmentModelId);
      } else if (item.stockItemId) {
        const stockItem = stock.find(s => s.id === item.stockItemId);
        if (stockItem && stockItem.modelId) {
          equipmentFound = catalogo.find(e => e.id === stockItem.modelId);
        }
      }
    }
    
    // Calcula o valor baseado na unidade
    // Verifica se é mensal comparando o enum
    // Também verifica diretamente no equipamento encontrado para garantir
    const isMes = unidade === RentalUnit.MES || (equipmentFound && equipmentFound.unidade === RentalUnit.MES);
    
    if (isMes) {
      // Mês: Arredondar para cima((Data Final - Data Inicial)/30) * Preço Unitário * Quantidade (quando existente)
      // Garantir que pelo menos 1 mês seja cobrado se houver diferença de dias
      const meses = diffDays > 0 ? Math.ceil(diffDays / 30) : 1;
      const qtd = quantidade || 1; // Quantidade quando existente, senão 1
      const valorCalculado = item.valorNoContrato * meses * qtd;
      
      // Debug temporário para todos os itens mensais - remover depois
      if (equipmentFound) {
        console.log('💰 Cálculo Mensal:', {
          nome: equipmentFound.nome,
          unidade: equipmentFound.unidade,
          valorNoContrato: item.valorNoContrato,
          dataInicio: item.dataInicio,
          dataFim: isReal && item.dataDevolucaoReal ? item.dataDevolucaoReal : item.dataFimPrevista,
          diffDays: diffDays,
          meses: meses,
          quantidade: qtd,
          valorCalculado: valorCalculado
        });
      }
      
      return valorCalculado;
    } else {
      // Diária: diferença de dias * preço unitário * quantidade (quando existente)
      const qtd = quantidade || 1; // Quantidade quando existente, senão 1
      return item.valorNoContrato * diffDays * qtd;
    }
  };

  // --- PDF Generator ---
  const generateOSPDF = (os: ServiceOrder) => {
    const doc = new jsPDF();
    const cli = clients.find(c => c.id === os.clientId);
    const margin = 20;
    let y = 30;

    // Header
    doc.setFontSize(22);
    doc.setTextColor(37, 99, 235); // Blue-600
    doc.text('TOTAL LOC', margin, y);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Total Loc Aluguel de Equipamentos', margin, y + 7);
    
    y += 25;
    doc.setDrawColor(200);
    doc.line(margin, y, 190, y);
    
    // OS Info
    y += 15;
    doc.setFontSize(14);
    doc.setTextColor(30);
    doc.text(`ORDEM DE SERVIÇO: ${os.id}`, margin, y);
    doc.setFontSize(10);
    doc.text(`Status: ${os.status.toUpperCase()}`, 150, y);

    y += 15;
    doc.setFontSize(11);
    doc.text('DADOS DO CLIENTE', margin, y);
    y += 7;
    doc.setFontSize(10);
    doc.setTextColor(80);
    doc.text(`Nome/Razão Social: ${cli?.nome || 'Não identificado'}`, margin, y);
    doc.text(`Contato: ${cli?.telefone || '-'} | ${cli?.email || '-'}`, margin, y + 5);
    const enderecoFormatado = cli?.rua && cli?.numero 
      ? `${cli.rua}, ${cli.numero}${cli.cidade ? ` - ${cli.cidade}` : ''}`
      : cli?.endereco || (cli?.rua ? cli.rua : '') || (cli?.cidade ? cli.cidade : 'Não informado');
    doc.text(`Endereço: ${enderecoFormatado}`, margin, y + 10);

    y += 25;
    doc.setTextColor(30);
    doc.setFontSize(11);
    doc.text('DETALHAMENTO DOS EQUIPAMENTOS', margin, y);
    
    // Table Header
    y += 10;
    doc.setFillColor(245, 247, 250);
    doc.rect(margin, y, 170, 8, 'F');
    doc.setFontSize(9);
    doc.text('Item / Serial', margin + 2, y + 5);
    doc.text('Início', margin + 60, y + 5);
    doc.text('Devolucao', margin + 90, y + 5);
    doc.text('V. Unit', margin + 125, y + 5);
    doc.text('Subtotal', margin + 150, y + 5);

    y += 13;
    os.items.forEach((item) => {
      let model;
      let itemLabel = '';
      
      if (item.stockItemId) {
        // Item por ID específico
        const availableItem = availableStock.find(s => s.id === item.stockItemId && s.tipo === 'id');
        model = availableItem?.equipment;
        itemLabel = `${model?.nome.substring(0, 20)} (ID: ${item.stockItemId})`;
      } else if (item.equipmentModelId) {
        // Item por quantidade
        const availableItem = availableStock.find(s => s.equipment.id === item.equipmentModelId && s.tipo === 'quantidade');
        model = availableItem?.equipment || catalogo.find(m => m.id === item.equipmentModelId);
        const qty = item.quantidade || 1;
        itemLabel = `${model?.nome.substring(0, 20)} (Qtd: ${qty})`;
      }
      
      const cost = calculateItemCost(item, os.status === OSStatus.FINALIZADO);

      doc.text(itemLabel, margin + 2, y);
      doc.text(item.dataInicio, margin + 60, y);
      doc.text(os.status === OSStatus.FINALIZADO ? (item.dataDevolucaoReal || '-') : item.dataFimPrevista, margin + 90, y);
      doc.text(`R$ ${item.valorNoContrato.toLocaleString()}`, margin + 125, y);
      doc.text(`R$ ${cost.toLocaleString()}`, margin + 150, y);
      y += 8;
    });

    // Totals
    y += 15;
    doc.line(margin, y, 190, y);
    y += 10;
    doc.setFontSize(10);
    const subtotal = os.items.reduce((acc, item) => acc + calculateItemCost(item, os.status === OSStatus.FINALIZADO), 0);
    doc.text(`Subtotal Acumulado: R$ ${subtotal.toLocaleString()}`, 130, y);
    doc.setTextColor(220, 38, 38);
    doc.text(`Descontos Aplicados: - R$ ${os.descontoManual.toLocaleString()}`, 130, y + 6);
    
    y += 15;
    doc.setFillColor(37, 99, 235);
    doc.rect(125, y, 65, 12, 'F');
    doc.setTextColor(255);
    doc.setFontSize(12);
    const finalValue = os.status === OSStatus.FINALIZADO ? (os.valorTotalReal || 0) : os.valorTotalPrevisto;
    doc.text(`TOTAL: R$ ${finalValue.toLocaleString()}`, 130, y + 8);

    // Footer
    doc.setTextColor(150);
    doc.setFontSize(8);
    doc.text(`Documento gerado em ${new Date().toLocaleString()} - TOTAL LOC`, margin, 285);

    doc.save(`OS_${os.id}_${cli?.nome.replace(/\s/g, '_')}.pdf`);
  };

  // --- Form States ---
  const [newCat, setNewCat] = useState<Partial<EquipmentModel>>({ 
    unidade: RentalUnit.DIARIA,
    foto: 'https://images.unsplash.com/photo-1581094288338-2314dddb7bc3?w=400' // Foto padrão
  });
  const [newStock, setNewStock] = useState<Partial<StockItem>>({});
  const [newCli, setNewCli] = useState<Partial<Client>>({
    cidade: 'Presidente Olegário-MG' // Valor padrão
  });
  const [newOS, setNewOS] = useState<{
    clientId: string;
    items: OSItem[];
    descontoManual: number;
  }>({
    clientId: '',
    items: [],
    descontoManual: 0
  });

  const [selectedStockId, setSelectedStockId] = useState('');
  const [selectedEquipmentModelId, setSelectedEquipmentModelId] = useState('');
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1);
  const [addMode, setAddMode] = useState<'id' | 'quantity'>('id'); // Modo de adicionar: por ID ou por quantidade
  
  // Estado para despesas
  const [despesas, setDespesas] = useState<Despesa[]>(() => {
    const saved = localStorage.getItem('rental_despesas');
    return saved ? JSON.parse(saved) : [];
  });
  const [newDespesa, setNewDespesa] = useState<Partial<Despesa>>({
    data: new Date().toISOString().split('T')[0], // Data atual como padrão
    agrupador: AgrupadorDespesa.OUTROS, // Valor padrão: Outros
    descricao: '',
    valor: 0
  });
  const [editingDespesaId, setEditingDespesaId] = useState<string | null>(null);

  // Sincroniza despesas com localStorage
  useEffect(() => {
    localStorage.setItem('rental_despesas', JSON.stringify(despesas));
  }, [despesas]);

  const [newRetirada, setNewRetirada] = useState<Partial<Retirada>>({
    dataRetirada: new Date().toISOString().split('T')[0],
    socioRetirada: '',
    valor: 0
  });
  const [editingRetiradaId, setEditingRetiradaId] = useState<string | null>(null);

  // Calcula estoque disponível considerando também itens em newOS (OS sendo criada)
  const availableStock = useMemo(() => {
    return availableStockBase.map(item => {
      if (item.tipo === 'quantidade') {
        // Para equipamentos com quantidade, subtrai quantidades já adicionadas na OS atual
        const locadaNaOSAtual = newOS.items
          .filter(osItem => osItem.equipmentModelId === item.equipment.id)
          .reduce((sum, osItem) => sum + (osItem.quantidade || 1), 0);
        
        const novoDisponivel = item.disponivel - locadaNaOSAtual;
        
        if (novoDisponivel <= 0) {
          return null; // Remove da lista se não há disponível
        }
        
        return {
          ...item,
          disponivel: novoDisponivel
        };
      } else {
        // Para equipamentos por ID, verifica se já foi adicionado na OS atual
        const isAdicionadoNaOSAtual = newOS.items.some(osItem => osItem.equipmentModelId === item.equipment.id);
        
        if (isAdicionadoNaOSAtual) {
          return null; // Remove da lista se já foi adicionado
        }
        
        return item;
      }
    }).filter(item => item !== null) as typeof availableStockBase;
  }, [availableStockBase, newOS.items]);

  const totalOSPrevisto = useMemo(() => {
    const sum = newOS.items.reduce((acc, item) => acc + calculateItemCost(item), 0);
    return Math.max(0, sum - newOS.descontoManual);
  }, [newOS.items, newOS.descontoManual, catalogo, stock]);

  // ==== Dashboard: filtros de período ====
  const filteredOrders = useMemo(() => {
    if (!dashboardStartDate && !dashboardEndDate) return orders;

    const start = dashboardStartDate ? new Date(dashboardStartDate) : null;
    const end = dashboardEndDate ? new Date(dashboardEndDate) : null;

    return orders.filter(os => {
      const date = new Date(os.dataConclusao || new Date());
      if (start && date < start) return false;
      if (end) {
        // incluir o dia final inteiro
        const endInclusive = new Date(end);
        endInclusive.setHours(23, 59, 59, 999);
        if (date > endInclusive) return false;
      }
      return true;
    });
  }, [orders, dashboardStartDate, dashboardEndDate]);

  const filteredDespesas = useMemo(() => {
    if (!dashboardStartDate && !dashboardEndDate) return despesas;

    const start = dashboardStartDate ? new Date(dashboardStartDate) : null;
    const end = dashboardEndDate ? new Date(dashboardEndDate) : null;

    return despesas.filter(d => {
      const date = new Date(d.data);
      if (start && date < start) return false;
      if (end) {
        const endInclusive = new Date(end);
        endInclusive.setHours(23, 59, 59, 999);
        if (date > endInclusive) return false;
      }
      return true;
    });
  }, [despesas, dashboardStartDate, dashboardEndDate]);

  const filteredRetiradas = useMemo(() => {
    if (!dashboardStartDate && !dashboardEndDate) return retiradas;

    const start = dashboardStartDate ? new Date(dashboardStartDate) : null;
    const end = dashboardEndDate ? new Date(dashboardEndDate) : null;

    return retiradas.filter(r => {
      const date = new Date(r.dataRetirada);
      if (start && date < start) return false;
      if (end) {
        const endInclusive = new Date(end);
        endInclusive.setHours(23, 59, 59, 999);
        if (date > endInclusive) return false;
      }
      return true;
    });
  }, [retiradas, dashboardStartDate, dashboardEndDate]);

  // Dashboard data calculations (respeitando o filtro de período)
  const faturamentoHistorico = useMemo(() => {
    const monthly: { [key: string]: number } = {};
    filteredOrders.forEach(os => {
      if (os.valorTotalReal) {
        const date = new Date(os.dataConclusao || new Date());
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthly[key] = (monthly[key] || 0) + os.valorTotalReal;
      }
    });
    return Object.entries(monthly)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([key, value]) => ({
        periodo: key,
        valor: value
      }));
  }, [filteredOrders]);

  const despesasHistorico = useMemo(() => {
    const monthly: { [key: string]: number } = {};
    filteredDespesas.forEach(d => {
      const date = new Date(d.data);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthly[key] = (monthly[key] || 0) + d.valor;
    });
    return Object.entries(monthly)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([key, value]) => ({
        periodo: key,
        valor: value
      }));
  }, [filteredDespesas]);

  const retiradasHistorico = useMemo(() => {
    const monthly: { [key: string]: number } = {};
    filteredRetiradas.forEach(r => {
      const date = new Date(r.dataRetirada);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthly[key] = (monthly[key] || 0) + r.valor;
    });
    return Object.entries(monthly)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([key, value]) => ({
        periodo: key,
        valor: value
      }));
  }, [filteredRetiradas]);

  const resultadoLiquidoHistorico = useMemo(() => {
    const faturamento: { [key: string]: number } = {};
    const despesasData: { [key: string]: number } = {};
    const retiradasData: { [key: string]: number } = {};

    filteredOrders.forEach(os => {
      if (os.valorTotalReal) {
        const date = new Date(os.dataConclusao || new Date());
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        faturamento[key] = (faturamento[key] || 0) + os.valorTotalReal;
      }
    });

    filteredDespesas.forEach(d => {
      const date = new Date(d.data);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      despesasData[key] = (despesasData[key] || 0) + d.valor;
    });

    filteredRetiradas.forEach(r => {
      const date = new Date(r.dataRetirada);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      retiradasData[key] = (retiradasData[key] || 0) + r.valor;
    });

    const allMonths = new Set([
      ...Object.keys(faturamento),
      ...Object.keys(despesasData),
      ...Object.keys(retiradasData)
    ]);

    return Array.from(allMonths)
      .sort()
      .slice(-12)
      .map(key => ({
        periodo: key,
        faturamento: faturamento[key] || 0,
        despesas: despesasData[key] || 0,
        retiradas: retiradasData[key] || 0,
        resultado: (faturamento[key] || 0) - (despesasData[key] || 0)
      }));
  }, [filteredOrders, filteredDespesas, filteredRetiradas]);

  // Resultado Líquido acumulado (Faturamento total - Despesas totais)
  const resultadoLiquidoAcumulado = useMemo(() => {
    const totalFaturamento = filteredOrders.reduce((acc, os) => acc + (os.valorTotalReal || 0), 0);
    const totalDespesas = filteredDespesas.reduce((acc, d) => acc + d.valor, 0);
    return totalFaturamento - totalDespesas;
  }, [filteredOrders, filteredDespesas]);

  // Histórico de Caixa (Resultado Líquido - Retiradas)
  const caixaHistorico = useMemo(() => {
    const faturamento: { [key: string]: number } = {};
    const despesasData: { [key: string]: number } = {};
    const retiradasData: { [key: string]: number } = {};

    filteredOrders.forEach(os => {
      if (os.valorTotalReal) {
        const date = new Date(os.dataConclusao || new Date());
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        faturamento[key] = (faturamento[key] || 0) + os.valorTotalReal;
      }
    });

    filteredDespesas.forEach(d => {
      const date = new Date(d.data);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      despesasData[key] = (despesasData[key] || 0) + d.valor;
    });

    filteredRetiradas.forEach(r => {
      const date = new Date(r.dataRetirada);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      retiradasData[key] = (retiradasData[key] || 0) + r.valor;
    });

    const allMonths = new Set([
      ...Object.keys(faturamento),
      ...Object.keys(despesasData),
      ...Object.keys(retiradasData)
    ]);

    return Array.from(allMonths)
      .sort()
      .slice(-12)
      .map(key => ({
        periodo: key,
        caixa: (faturamento[key] || 0) - (despesasData[key] || 0) - (retiradasData[key] || 0)
      }));
  }, [filteredOrders, filteredDespesas, filteredRetiradas]);

  // --- Handlers ---
  const addItemToOS = () => {
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    if (addMode === 'id') {
      // Modo por ID específico
      if (!selectedStockId) return;
      const availableItem = availableStock.find(item => item.id === selectedStockId && item.tipo === 'id');
      if (!availableItem) return;

      // Verifica se já foi adicionado
      if (newOS.items.some(i => i.stockItemId === selectedStockId)) return;

      // Garantir que valorNoContrato seja sempre um número válido
      const valorNoContrato = (availableItem.equipment.valorUnitario !== undefined && availableItem.equipment.valorUnitario !== null)
        ? Number(availableItem.equipment.valorUnitario)
        : 0;

    setNewOS({
      ...newOS,
      items: [...newOS.items, { 
        stockItemId: selectedStockId, 
        valorNoContrato: valorNoContrato, // Valor validado
        unidade: availableItem.equipment.unidade, // Inclui a unidade do equipamento
        dataInicio: today,
        dataFimPrevista: nextWeek
      }]
    });
    setSelectedStockId('');
    } else {
      // Modo por quantidade
      if (!selectedEquipmentModelId || selectedQuantity <= 0) return;
      const availableItem = availableStock.find(item => item.equipment.id === selectedEquipmentModelId && item.tipo === 'quantidade');
      if (!availableItem || selectedQuantity > availableItem.disponivel) return;

      // Garantir que quantidade e valorNoContrato sejam sempre números válidos
      const quantidade = Number(selectedQuantity) || 1;
      const valorNoContrato = (availableItem.equipment.valorUnitario !== undefined && availableItem.equipment.valorUnitario !== null)
        ? Number(availableItem.equipment.valorUnitario)
        : 0;

      // Verifica se já foi adicionado este modelo (combina se já existir)
      const existingItem = newOS.items.find(i => 
        i.equipmentModelId === selectedEquipmentModelId && 
        i.dataInicio === today && 
        i.dataFimPrevista === nextWeek
      );

      if (existingItem) {
        // Atualiza quantidade existente (garantir que seja número válido)
        const quantidadeExistente = (existingItem.quantidade !== undefined && existingItem.quantidade !== null)
          ? Number(existingItem.quantidade)
          : 1;
        const novaQuantidade = quantidadeExistente + quantidade;
        
        setNewOS({
          ...newOS,
          items: newOS.items.map(i => 
            i.equipmentModelId === selectedEquipmentModelId && 
            i.dataInicio === today && 
            i.dataFimPrevista === nextWeek
              ? { ...i, quantidade: novaQuantidade } // Valor validado
              : i
          )
        });
      } else {
        // Adiciona novo item
      setNewOS({
        ...newOS,
        items: [...newOS.items, { 
          equipmentModelId: selectedEquipmentModelId,
          quantidade: quantidade, // Valor validado
          valorNoContrato: valorNoContrato, // Valor validado
          unidade: availableItem.equipment.unidade, // Inclui a unidade do equipamento
          dataInicio: today,
          dataFimPrevista: nextWeek
        }]
      });
      }
      setSelectedEquipmentModelId('');
      setSelectedQuantity(1);
    }
  };

  const updateItemDate = (itemId: string, field: 'dataInicio' | 'dataFimPrevista', value: string, isStockItem: boolean = true) => {
    setNewOS(prevOS => ({
      ...prevOS,
      items: prevOS.items.map(i => {
        if (isStockItem && i.stockItemId === itemId) {
          return { ...i, [field]: value };
        } else if (!isStockItem && i.equipmentModelId === itemId) {
          return { ...i, [field]: value };
        }
        return i;
      })
    }));
  };

  const updateItemQuantity = (equipmentModelId: string, quantidade: number) => {
    setNewOS({
      ...newOS,
      items: newOS.items.map(i => 
        i.equipmentModelId === equipmentModelId 
          ? { ...i, quantidade: Math.max(1, quantidade) }
          : i
      )
    });
  };

  const removeItemFromOS = (item: OSItem) => {
    if (item.stockItemId) {
      setNewOS({
        ...newOS,
        items: newOS.items.filter(i => i.stockItemId !== item.stockItemId)
      });
    } else if (item.equipmentModelId) {
      setNewOS({
        ...newOS,
        items: newOS.items.filter(i => i.equipmentModelId !== item.equipmentModelId || 
          i.dataInicio !== item.dataInicio || 
          i.dataFimPrevista !== item.dataFimPrevista)
      });
    }
  };

  const handleEditOS = (id: string) => {
    const os = orders.find(o => o.id === id);
    if (!os) return;
    
    setEditingOSId(id);
    setNewOS({
      clientId: os.clientId,
      items: [...os.items],
      descontoManual: os.descontoManual
    });
    setIsModalOpen('os');
  };

  const handleDeleteOS = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta locação? Esta ação não pode ser desfeita.')) {
      const updatedOrders = orders.filter(os => os.id !== id);
      setOrders(updatedOrders);
      toast.success('Locação excluída com sucesso!');
      
      // 💾 Sincronização imediata com Google Sheets após excluir
      if (isAuthenticated && accessToken && dataLoaded) {
        try {
          await syncAll({
            catalogo,
            stock,
            clients,
            orders: updatedOrders,
            retiradas,
            despesas
          });
          console.log('✅ Locação removida e sincronizada com Google Sheets');
        } catch (err: any) {
          console.error('❌ Erro ao sincronizar exclusão:', err);
          toast.error('Locação excluída localmente, mas houve erro ao sincronizar com Google Sheets');
        }
      }
    }
  };

  const handleCreateOS = async () => {
    if (!newOS.clientId || newOS.items.length === 0) return;
    
    // Garantir que valores numéricos sejam sempre números válidos
    const descontoManual = (newOS.descontoManual !== undefined && newOS.descontoManual !== null)
      ? Number(newOS.descontoManual)
      : 0;
    
    const valorTotalPrevisto = (totalOSPrevisto !== undefined && totalOSPrevisto !== null)
      ? Number(totalOSPrevisto)
      : 0;
    
    let updatedOrders: ServiceOrder[];
    if (editingOSId) {
      // Modo edição
      updatedOrders = orders.map(os => 
        os.id === editingOSId 
          ? {
              ...os,
              clientId: newOS.clientId,
              items: [...newOS.items],
              descontoManual: descontoManual, // Valor validado
              valorTotalPrevisto: valorTotalPrevisto // Valor validado
            }
          : os
      );
      setOrders(updatedOrders);
      toast.success('Locação atualizada com sucesso!');
      setEditingOSId(null);
    } else {
      // Modo criação
      const os: ServiceOrder = {
        id: 'OS-' + Math.floor(1000 + Math.random() * 9000),
        clientId: newOS.clientId,
        items: [...newOS.items],
        descontoManual: descontoManual, // Valor validado
        status: OSStatus.ATIVO,
        valorTotalPrevisto: valorTotalPrevisto // Valor validado
      };

      updatedOrders = [...orders, os];
      setOrders(updatedOrders);
      toast.success('Locação criada com sucesso!');
    }

    // 💾 Sincronização imediata com Google Sheets após salvar
    if (isAuthenticated && accessToken && dataLoaded) {
      try {
        await syncAll({
          catalogo,
          stock,
          clients,
          orders: updatedOrders,
          retiradas
        });
        console.log('✅ Locação sincronizada com Google Sheets');
      } catch (err: any) {
        console.error('❌ Erro ao sincronizar locação:', err);
        toast.error('Locação salva localmente, mas houve erro ao sincronizar com Google Sheets');
      }
    }

    setIsModalOpen(null);
    setNewOS({ clientId: '', items: [], descontoManual: 0 });
  };

  const handleFinishOS = (id: string) => {
    const os = orders.find(o => o.id === id);
    setFinishingOSId(id);
    const today = new Date().toISOString().split('T')[0];
    setDataConclusao(today);
    setDescontoManualFinalizacao(os?.descontoManual || 0);
    setIsModalOpen('finish-os');
  };

  const finishOS = async () => {
    if (!finishingOSId || !dataConclusao) {
      toast.error('Informe a data de conclusão');
      return;
    }

    // Garantir que descontoManualFinalizacao seja sempre um número válido
    const descontoManual = (descontoManualFinalizacao !== undefined && descontoManualFinalizacao !== null)
      ? Number(descontoManualFinalizacao)
      : 0;

    let updatedOS: ServiceOrder | null = null;

    // Usar uma função que retorna o estado atualizado de forma mais segura
    const updatedOrders = orders.map(os => {
      if (os.id === finishingOSId) {
        const updatedItems = os.items.map(item => ({ ...item, dataDevolucaoReal: dataConclusao }));
        const realTotal = updatedItems.reduce((acc, item) => {
          const itemWithCompletion = { ...item, dataDevolucaoReal: dataConclusao };
          return acc + calculateItemCost(itemWithCompletion, true);
        }, 0) - descontoManual;
        const valorTotalReal = Math.max(0, Number(realTotal)); // Garantir que seja número válido
        updatedOS = { 
          ...os, 
          status: OSStatus.FINALIZADO, 
          items: updatedItems,
          descontoManual: descontoManual, // Valor validado
          valorTotalReal: valorTotalReal, // Valor validado
          dataConclusao: dataConclusao
        };
        return updatedOS;
      }
      return os;
    });

    setOrders(updatedOrders);

    // Trigger PDF generation for the finalized OS
    if (updatedOS) {
      setTimeout(() => generateOSPDF(updatedOS!), 500);
    }
    toast.success('Ordem de serviço finalizada com sucesso!');

    // 💾 Sincronização imediata com Google Sheets após finalizar
    if (isAuthenticated && accessToken && dataLoaded) {
      try {
        await syncAll({
          catalogo,
          stock,
          clients,
          orders: updatedOrders,
          retiradas,
          despesas
        });
        console.log('✅ Ordem finalizada e sincronizada com Google Sheets');
      } catch (err: any) {
        console.error('❌ Erro ao sincronizar finalização:', err);
        toast.error('Ordem finalizada localmente, mas houve erro ao sincronizar com Google Sheets');
      }
    }

    setIsModalOpen(null);
    setFinishingOSId(null);
    setDataConclusao('');
    setDescontoManualFinalizacao(0);
  };

  // Função auxiliar para gerar ID único de cliente
  const generateUniqueClientId = (): string => {
    let id: string;
    do {
      id = 'CLI-' + Math.floor(1000 + Math.random() * 9000);
    } while (clients.some(c => c.id === id));
    return id;
  };

  // Função auxiliar para gerar ID único de equipamento
  const generateUniqueEquipmentId = (): string => {
    let id: string;
    do {
      id = 'EQ-' + Math.floor(1000 + Math.random() * 9000);
    } while (catalogo.some(e => e.id === id));
    return id;
  };

  // Função para excluir equipamento
  const handleDeleteEquipment = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este equipamento? Isso também excluirá todos os itens de estoque relacionados.')) {
      const updatedCatalogo = catalogo.filter(e => e.id !== id);
      const updatedStock = stock.filter(s => s.modelId !== id);
      setCatalogo(updatedCatalogo);
      setStock(updatedStock);
      toast.success('Equipamento excluído com sucesso!');
      
      // 💾 Sincronização imediata com Google Sheets após excluir
      if (isAuthenticated && accessToken && dataLoaded) {
        try {
        await syncAll({
          catalogo: updatedCatalogo,
          stock: updatedStock,
          clients,
          orders,
          retiradas,
          despesas
        });
          console.log('✅ Equipamento removido e sincronizado com Google Sheets');
        } catch (err: any) {
          console.error('❌ Erro ao sincronizar exclusão:', err);
          toast.error('Equipamento excluído localmente, mas houve erro ao sincronizar com Google Sheets');
        }
      }
    }
  };

  const handleAddCatalog = async () => {
    // Garantir que valorUnitario seja sempre um número válido
    const valorUnitario = (newCat.valorUnitario !== undefined && newCat.valorUnitario !== null)
      ? Number(newCat.valorUnitario)
      : 0;
    
    if (!newCat.nome || valorUnitario <= 0) {
      toast.error('Preencha pelo menos nome e valor unitário válido');
      return;
    }

    let updatedCatalogo: EquipmentModel[];
    if (editingCatId) {
      // Modo edição
      updatedCatalogo = catalogo.map(item => 
        item.id === editingCatId 
          ? {
              ...item,
              nome: newCat.nome!,
              descricao: newCat.descricao || '',
              valorUnitario: valorUnitario, // Usa o valor convertido
              unidade: newCat.unidade || RentalUnit.DIARIA,
              foto: newCat.foto || undefined,
              numSerie: newCat.numSerie || undefined,
              quantidade: newCat.quantidade !== undefined ? newCat.quantidade : undefined,
            }
          : item
      );
      setCatalogo(updatedCatalogo);
      toast.success('Equipamento atualizado com sucesso!');
    } else {
      // Modo criação - sempre gera ID automaticamente
    const item: EquipmentModel = {
      id: generateUniqueEquipmentId(),
      nome: newCat.nome,
      descricao: newCat.descricao || '',
        valorUnitario: valorUnitario, // Usa o valor convertido
      unidade: newCat.unidade || RentalUnit.DIARIA,
        foto: newCat.foto || undefined,
        numSerie: newCat.numSerie || undefined,
        quantidade: newCat.quantidade !== undefined ? newCat.quantidade : undefined,
    };
      updatedCatalogo = [...catalogo, item];
      setCatalogo(updatedCatalogo);
      toast.success('Equipamento cadastrado com sucesso!');
    }

    // 💾 Sincronização imediata com Google Sheets após salvar
    if (isAuthenticated && accessToken && dataLoaded) {
      try {
        await syncAll({
          catalogo: updatedCatalogo,
          stock,
          clients,
          orders,
          retiradas,
          despesas
        });
        console.log('✅ Equipamento sincronizado com Google Sheets');
      } catch (err: any) {
        console.error('❌ Erro ao sincronizar equipamento:', err);
        toast.error('Equipamento salvo localmente, mas houve erro ao sincronizar com Google Sheets');
      }
    }

    setNewCat({ unidade: RentalUnit.DIARIA, foto: 'https://images.unsplash.com/photo-1581094288338-2314dddb7bc3?w=400' });
    setEditingCatId(null);
    setIsModalOpen(null);
  };

  const handleEditCatalog = (equipamento: EquipmentModel) => {
    setNewCat({
      id: equipamento.id,
      nome: equipamento.nome,
      descricao: equipamento.descricao,
      valorUnitario: equipamento.valorUnitario,
      unidade: equipamento.unidade,
      foto: equipamento.foto || 'https://images.unsplash.com/photo-1581094288338-2314dddb7bc3?w=400',
      numSerie: equipamento.numSerie,
      quantidade: equipamento.quantidade,
    });
    setEditingCatId(equipamento.id);
    setIsModalOpen('catalogo');
  };

  // Função auxiliar para gerar ID único de item de estoque
  const generateUniqueStockId = (): string => {
    let id: string;
    do {
      id = 'SN-' + Math.floor(1000 + Math.random() * 9000);
    } while (stock.some(s => s.id === id));
    return id;
  };

  const handleAddStock = () => {
    if (!newStock.modelId) {
      toast.error('Selecione um equipamento');
      return;
    }

    // Sempre gera ID automaticamente se não fornecido
    const item: StockItem = {
      id: newStock.id || generateUniqueStockId(),
      modelId: newStock.modelId,
      foto: newStock.foto || catalogo.find(m => m.id === newStock.modelId)?.foto || 'https://images.unsplash.com/photo-1581094288338-2314dddb7bc3?w=400',
    };
    setStock([...stock, item]);
    setNewStock({});
    setIsModalOpen(null);
    toast.success('Item de estoque adicionado com sucesso!');
  };

  // Função para gerar ID único de despesa
  const generateUniqueDespesaId = (): string => {
    let newId: string;
    do {
      newId = 'DESP-' + Math.floor(1000 + Math.random() * 9000);
    } while (despesas.some(d => d.id === newId));
    return newId;
  };

  // Função para gerar ID único de retirada
  const generateUniqueRetiradaId = (): string => {
    let newId: string;
    do {
      newId = 'RET-' + Math.floor(1000 + Math.random() * 9000);
    } while (retiradas.some(r => r.id === newId));
    return newId;
  };

  // Função para excluir retirada
  const handleDeleteRetirada = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta retirada?')) {
      const updatedRetiradas = retiradas.filter(r => r.id !== id);
      setRetiradas(updatedRetiradas);
      toast.success('Retirada excluída com sucesso!');
      
      // 💾 Sincronização imediata com Google Sheets após excluir
      if (isAuthenticated && accessToken && dataLoaded) {
        try {
          await syncAll({
            catalogo,
            stock,
            clients,
            orders,
            retiradas: updatedRetiradas,
            despesas
          });
          console.log('✅ Retirada removida e sincronizada com Google Sheets');
        } catch (err: any) {
          console.error('❌ Erro ao sincronizar exclusão:', err);
          toast.error('Retirada excluída localmente, mas houve erro ao sincronizar com Google Sheets');
        }
      }
    }
  };

  const handleAddRetirada = async () => {
    if (!newRetirada.dataRetirada || !newRetirada.socioRetirada || !newRetirada.valor) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    // Garantir que valor seja sempre um número válido (0 se undefined/null)
    const valor = (newRetirada.valor !== undefined && newRetirada.valor !== null)
      ? Number(newRetirada.valor)
      : 0;

    let updatedRetiradas: Retirada[];
    if (editingRetiradaId) {
      // Editar retirada existente
      updatedRetiradas = retiradas.map(r => 
        r.id === editingRetiradaId 
          ? {
              id: editingRetiradaId,
              dataRetirada: newRetirada.dataRetirada!,
              socioRetirada: newRetirada.socioRetirada!,
              valor: valor // Valor validado
            }
          : r
      );
      setRetiradas(updatedRetiradas);
      toast.success('Retirada atualizada com sucesso!');
    } else {
      // Adicionar nova retirada
      const retirada: Retirada = {
        id: generateUniqueRetiradaId(),
        dataRetirada: newRetirada.dataRetirada!,
        socioRetirada: newRetirada.socioRetirada!,
        valor: valor // Valor validado
      };
      updatedRetiradas = [...retiradas, retirada];
      setRetiradas(updatedRetiradas);
      toast.success('Retirada cadastrada com sucesso!');
    }

    // 💾 Sincronização imediata com Google Sheets após salvar
    if (isAuthenticated && accessToken && dataLoaded) {
      try {
        await syncAll({
          catalogo,
          stock,
          clients,
          orders,
          retiradas: updatedRetiradas
        });
        console.log('✅ Retirada sincronizada com Google Sheets');
      } catch (err: any) {
        console.error('❌ Erro ao sincronizar retirada:', err);
        toast.error('Retirada salva localmente, mas houve erro ao sincronizar com Google Sheets');
      }
    }

    setNewRetirada({
      dataRetirada: new Date().toISOString().split('T')[0],
      socioRetirada: '',
      valor: 0
    });
    setEditingRetiradaId(null);
    setIsModalOpen(null);
  };

  // Função para excluir despesa
  const handleDeleteDespesa = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta despesa?')) {
      const updatedDespesas = despesas.filter(d => d.id !== id);
      setDespesas(updatedDespesas);
      toast.success('Despesa excluída com sucesso!');
      
      // 💾 Sincronização imediata com Google Sheets após excluir
      if (isAuthenticated && accessToken && dataLoaded) {
        try {
          await syncAll({
            catalogo,
            stock,
            clients,
            orders,
            retiradas,
            despesas: updatedDespesas
          });
          console.log('✅ Despesa removida e sincronizada com Google Sheets');
        } catch (err: any) {
          console.error('❌ Erro ao sincronizar exclusão:', err);
          toast.error('Despesa excluída localmente, mas houve erro ao sincronizar com Google Sheets');
        }
      }
    }
  };

  const handleAddDespesa = async () => {
    if (!newDespesa.data || !newDespesa.agrupador || !newDespesa.descricao || !newDespesa.valor) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    // Garantir que valor seja sempre um número válido
    const valor = (newDespesa.valor !== undefined && newDespesa.valor !== null)
      ? Number(newDespesa.valor)
      : 0;

    let updatedDespesas: Despesa[];
    if (editingDespesaId) {
      // Editar despesa existente
      updatedDespesas = despesas.map(d => 
        d.id === editingDespesaId 
          ? {
              id: editingDespesaId,
              data: newDespesa.data!,
              agrupador: newDespesa.agrupador!,
              descricao: newDespesa.descricao!,
              valor: valor // Valor validado
            }
          : d
      );
      setDespesas(updatedDespesas);
      toast.success('Despesa atualizada com sucesso!');
    } else {
      // Adicionar nova despesa
      const despesa: Despesa = {
        id: generateUniqueDespesaId(),
        data: newDespesa.data!,
        agrupador: newDespesa.agrupador!,
        descricao: newDespesa.descricao!,
        valor: valor // Valor validado
      };
      updatedDespesas = [...despesas, despesa];
      setDespesas(updatedDespesas);
      toast.success('Despesa cadastrada com sucesso!');
    }

    // 💾 Sincronização imediata com Google Sheets após salvar
    if (isAuthenticated && accessToken && dataLoaded) {
      try {
        await syncAll({
          catalogo,
          stock,
          clients,
          orders,
          retiradas,
          despesas: updatedDespesas
        });
        console.log('✅ Despesa sincronizada com Google Sheets');
      } catch (err: any) {
        console.error('❌ Erro ao sincronizar despesa:', err);
        toast.error('Despesa salva localmente, mas houve erro ao sincronizar com Google Sheets');
      }
    }

    setNewDespesa({
      data: new Date().toISOString().split('T')[0],
      agrupador: AgrupadorDespesa.OUTROS, // Valor padrão: Outros
      descricao: '',
      valor: 0
    });
    setEditingDespesaId(null);
    setIsModalOpen(null);
  };

  const handleDeleteClient = async (id: string) => {
    // Verificar se o cliente está sendo usado em alguma locação ativa
    const hasActiveOrders = activeOrders.some(os => os.clientId === id);
    
    if (hasActiveOrders) {
      toast.error('Não é possível excluir este cliente pois ele possui locações ativas!');
      return;
    }

    if (window.confirm('Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.')) {
      const updatedClients = clients.filter(c => c.id !== id);
      setClients(updatedClients);
      toast.success('Cliente excluído com sucesso!');
      
      // 💾 Sincronização imediata com Google Sheets após excluir
      if (isAuthenticated && accessToken && dataLoaded) {
        try {
          await syncAll({
            catalogo,
            stock,
            clients: updatedClients,
            orders,
            retiradas,
            despesas
          });
          console.log('✅ Cliente removido e sincronizado com Google Sheets');
        } catch (err: any) {
          console.error('❌ Erro ao sincronizar exclusão:', err);
          toast.error('Cliente excluído localmente, mas houve erro ao sincronizar com Google Sheets');
        }
      }
    }
  };

  const handleAddClient = async () => {
    if (!newCli.nome || !newCli.telefone || !newCli.email) {
      toast.error('Preencha pelo menos nome, telefone e email');
      return;
    }

    let updatedClients: Client[];
    if (editingCliId) {
      // Modo edição
      updatedClients = clients.map(item => 
        item.id === editingCliId 
          ? {
              ...item,
              nome: newCli.nome!,
              telefone: newCli.telefone || '',
              email: newCli.email || '',
              rua: newCli.rua || undefined,
              numero: newCli.numero || undefined,
              cidade: newCli.cidade || 'Presidente Olegário-MG',
              tipoDocumento: newCli.tipoDocumento,
              documento: newCli.documento?.replace(/\D/g, '') || undefined,
            }
          : item
      );
      setClients(updatedClients);
      toast.success('Cliente atualizado com sucesso!');
    } else {
      // Modo criação - sempre gera ID automaticamente
      const client: Client = {
        id: generateUniqueClientId(),
        nome: newCli.nome,
        telefone: newCli.telefone || '',
        email: newCli.email || '',
        rua: newCli.rua || undefined,
        numero: newCli.numero || undefined,
        cidade: newCli.cidade || 'Presidente Olegário-MG',
        tipoDocumento: newCli.tipoDocumento,
        documento: newCli.documento?.replace(/\D/g, '') || undefined, // Salva apenas números
      };
      updatedClients = [...clients, client];
      setClients(updatedClients);
      toast.success('Cliente cadastrado com sucesso!');
    }

    // 💾 Sincronização imediata com Google Sheets após salvar
    if (isAuthenticated && accessToken && dataLoaded) {
      try {
        await syncAll({
          catalogo,
          stock,
          clients: updatedClients,
          orders,
          retiradas
        });
        console.log('✅ Cliente sincronizado com Google Sheets');
      } catch (err: any) {
        console.error('❌ Erro ao sincronizar cliente:', err);
        toast.error('Cliente salvo localmente, mas houve erro ao sincronizar com Google Sheets');
      }
    }

    setNewCli({ cidade: 'Presidente Olegário-MG' }); // Reset mantém cidade padrão
    setEditingCliId(null);
    setIsModalOpen(null);
  };


  // --- AI Logic ---
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant'; text: string }[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;
    const q = userInput;
    setUserInput('');
    setChatHistory(prev => [...prev, { role: 'user', text: q }]);
    setIsLoadingAI(true);
    const answer = await askArchitect(q);
    setChatHistory(prev => [...prev, { role: 'assistant', text: answer }]);
    setIsLoadingAI(false);
  };

  // Se não estiver autenticado com Google, mostrar tela de login
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl mb-4">
              <Package className="text-white" size={40} />
            </div>
            <h1 className="text-4xl font-black text-white mb-2">TOTAL LOC</h1>
            <p className="text-blue-100 text-sm">Sistema de Gestão de Locação de Equipamentos</p>
          </div>
          <GoogleAuth
            isAuthenticated={isAuthenticated}
            accessToken={accessToken}
            spreadsheetId={spreadsheetId}
            setSpreadsheetId={(id) => {
              setSpreadsheetId(id);
            }}
            isSyncing={isSyncing}
            syncError={syncError}
            lastSync={lastSync}
            onAuthenticate={(spreadsheetId, accessToken) => {
              authenticate(spreadsheetId, accessToken);
              toast.success('Conectado ao Google Sheets com sucesso!');
            }}
            onDisconnect={() => {
              disconnect();
              // Resetar dataLoaded quando desconectar para garantir que o próximo login requer carregamento manual
              setDataLoaded(false);
              toast.success('Desconectado com sucesso!');
            }}
            onLoadFromSheets={async () => {
              try {
                // Usa a função loadAll do useSheetsSync (que tem o token)
                const data = await loadAll();
                
                if (data) {
                  // Atualiza os estados da tela com os dados que vieram da planilha
                  setCatalogo(data.catalogo);
                  setClients(data.clients);
                  setOrders(data.orders);
                  setRetiradas(data.retiradas);
                  setDespesas(data.despesas || []); // Carrega despesas do Google Sheets
                  // Estoque é calculado dinamicamente, não precisa setar se não vier
                  if(data.stock && data.stock.length > 0) setStock(data.stock);
                  
                  // ✅ LIBERA O SALVAMENTO AUTOMÁTICO
                  // Agora que os dados foram carregados com sucesso, é seguro permitir o auto-sync
                  setDataLoaded(true);
                  
                  const totalItems = data.catalogo.length + data.clients.length + data.orders.length + (data.retiradas?.length || 0) + (data.despesas?.length || 0);
                  const message = `Dados carregados com sucesso! (${totalItems} registros)`;
                  toast.success(message);
                  return { success: true, message };
                }
                const errorMsg = 'Nenhum dado retornado.';
                toast.error(errorMsg);
                return { success: false, message: errorMsg };
              } catch (error: any) {
                console.error('Erro ao carregar dados:', error);
                const errorMsg = error.message || 'Erro ao carregar dados';
                toast.error(errorMsg);
                return { success: false, message: errorMsg };
              }
            }}
            onSyncToSheets={async () => {
              // Usa a função syncAll passando os dados atuais da tela
              await syncAll({
                catalogo,
                stock,
                clients,
                orders,
                retiradas
              });
              toast.success('Dados sincronizados com sucesso!');
            }}
          />
        </div>
        <ToastComponent />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-900">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`fixed md:static inset-y-0 left-0 w-72 bg-slate-900 text-white flex flex-col shrink-0 z-50 md:z-20 shadow-2xl transform transition-transform duration-300 ease-in-out ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <div className="p-8 flex items-center gap-4">
          <div className="bg-blue-600 p-2.5 rounded-2xl shadow-xl shadow-blue-500/20">
            <LayoutGrid size={28} />
          </div>
          <div className="flex-1">
            <h1 className="font-black text-xl tracking-tighter leading-none text-white">TOTAL LOC</h1>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Aluguel de Equipamentos</span>
          </div>
          {/* Mobile Close Button */}
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-2xl p-2 transition-all"
            title="Fechar menu"
          >
            <XIcon size={20} className="text-white" />
          </button>
          <button
            onClick={() => {
              disconnect();
              toast.success('Desconectado com sucesso!');
            }}
            className="hidden md:block bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-2xl p-2 transition-all"
            title="Desconectar do Google"
          >
            <LogOut size={20} className="text-white" />
          </button>
        </div>
        
        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
          <NavButton icon={<TrendingUp size={20} />} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }} />
          
          <div className="py-2 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Cadastro</div>
          <NavButton icon={<Tag size={20} />} label="Equipamentos" active={activeTab === 'catalogo'} onClick={() => { setActiveTab('catalogo'); setIsMobileMenuOpen(false); }} />
          <NavButton icon={<Users size={20} />} label="Clientes" active={activeTab === 'clientes'} onClick={() => { setActiveTab('clientes'); setIsMobileMenuOpen(false); }} />
          
          <div className="py-2 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Operação</div>
          <NavButton icon={<ClipboardCheck size={20} />} label="Locações" active={activeTab === 'locacoes'} onClick={() => { setActiveTab('locacoes'); setIsMobileMenuOpen(false); }} />
          <NavButton icon={<Layers size={20} />} label="Estoque" active={activeTab === 'estoque'} onClick={() => { setActiveTab('estoque'); setIsMobileMenuOpen(false); }} />
          <NavButton icon={<DollarSign size={20} />} label="Despesas" active={activeTab === 'despesas'} onClick={() => { setActiveTab('despesas'); setIsMobileMenuOpen(false); }} />
          <NavButton icon={<ArrowDownCircle size={20} />} label="Retiradas" active={activeTab === 'retiradas'} onClick={() => { setActiveTab('retiradas'); setIsMobileMenuOpen(false); }} />
          <NavButton icon={<History size={20} />} label="Histórico" active={activeTab === 'historico'} onClick={() => { setActiveTab('historico'); setIsMobileMenuOpen(false); }} />
          
          <div className="py-2 px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Suporte</div>
          <NavButton icon={<Bot size={20} />} label="Consultoria IA" active={activeTab === 'ai-assistant'} onClick={() => { setActiveTab('ai-assistant'); setIsMobileMenuOpen(false); }} />
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto h-screen flex flex-col">
        <header className="bg-white border-b border-slate-200 px-4 md:px-8 py-5 flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 hover:bg-slate-100 rounded-xl transition-colors"
              aria-label="Abrir menu"
            >
              <Menu size={24} className="text-slate-800" />
            </button>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight capitalize">
              {activeTab === 'catalogo' ? 'Equipamentos' :
               activeTab === 'locacoes' ? 'Locações' :
               activeTab === 'clientes' ? 'Clientes' :
               activeTab === 'estoque' ? 'Estoque' :
               activeTab === 'historico' ? 'Histórico' :
               activeTab === 'despesas' ? 'Despesas' :
               activeTab === 'retiradas' ? 'Retiradas' :
               activeTab === 'ai-assistant' ? 'Consultoria IA' :
               activeTab.replace('_', ' ')}
            </h2>
            <div className="h-6 w-[1px] bg-slate-200 hidden md:block"></div>
            <div className="hidden md:flex items-center gap-2 text-xs font-bold text-slate-400">
               <Calendar size={14}/> {new Date().toLocaleDateString('pt-BR')}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                placeholder="Buscar contrato ou item..." 
                className="bg-slate-100 border-none rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 w-64 outline-none transition-all"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <SyncStatus
              isSyncing={isSyncing}
              lastSync={lastSync}
              error={syncError}
              isAuthenticated={isAuthenticated}
              onSync={async () => {
                try {
                  await syncAll({
                    catalogo,
                    stock,
                    clients,
                    orders,
                    retiradas
                  });
                  toast.success('Dados sincronizados com sucesso!');
                } catch (error: any) {
                  toast.error(`Erro ao sincronizar: ${error.message || 'Erro desconhecido'}`);
                }
              }}
            />
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-blue-600 text-white rounded-2xl px-4 py-2 shadow-lg shadow-blue-500/30">
                <UserIcon size={16} />
                <span className="text-sm font-bold">Conectado</span>
              </div>
            </div>
          </div>
        </header>

        <div className="p-6 md:p-8 flex-1">
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              {/* Filtro de período */}
              <div className="bg-white p-4 md:p-6 rounded-3xl border border-slate-200 flex flex-col md:flex-row md:items-end gap-4 justify-between">
                <div>
                  <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest mb-2">
                    Período do Dashboard
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Defina data inicial e final para filtrar os gráficos e indicadores financeiros.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex flex-col text-[11px] text-slate-600">
                    <span className="mb-1 font-semibold uppercase tracking-widest">Data inicial</span>
                    <input
                      type="date"
                      className="border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={dashboardStartDate}
                      onChange={e => setDashboardStartDate(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col text-[11px] text-slate-600">
                    <span className="mb-1 font-semibold uppercase tracking-widest">Data final</span>
                    <input
                      type="date"
                      className="border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={dashboardEndDate}
                      onChange={e => setDashboardEndDate(e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setDashboardStartDate('');
                      setDashboardEndDate('');
                    }}
                    className="self-end bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold uppercase tracking-widest px-4 py-2 rounded-xl transition-all"
                  >
                    Limpar período
                  </button>
                </div>
              </div>

              {/* Cards de Resumo */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                <StatCard label="Locações Ativas" value={activeOrders.length} color="blue" />
                <StatCard label="Equipamentos Locados" value={activeOrders.reduce((acc, os) => acc + os.items.length, 0)} color="indigo" />
                <StatCard label="Ociosidade" value={`${Math.round((1 - (activeOrders.reduce((acc, os) => acc + os.items.length, 0) / (stock.length || 1))) * 100)}%`} color="green" />
                <StatCard label="Equipamentos Disponíveis" value={availableStock.length} color="emerald" />
                <StatCard label="Resultado Líquido Acumulado" value={`R$ ${resultadoLiquidoAcumulado.toLocaleString()}`} color="orange" />
              </div>

              {/* Gráficos de Histórico */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Histórico de Faturamento de Locações */}
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
                  <h3 className="font-black text-slate-800 mb-6 uppercase text-xs tracking-widest flex items-center gap-2">
                    <DollarSign size={16} className="text-blue-500"/> Faturamento de Locações
                  </h3>
                  <div className="h-72 min-h-[288px]">
                    <ResponsiveContainer width="100%" height="100%" minHeight={288} minWidth={0}>
                      <LineChart data={faturamentoHistorico}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="periodo" axisLine={false} tickLine={false} fontSize={11} />
                        <YAxis axisLine={false} tickLine={false} fontSize={11} tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`} />
                        <Tooltip cursor={{fill: '#f8fafc'}} formatter={(val: number) => `R$ ${val.toLocaleString()}`} />
                        <Line type="monotone" dataKey="valor" stroke="#2563eb" strokeWidth={3} dot={{ fill: '#2563eb', r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Histórico de Despesas */}
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
                  <h3 className="font-black text-slate-800 mb-6 uppercase text-xs tracking-widest flex items-center gap-2">
                    <ShoppingCart size={16} className="text-red-500"/> Histórico de Despesas
                  </h3>
                  <div className="h-72 min-h-[288px]">
                    <ResponsiveContainer width="100%" height="100%" minHeight={288} minWidth={0}>
                      <BarChart data={despesasHistorico}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="periodo" axisLine={false} tickLine={false} fontSize={11} />
                        <YAxis axisLine={false} tickLine={false} fontSize={11} tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`} />
                        <Tooltip cursor={{fill: '#f8fafc'}} formatter={(val: number) => `R$ ${val.toLocaleString()}`} />
                        <Bar dataKey="valor" fill="#ef4444" radius={[6,6,0,0]} barSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Histórico de Retiradas */}
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
                  <h3 className="font-black text-slate-800 mb-6 uppercase text-xs tracking-widest flex items-center gap-2">
                    <ArrowDownCircle size={16} className="text-orange-500"/> Histórico de Retiradas
                  </h3>
                  <div className="h-72 min-h-[288px]">
                    <ResponsiveContainer width="100%" height="100%" minHeight={288} minWidth={0}>
                      <BarChart data={retiradasHistorico}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="periodo" axisLine={false} tickLine={false} fontSize={11} />
                        <YAxis axisLine={false} tickLine={false} fontSize={11} tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`} />
                        <Tooltip cursor={{fill: '#f8fafc'}} formatter={(val: number) => `R$ ${val.toLocaleString()}`} />
                        <Bar dataKey="valor" fill="#f97316" radius={[6,6,0,0]} barSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Resultado Líquido */}
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
                  <h3 className="font-black text-slate-800 mb-6 uppercase text-xs tracking-widest flex items-center gap-2">
                    <Calculator size={16} className="text-green-500"/> Resultado Líquido
                  </h3>
                  <div className="h-72 min-h-[288px]">
                    <ResponsiveContainer width="100%" height="100%" minHeight={288} minWidth={0}>
                      <LineChart data={resultadoLiquidoHistorico}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="periodo" axisLine={false} tickLine={false} fontSize={11} />
                        <YAxis axisLine={false} tickLine={false} fontSize={11} tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`} />
                        <Tooltip cursor={{fill: '#f8fafc'}} formatter={(val: number) => `R$ ${val.toLocaleString()}`} />
                        <Line type="monotone" dataKey="resultado" stroke="#22c55e" strokeWidth={3} name="Resultado Líquido" dot={{ fill: '#22c55e', r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Caixa */}
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
                  <h3 className="font-black text-slate-800 mb-6 uppercase text-xs tracking-widest flex items-center gap-2">
                    <Wallet size={16} className="text-purple-500"/> Caixa
                  </h3>
                  <div className="h-72 min-h-[288px]">
                    <ResponsiveContainer width="100%" height="100%" minHeight={288} minWidth={0}>
                      <LineChart data={caixaHistorico}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="periodo" axisLine={false} tickLine={false} fontSize={11} />
                        <YAxis axisLine={false} tickLine={false} fontSize={11} tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`} />
                        <Tooltip cursor={{fill: '#f8fafc'}} formatter={(val: number) => `R$ ${val.toLocaleString()}`} />
                        <Line type="monotone" dataKey="caixa" stroke="#a855f7" strokeWidth={3} name="Caixa" dot={{ fill: '#a855f7', r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'locacoes' && (
            <div className="space-y-6 animate-in fade-in duration-500">
               <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold">Locações</h3>
                <button onClick={() => setIsModalOpen('os')} className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-xl shadow-blue-500/20 transition-transform active:scale-95">
                  <Plus size={18} /> Novo Contrato
                </button>
              </div>

              <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden overflow-x-auto">
                <table className="w-full text-left min-w-[800px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[8px] md:text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <th className="px-2 py-2 md:px-8 md:py-5">ID OS</th>
                      <th className="px-8 py-5">Cliente</th>
                      <th className="px-8 py-5">Itens</th>
                      <th className="px-8 py-5">Período</th>
                      <th className="px-8 py-5">Desconto</th>
                      <th className="px-8 py-5">Valor Previsto</th>
                      <th className="px-8 py-5 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                {activeOrders.map(os => {
                  const cli = clients.find(c => c.id === os.clientId);
                  return (
                        <tr key={os.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-slate-700">{os.id}</span>
                              <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter">Ativa</span>
                          </div>
                          </td>
                          <td className="px-8 py-5">
                            <p className="font-bold text-slate-800">{cli?.nome || 'Cliente não encontrado'}</p>
                          </td>
                          <td className="px-8 py-5">
                            <div className="space-y-1">
                              {os.items.map((item, idx) => {
                                const availableItem = item.stockItemId 
                                  ? availableStock.find(s => s.id === item.stockItemId && s.tipo === 'id')
                                  : item.equipmentModelId
                                  ? availableStock.find(s => s.equipment.id === item.equipmentModelId && s.tipo === 'quantidade')
                                  : null;
                                const model = availableItem?.equipment || 
                                  catalogo.find(m => m.id === (item.stockItemId ? undefined : item.equipmentModelId));
                                return (
                                  <div key={idx} className="text-xs text-slate-600">
                                    <span className="font-bold">{model?.nome || 'Equipamento'}</span>
                                    {item.stockItemId && (
                                      <span className="text-slate-400 ml-2">(ID: {item.stockItemId})</span>
                                    )}
                                    {item.quantidade && (
                                      <span className="text-slate-400 ml-2">Qtd: {item.quantidade}</span>
                                    )}
                        </div>
                                );
                              })}
                        </div>
                          </td>
                          <td className="px-8 py-5">
                            <div className="text-xs text-slate-600">
                              {os.items.length > 0 && (
                                <>
                                  <p className="font-bold">{formatDateBR(os.items[0].dataInicio)}</p>
                                  <p className="text-slate-400">até {formatDateBR(os.items[0].dataFimPrevista)}</p>
                                </>
                              )}
                      </div>
                          </td>
                          <td className="px-8 py-5">
                            {os.descontoManual > 0 ? (
                              <span className="text-xs font-bold text-red-600">- R$ {os.descontoManual.toLocaleString()}</span>
                            ) : (
                              <span className="text-xs text-slate-400">-</span>
                            )}
                          </td>
                          <td className="px-8 py-5">
                            <p className="text-lg font-black text-blue-600">R$ {os.valorTotalPrevisto.toLocaleString()}</p>
                          </td>
                          <td className="px-8 py-5 text-right">
                            <div className="flex justify-end gap-2">
                              <button 
                                onClick={() => generateOSPDF(os)} 
                                className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2"
                                title="Ver contrato (previsão)"
                              >
                                <FileText size={14}/> PDF
                              </button>
                              <button 
                                onClick={() => handleEditOS(os.id)} 
                                className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all flex items-center gap-2"
                                title="Modificar locação"
                              >
                                <Save size={14}/> Modificar
                              </button>
                              <button 
                                onClick={() => handleDeleteOS(os.id)} 
                                className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all flex items-center gap-2"
                                title="Excluir locação"
                              >
                                <Trash2 size={14}/> Excluir
                              </button>
                              <button 
                                onClick={() => handleFinishOS(os.id)} 
                                className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center gap-2"
                                title="Encerrar e recalcular"
                              >
                                <CheckCircle2 size={14}/> Encerrar
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {activeOrders.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-8 py-12 text-center text-slate-400">
                          <ClipboardCheck size={48} className="mx-auto mb-4 opacity-50" />
                          <p className="font-bold">Nenhuma locação ativa</p>
                          <p className="text-sm mt-2">Clique em "Novo Contrato" para criar uma nova locação</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'despesas' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="flex justify-between items-center">
                                <div>
                  <h3 className="text-lg font-bold">Despesas</h3>
                  <p className="text-slate-500 text-sm">Controle de despesas da locadora</p>
                                </div>
                <button 
                  onClick={() => {
                    setNewDespesa({
                      data: new Date().toISOString().split('T')[0],
                      agrupador: AgrupadorDespesa.OUTROS,
                      descricao: '',
                      valor: 0
                    });
                    setEditingDespesaId(null);
                    setIsModalOpen('despesa');
                  }} 
                  className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-xl shadow-blue-500/20 transition-transform active:scale-95 hover:bg-blue-700"
                >
                  <Plus size={18} /> Nova Despesa
                </button>
                              </div>

              <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden overflow-x-auto">
                <table className="w-full text-left min-w-[600px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[8px] md:text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <th className="px-2 py-2 md:px-8 md:py-5">Data</th>
                      <th className="px-2 py-2 md:px-8 md:py-5">Agrupador</th>
                      <th className="px-2 py-2 md:px-8 md:py-5">Descrição</th>
                      <th className="px-2 py-2 md:px-8 md:py-5 text-right">Valor</th>
                      <th className="px-2 py-2 md:px-8 md:py-5 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {despesas.map(despesa => (
                      <tr key={despesa.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-2 py-2 md:px-8 md:py-5 text-[10px] md:text-sm text-slate-700">{formatDateBR(despesa.data)}</td>
                        <td className="px-2 py-2 md:px-8 md:py-5">
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[10px] md:text-xs font-bold uppercase">
                            {despesa.agrupador}
                          </span>
                        </td>
                        <td className="px-2 py-2 md:px-8 md:py-5">
                          <p className="font-bold text-[12px] md:text-base text-slate-800">{despesa.descricao}</p>
                        </td>
                        <td className="px-2 py-2 md:px-8 md:py-5 text-right">
                          <p className="text-[14px] md:text-lg font-black text-red-600">R$ {despesa.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        </td>
                        <td className="px-2 py-2 md:px-8 md:py-5 text-right">
                          <div className="flex items-center gap-1 md:gap-2 justify-end flex-wrap">
                            <button
                              onClick={() => {
                                setNewDespesa({
                                  data: despesa.data,
                                  agrupador: despesa.agrupador,
                                  descricao: despesa.descricao,
                                  valor: despesa.valor
                                });
                                setEditingDespesaId(despesa.id);
                                setIsModalOpen('despesa');
                              }}
                              className="bg-blue-50 text-blue-600 px-2 py-1 md:px-4 md:py-2 rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all flex items-center gap-1 md:gap-2"
                              title="Editar despesa"
                            >
                              <Save size={12} className="md:w-[14px] md:h-[14px]"/> Modificar
                            </button>
                            <button
                              onClick={() => handleDeleteDespesa(despesa.id)}
                              className="bg-red-50 text-red-600 px-2 py-1 md:px-4 md:py-2 rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all flex items-center gap-1 md:gap-2"
                              title="Excluir despesa"
                            >
                              <Trash2 size={12} className="md:w-[14px] md:h-[14px]"/> Excluir
                            </button>
                              </div>
                        </td>
                      </tr>
                    ))}
                    {despesas.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-8 py-12 text-center text-slate-400">
                          <DollarSign size={48} className="mx-auto mb-4 opacity-50" />
                          <p className="font-bold">Nenhuma despesa cadastrada</p>
                          <p className="text-sm mt-2">Clique em "Nova Despesa" para começar</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {despesas.length > 0 && (
                    <tfoot>
                      <tr className="bg-slate-100 border-t-2 border-slate-200">
                        <td colSpan={3} className="px-8 py-4 text-right font-black text-slate-700 uppercase text-xs">
                          Total de Despesas:
                        </td>
                        <td className="px-8 py-4 text-right">
                          <p className="text-xl font-black text-red-600">
                            R$ {despesas.reduce((acc, d) => acc + d.valor, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
                            </div>
                      </div>
          )}

          {activeTab === 'retiradas' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold">Retiradas</h3>
                  <p className="text-slate-500 text-sm">Controle de retiradas financeiras dos sócios</p>
                </div>
                <button 
                  onClick={() => {
                    setNewRetirada({
                      dataRetirada: new Date().toISOString().split('T')[0],
                      socioRetirada: '',
                      valor: 0
                    });
                    setEditingRetiradaId(null);
                    setIsModalOpen('retirada');
                  }} 
                  className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-xl shadow-blue-500/20 transition-transform active:scale-95 hover:bg-blue-700"
                >
                  <Plus size={18} /> Nova Retirada
                        </button>
              </div>

              <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden overflow-x-auto">
                <table className="w-full text-left min-w-[500px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[8px] md:text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <th className="px-2 py-2 md:px-8 md:py-5">Data Retirada</th>
                      <th className="px-2 py-2 md:px-8 md:py-5">Sócio Retirada</th>
                      <th className="px-2 py-2 md:px-8 md:py-5 text-right">Valor</th>
                      <th className="px-2 py-2 md:px-8 md:py-5 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {retiradas.map(retirada => (
                      <tr key={retirada.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-2 py-2 md:px-8 md:py-5 text-[10px] md:text-sm text-slate-700">{formatDateBR(retirada.dataRetirada)}</td>
                        <td className="px-2 py-2 md:px-8 md:py-5">
                          <p className="font-bold text-[12px] md:text-base text-slate-800">{retirada.socioRetirada}</p>
                        </td>
                        <td className="px-2 py-2 md:px-8 md:py-5 text-right">
                          <p className="text-[14px] md:text-lg font-black text-orange-600">R$ {retirada.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        </td>
                        <td className="px-2 py-2 md:px-8 md:py-5 text-right">
                          <div className="flex items-center gap-1 md:gap-2 justify-end flex-wrap">
                            <button
                              onClick={() => {
                                setNewRetirada({
                                  dataRetirada: retirada.dataRetirada,
                                  socioRetirada: retirada.socioRetirada,
                                  valor: retirada.valor
                                });
                                setEditingRetiradaId(retirada.id);
                                setIsModalOpen('retirada');
                              }}
                              className="bg-blue-50 text-blue-600 px-2 py-1 md:px-4 md:py-2 rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all flex items-center gap-1 md:gap-2"
                              title="Editar retirada"
                            >
                              <Save size={12} className="md:w-[14px] md:h-[14px]"/> Modificar
                            </button>
                            <button
                              onClick={() => handleDeleteRetirada(retirada.id)}
                              className="bg-red-50 text-red-600 px-2 py-1 md:px-4 md:py-2 rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all flex items-center gap-1 md:gap-2"
                              title="Excluir retirada"
                            >
                              <Trash2 size={12} className="md:w-[14px] md:h-[14px]"/> Excluir
                        </button>
                      </div>
                        </td>
                      </tr>
                    ))}
                    {retiradas.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-8 py-12 text-center text-slate-400">
                          <ArrowDownCircle size={48} className="mx-auto mb-4 opacity-50" />
                          <p className="font-bold">Nenhuma retirada cadastrada</p>
                          <p className="text-sm mt-2">Clique em "Nova Retirada" para começar</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {retiradas.length > 0 && (
                    <tfoot>
                      <tr className="bg-slate-100 border-t-2 border-slate-200">
                        <td colSpan={2} className="px-8 py-4 text-right font-black text-slate-700 uppercase text-xs">
                          Total de Retiradas:
                        </td>
                        <td className="px-8 py-4 text-right">
                          <p className="text-xl font-black text-orange-600">
                            R$ {retiradas.reduce((acc, r) => acc + r.valor, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          )}

          {activeTab === 'historico' && (
            <div className="space-y-6 animate-in fade-in duration-500">
               <div className="flex justify-between items-end">
                <div>
                  <h3 className="text-lg font-bold">Relatórios de Encerramento</h3>
                  <p className="text-slate-500 text-sm">Gere os comprovantes de faturamento real.</p>
                </div>
              </div>

              <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden overflow-x-auto">
                <table className="w-full text-left min-w-[900px] md:min-w-[1200px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[8px] md:text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <th className="px-2 py-2 md:px-6 md:py-4">Contrato</th>
                      <th className="px-2 py-2 md:px-6 md:py-4">Cliente</th>
                      <th className="px-2 py-2 md:px-6 md:py-4">Data Inicial</th>
                      <th className="px-2 py-2 md:px-6 md:py-4">Data Prevista</th>
                      <th className="px-2 py-2 md:px-6 md:py-4">Data Final</th>
                      <th className="px-2 py-2 md:px-6 md:py-4">Desconto</th>
                      <th className="px-2 py-2 md:px-6 md:py-4">Valor Previsto</th>
                      <th className="px-2 py-2 md:px-6 md:py-4">Valor Final</th>
                      <th className="px-2 py-2 md:px-6 md:py-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {historyOrders.map(os => {
                      const firstItem = os.items.length > 0 ? os.items[0] : null;
                      return (
                      <tr key={os.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-2 py-2 md:px-6 md:py-4 font-mono text-[10px] md:text-xs font-bold text-slate-700">{os.id}</td>
                          <td className="px-2 py-2 md:px-6 md:py-4 font-bold text-[12px] md:text-base text-slate-800">{clients.find(c => c.id === os.clientId)?.nome}</td>
                          <td className="px-2 py-2 md:px-6 md:py-4 text-[10px] md:text-xs text-slate-600">
                            {firstItem ? formatDateBR(firstItem.dataInicio) : '-'}
                          </td>
                          <td className="px-2 py-2 md:px-6 md:py-4 text-[10px] md:text-xs text-slate-600">
                            {firstItem ? formatDateBR(firstItem.dataFimPrevista) : '-'}
                          </td>
                          <td className="px-2 py-2 md:px-6 md:py-4 text-[10px] md:text-xs text-slate-600">
                            {os.dataConclusao ? formatDateBR(os.dataConclusao) : '-'}
                          </td>
                          <td className="px-2 py-2 md:px-6 md:py-4">
                            {os.descontoManual > 0 ? (
                              <span className="text-[10px] md:text-xs font-bold text-red-600">- R$ {os.descontoManual.toLocaleString()}</span>
                            ) : (
                              <span className="text-[10px] md:text-xs text-slate-400">-</span>
                            )}
                          </td>
                          <td className="px-2 py-2 md:px-6 md:py-4 text-[12px] md:text-sm font-bold text-slate-700">R$ {os.valorTotalPrevisto.toLocaleString()}</td>
                          <td className="px-2 py-2 md:px-6 md:py-4 text-[14px] md:text-lg font-black text-blue-600">R$ {os.valorTotalReal?.toLocaleString() || '0'}</td>
                          <td className="px-2 py-2 md:px-6 md:py-4">
                            <div className="flex items-center justify-end gap-1 md:gap-2">
                              <button 
                                onClick={() => generateOSPDF(os)} 
                                className="bg-blue-50 text-blue-600 px-2 py-1 md:px-4 md:py-2 rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all flex items-center gap-1 md:gap-2"
                                title="Baixar PDF"
                              >
                                <Download size={12} className="md:w-[14px] md:h-[14px]"/> PDF
                              </button>
                              <button 
                                onClick={() => handleDeleteOS(os.id)}
                                className="bg-red-50 text-red-600 px-2 py-1 md:px-4 md:py-2 rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all flex items-center gap-1 md:gap-2"
                                title="Excluir locação"
                              >
                                <Trash2 size={12} className="md:w-[14px] md:h-[14px]"/> Excluir
                              </button>
                            </div>
                          </td>
                      </tr>
                      );
                    })}
                    {historyOrders.length === 0 && (
                      <tr>
                        <td colSpan={10} className="px-8 py-12 text-center text-slate-400">
                          <History size={48} className="mx-auto mb-4 opacity-50" />
                          <p className="font-bold">Nenhuma ordem finalizada</p>
                          <p className="text-sm mt-2">As ordens finalizadas aparecerão aqui</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Mantendo as outras abas para integridade */}
          {activeTab === 'catalogo' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="flex justify-between items-center">
                     <div>
                  <h3 className="text-lg font-bold">Equipamentos</h3>
                  <p className="text-slate-500 text-sm">Cadastro de equipamentos disponíveis para locação</p>
                     </div>
                <button 
                  onClick={() => {
                    setNewCat({ unidade: RentalUnit.DIARIA, foto: 'https://images.unsplash.com/photo-1581094288338-2314dddb7bc3?w=400' });
                    setEditingCatId(null);
                    setIsModalOpen('catalogo');
                  }} 
                  className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-xl shadow-blue-500/20 transition-transform active:scale-95 hover:bg-blue-700"
                >
                  <Plus size={18} /> Novo Equipamento
                </button>
                   </div>

              <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden overflow-x-auto">
                <table className="w-full text-left min-w-[700px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[8px] md:text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <th className="px-2 py-2 md:px-8 md:py-5">ID</th>
                      <th className="px-2 py-2 md:px-8 md:py-5">Equipamento</th>
                      <th className="px-2 py-2 md:px-8 md:py-5">Valor Unitário</th>
                      <th className="px-2 py-2 md:px-8 md:py-5">Unidade</th>
                      <th className="px-2 py-2 md:px-8 md:py-5">Número de Série</th>
                      <th className="px-2 py-2 md:px-8 md:py-5">Quantidade</th>
                      <th className="px-2 py-2 md:px-8 md:py-5 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {catalogo.map(equipamento => (
                      <tr key={equipamento.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-2 py-2 md:px-8 md:py-5 font-mono text-[10px] md:text-xs font-bold text-slate-500">{equipamento.id}</td>
                        <td className="px-2 py-2 md:px-8 md:py-5">
                          <div>
                            <p className="font-bold text-[12px] md:text-base text-slate-800">{equipamento.nome}</p>
                            {equipamento.descricao && (
                              <p className="text-[10px] md:text-xs text-slate-400 mt-1">{equipamento.descricao}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-2 py-2 md:px-8 md:py-5">
                          <span className="text-[14px] md:text-lg font-black text-blue-600">R$ {equipamento.valorUnitario.toLocaleString()}</span>
                        </td>
                        <td className="px-2 py-2 md:px-8 md:py-5">
                          <span className="bg-blue-100 text-blue-700 px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[10px] md:text-xs font-bold uppercase">
                            {equipamento.unidade}
                          </span>
                        </td>
                        <td className="px-2 py-2 md:px-8 md:py-5">
                          <span className="font-mono text-[10px] md:text-xs text-slate-600">
                            {equipamento.numSerie || '-'}
                          </span>
                        </td>
                        <td className="px-2 py-2 md:px-8 md:py-5">
                          <span className="text-[10px] md:text-xs font-bold text-slate-700">
                            {equipamento.quantidade !== undefined ? equipamento.quantidade.toLocaleString() : '-'}
                          </span>
                        </td>
                        <td className="px-2 py-2 md:px-8 md:py-5 text-right">
                          <div className="flex items-center gap-1 md:gap-2 justify-end flex-wrap">
                            <button
                              onClick={() => handleEditCatalog(equipamento)}
                              className="bg-blue-50 text-blue-600 px-2 py-1 md:px-4 md:py-2 rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all flex items-center gap-1 md:gap-2"
                              title="Editar equipamento"
                            >
                              <Save size={12} className="md:w-[14px] md:h-[14px]"/> Modificar
                            </button>
                            <button
                              onClick={() => handleDeleteEquipment(equipamento.id)}
                              className="bg-red-50 text-red-600 px-2 py-1 md:px-4 md:py-2 rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all flex items-center gap-1 md:gap-2"
                              title="Excluir equipamento"
                            >
                              <Trash2 size={12} className="md:w-[14px] md:h-[14px]"/> Excluir
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {catalogo.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-8 py-12 text-center text-slate-400">
                          <Package size={48} className="mx-auto mb-4 opacity-50" />
                          <p className="font-bold">Nenhum equipamento cadastrado</p>
                          <p className="text-sm mt-2">Clique em "Novo Equipamento" para começar</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'clientes' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold">Clientes</h3>
                  <p className="text-slate-500 text-sm">Cadastro de clientes</p>
                </div>
                <button 
                  onClick={() => {
                    setNewCli({ cidade: 'Presidente Olegário-MG' });
                    setEditingCliId(null);
                    setIsModalOpen('client');
                  }} 
                  className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-xl shadow-blue-500/20 transition-transform active:scale-95 hover:bg-blue-700"
                >
                  <Plus size={18} /> Novo Cliente
                </button>
              </div>

              <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden overflow-x-auto">
                <table className="w-full text-left min-w-[800px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[8px] md:text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <th className="px-2 py-2 md:px-8 md:py-5">ID</th>
                      <th className="px-2 py-2 md:px-8 md:py-5">Nome</th>
                      <th className="px-2 py-2 md:px-8 md:py-5">Documento</th>
                      <th className="px-2 py-2 md:px-8 md:py-5">Telefone</th>
                      <th className="px-2 py-2 md:px-8 md:py-5">Email</th>
                      <th className="px-2 py-2 md:px-8 md:py-5">Endereço</th>
                      <th className="px-2 py-2 md:px-8 md:py-5 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {clients.map(client => (
                      <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-2 py-2 md:px-8 md:py-5 font-mono text-[10px] md:text-xs font-bold text-slate-500">{client.id}</td>
                        <td className="px-2 py-2 md:px-8 md:py-5">
                          <p className="font-bold text-[12px] md:text-base text-slate-800">{client.nome}</p>
                        </td>
                        <td className="px-2 py-2 md:px-8 md:py-5">
                          {client.tipoDocumento && client.documento ? (
                            <div className="flex flex-col">
                              <span className="text-[10px] md:text-xs text-slate-500">{client.tipoDocumento}</span>
                              <span className="text-[12px] md:text-sm font-medium text-slate-700">{formatDocument(client.documento, client.tipoDocumento)}</span>
                            </div>
                          ) : (
                            <span className="text-[10px] md:text-xs text-slate-400">-</span>
                          )}
                        </td>
                        <td className="px-2 py-2 md:px-8 md:py-5">
                          <span className="text-[10px] md:text-sm text-slate-700">{client.telefone || '-'}</span>
                        </td>
                        <td className="px-2 py-2 md:px-8 md:py-5">
                          <span className="text-[10px] md:text-sm text-slate-700">{client.email || '-'}</span>
                        </td>
                        <td className="px-2 py-2 md:px-8 md:py-5">
                          <span className="text-[10px] md:text-sm text-slate-600">
                            {(() => {
                              if (client.rua && client.numero) {
                                return `${client.rua}, ${client.numero}${client.cidade ? ` - ${client.cidade}` : ''}`;
                              }
                              if (client.endereco) {
                                return client.endereco;
                              }
                              if (client.rua) {
                                return `${client.rua}${client.numero ? `, ${client.numero}` : ''}${client.cidade ? ` - ${client.cidade}` : ''}`;
                              }
                              return client.cidade || '-';
                            })()}
                          </span>
                        </td>
                        <td className="px-2 py-2 md:px-8 md:py-5 text-right">
                          <div className="flex items-center gap-1 md:gap-2 justify-end flex-wrap">
                            <button
                              onClick={() => {
                                setNewCli({
                                  nome: client.nome,
                                  telefone: client.telefone,
                                  email: client.email,
                                  rua: client.rua,
                                  numero: client.numero,
                                  cidade: client.cidade || 'Presidente Olegário-MG',
                                  tipoDocumento: client.tipoDocumento,
                                  documento: client.documento,
                                });
                                setEditingCliId(client.id);
                                setIsModalOpen('client');
                              }}
                              className="bg-blue-50 text-blue-600 px-2 py-1 md:px-4 md:py-2 rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all flex items-center gap-1 md:gap-2"
                              title="Editar cliente"
                            >
                              <Save size={12} className="md:w-[14px] md:h-[14px]"/> Modificar
                            </button>
                            <button
                              onClick={() => handleDeleteClient(client.id)}
                              className="bg-red-50 text-red-600 px-2 py-1 md:px-4 md:py-2 rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all flex items-center gap-1 md:gap-2"
                              title="Excluir cliente"
                            >
                              <Trash2 size={12} className="md:w-[14px] md:h-[14px]"/> Excluir
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {clients.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-8 py-12 text-center text-slate-400">
                          <Users size={48} className="mx-auto mb-4 opacity-50" />
                          <p className="font-bold">Nenhum cliente cadastrado</p>
                          <p className="text-sm mt-2">Clique em "Novo Cliente" para começar</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'estoque' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold">Estoque</h3>
                  <p className="text-slate-500 text-sm">Equipamentos disponíveis para locação (calculado dinamicamente)</p>
                </div>
              </div>

              <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden overflow-x-auto">
                <table className="w-full text-left min-w-[600px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[8px] md:text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <th className="px-2 py-2 md:px-8 md:py-5">ID</th>
                      <th className="px-2 py-2 md:px-8 md:py-5">Equipamento</th>
                      <th className="px-2 py-2 md:px-8 md:py-5">Tipo</th>
                      <th className="px-2 py-2 md:px-8 md:py-5">Disponível</th>
                      <th className="px-2 py-2 md:px-8 md:py-5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {availableStock.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-2 py-2 md:px-8 md:py-5 font-mono text-[10px] md:text-xs font-bold text-slate-500">{item.id}</td>
                        <td className="px-2 py-2 md:px-8 md:py-5">
                          <div>
                            <p className="font-bold text-[12px] md:text-base text-slate-800">{item.equipment.nome}</p>
                            {item.equipment.descricao && (
                              <p className="text-[10px] md:text-xs text-slate-400 mt-1">{item.equipment.descricao}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-2 py-2 md:px-8 md:py-5">
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[10px] md:text-xs font-bold uppercase">
                            {item.tipo === 'quantidade' ? 'Por Quantidade' : 'Por ID'}
                          </span>
                        </td>
                        <td className="px-2 py-2 md:px-8 md:py-5">
                          {item.tipo === 'quantidade' ? (
                            <div className="flex flex-col">
                              <span className="text-[14px] md:text-lg font-black text-green-600">{item.disponivel}</span>
                              {item.total !== undefined && (
                                <span className="text-[10px] md:text-xs text-slate-400">de {item.total} total</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[12px] md:text-sm font-bold text-slate-700">1 unidade</span>
                          )}
                        </td>
                        <td className="px-2 py-2 md:px-8 md:py-5">
                          <span className="bg-green-100 text-green-700 px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[10px] md:text-xs font-bold uppercase">
                            Disponível
                          </span>
                        </td>
                      </tr>
                    ))}
                    {availableStock.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 md:px-8 py-8 md:py-12 text-center text-slate-400">
                          <Layers size={48} className="mx-auto mb-4 opacity-50" />
                          <p className="font-bold">Nenhum equipamento disponível no momento</p>
                          <p className="text-sm mt-2">
                            {catalogo.length === 0 
                              ? 'Cadastre equipamentos primeiro em "Cadastro &gt; Equipamentos"'
                              : 'Todos os equipamentos estão locados. O estoque é atualizado automaticamente quando equipamentos são devolvidos.'}
                          </p>
                          {catalogo.length > 0 && (
                            <div className="mt-4 text-xs text-slate-400 space-y-1">
                              <p>Equipamentos cadastrados: {catalogo.length}</p>
                              <p>Locações ativas: {activeOrders.length}</p>
                              <p className="text-blue-600 mt-2">
                                💡 O estoque é calculado dinamicamente baseado nos equipamentos cadastrados e nas locações ativas.
                              </p>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
               </div>
            </div>
          )}
          
          {activeTab === 'ai-assistant' && (
            <div className="h-full flex flex-col max-w-4xl mx-auto">
              <div className="flex-1 bg-white border border-slate-200 rounded-[3rem] flex flex-col shadow-2xl overflow-hidden min-h-[500px]">
                <div className="flex-1 overflow-y-auto p-10 space-y-6">
                  {chatHistory.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] px-8 py-5 rounded-[2rem] ${msg.role === 'user' ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' : 'bg-slate-100 text-slate-800'}`}>
                        <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                      </div>
                    </div>
                  ))}
                  {isLoadingAI && <div className="text-[10px] font-black text-blue-500 animate-pulse ml-8 uppercase tracking-widest">Processando...</div>}
                </div>
                <div className="p-8 bg-slate-50 border-t flex gap-4">
                  <input className="flex-1 bg-white border border-slate-200 rounded-2xl px-8 text-sm focus:ring-4 focus:ring-blue-100 outline-none h-16 font-medium" placeholder="Tire dúvidas sobre AppSheet ou PDFs..." value={userInput} onChange={e => setUserInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSendMessage()} />
                  <button onClick={handleSendMessage} className="bg-blue-600 text-white w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/30 active:scale-90 transition-all"><Send size={28}/></button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* --- Modals --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-[3.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-12 py-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <p className="text-3xl font-black text-slate-900 leading-none">
                {isModalOpen === 'os' ? (editingOSId ? 'Modificar Locação' : 'Novo Contrato Múltiplo') : 
                 isModalOpen === 'client' ? (editingCliId ? 'Modificar Cliente' : 'Novo Cliente') : 
                 isModalOpen === 'catalogo' ? (editingCatId ? 'Modificar Equipamento' : 'Novo Equipamento') :
                 isModalOpen === 'despesa' ? (editingDespesaId ? 'Modificar Despesa' : 'Nova Despesa') :
                 isModalOpen === 'retirada' ? (editingRetiradaId ? 'Modificar Retirada' : 'Nova Retirada') :
                 isModalOpen === 'finish-os' ? 'Finalizar Ordem de Serviço' :
                 'Cadastrar'}
              </p>
              <button onClick={() => {
                setIsModalOpen(null);
                if (isModalOpen === 'os') {
                  setNewOS({ clientId: '', items: [], descontoManual: 0 });
                  setEditingOSId(null);
                }
              }} className="p-4 text-slate-400 hover:text-slate-800"><X size={32}/></button>
            </div>
            
            <div className="p-12 space-y-10 max-h-[75vh] overflow-y-auto">
              {isModalOpen === 'os' && (
                <>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cliente</label>
                    <select className="w-full bg-slate-50 border border-slate-200 rounded-3xl px-4 md:px-8 h-12 md:h-16 text-[13px] md:text-sm font-bold focus:ring-4 focus:ring-blue-100 outline-none shadow-sm" value={newOS.clientId} onChange={e => setNewOS({...newOS, clientId: e.target.value})}>
                      <option value="">Selecione o cliente...</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                    </select>
                  </div>

                  <div className="bg-slate-900 rounded-[2.5rem] p-4 md:p-8 text-white">
                    {/* Seletor de Modo */}
                    <div className="mb-4 md:mb-6 flex gap-2 md:gap-3">
                      <button
                        onClick={() => setAddMode('id')}
                        className={`flex-1 py-2 md:py-3 px-3 md:px-4 rounded-xl text-[12px] md:text-sm font-bold transition-all ${
                          addMode === 'id' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                      >
                        Por ID Específico
                      </button>
                      <button
                        onClick={() => setAddMode('quantity')}
                        className={`flex-1 py-2 md:py-3 px-3 md:px-4 rounded-xl text-[12px] md:text-sm font-bold transition-all ${
                          addMode === 'quantity' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                      >
                        Por Quantidade
                      </button>
                    </div>

                    {/* Formulário de Adição */}
                    <div className="flex gap-2 md:gap-4 mb-4 md:mb-6">
                      {addMode === 'id' ? (
                        <>
                      <select className="flex-1 bg-slate-800 border-none rounded-2xl px-4 md:px-6 h-12 md:h-14 text-[12px] md:text-sm text-white outline-none" value={selectedStockId} onChange={e => setSelectedStockId(e.target.value)}>
                        <option value="">Equipamento Disponível...</option>
                        {availableStock
                          .filter(item => item.tipo === 'id' && !newOS.items.some(i => i.stockItemId === item.id))
                          .map(item => (
                            <option key={item.id} value={item.id}>
                              {item.equipment.nome} (Serial: {item.id})
                            </option>
                          ))}
                      </select>
                        </>
                      ) : (
                        <>
                          <select className="flex-1 bg-slate-800 border-none rounded-2xl px-4 md:px-6 h-12 md:h-14 text-[12px] md:text-sm text-white outline-none" value={selectedEquipmentModelId} onChange={e => setSelectedEquipmentModelId(e.target.value)}>
                            <option value="">Selecione o Equipamento...</option>
                            {availableStock
                              .filter(item => item.tipo === 'quantidade')
                              .map(item => (
                                <option key={item.id} value={item.equipment.id}>
                                  {item.equipment.nome} (Disponível: {item.disponivel} de {item.total})
                                </option>
                              ))}
                          </select>
                          <input
                            type="number"
                            min="1"
                            max={selectedEquipmentModelId ? availableStock.find(item => item.equipment.id === selectedEquipmentModelId && item.tipo === 'quantidade')?.disponivel : undefined}
                            value={selectedQuantity}
                            onChange={e => {
                              const val = parseInt(e.target.value) || 1;
                              const availableItem = selectedEquipmentModelId ? availableStock.find(item => item.equipment.id === selectedEquipmentModelId && item.tipo === 'quantidade') : undefined;
                              const maxQty = availableItem?.disponivel;
                              setSelectedQuantity(maxQty ? Math.min(val, maxQty) : val);
                            }}
                            className="w-24 md:w-32 bg-slate-800 border-none rounded-2xl px-3 md:px-6 h-12 md:h-14 text-[12px] md:text-sm text-white outline-none text-center"
                            placeholder="Qtd"
                          />
                        </>
                      )}
                      <button onClick={addItemToOS} className="bg-blue-600 hover:bg-blue-500 w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center transition-all"><Plus size={20} className="md:w-[28px] md:h-[28px]"/></button>
                    </div>

                    {/* Lista de Itens */}
                    <div className="space-y-2 md:space-y-3">
                      {newOS.items.map((item, idx) => {
                        const availableItem = item.stockItemId 
                          ? availableStock.find(s => s.id === item.stockItemId && s.tipo === 'id')
                          : item.equipmentModelId
                          ? availableStock.find(s => s.equipment.id === item.equipmentModelId && s.tipo === 'quantidade')
                          : null;
                        const model = availableItem?.equipment || 
                          catalogo.find(m => m.id === (item.stockItemId ? undefined : item.equipmentModelId));
                        
                        const itemKey = item.stockItemId || `${item.equipmentModelId}-${item.dataInicio}-${item.dataFimPrevista}`;
                        
                        return (
                          <div key={itemKey || idx} className="bg-slate-800/40 p-3 md:p-4 rounded-2xl border border-slate-700/50">
                           <div className="flex justify-between items-center mb-3 md:mb-4">
                              <div>
                                <p className="text-[13px] md:text-sm font-black">{model?.nome || 'Equipamento'}</p>
                                {item.stockItemId && (
                                  <p className="text-[11px] md:text-xs text-slate-400">ID: {item.stockItemId}</p>
                                )}
                                {item.quantidade && (
                                  <p className="text-[11px] md:text-xs text-slate-400">Quantidade: {item.quantidade}</p>
                                )}
                              </div>
                              <button onClick={() => removeItemFromOS(item)} className="text-red-400"><Trash2 size={14} className="md:w-4 md:h-4"/></button>
                           </div>
                           <div className="grid grid-cols-2 gap-2 md:gap-4">
                              <input 
                                type="date" 
                                value={item.dataInicio} 
                                onChange={e => updateItemDate(
                                  item.stockItemId || item.equipmentModelId || '', 
                                  'dataInicio', 
                                  e.target.value,
                                  !!item.stockItemId
                                )} 
                                className="bg-slate-900 border border-slate-700 rounded-xl px-3 md:px-4 py-2 text-[11px] md:text-xs" 
                              />
                              <input 
                                type="date" 
                                value={item.dataFimPrevista} 
                                onChange={e => updateItemDate(
                                  item.stockItemId || item.equipmentModelId || '', 
                                  'dataFimPrevista', 
                                  e.target.value,
                                  !!item.stockItemId
                                )} 
                                className="bg-slate-900 border border-slate-700 rounded-xl px-3 md:px-4 py-2 text-[11px] md:text-xs" 
                              />
                           </div>
                            {item.quantidade && (
                              <div className="mt-3 md:mt-4 flex items-center gap-2 md:gap-3">
                                <label className="text-[11px] md:text-xs text-slate-400">Quantidade:</label>
                                <input
                                  type="number"
                                  min="1"
                                  value={item.quantidade}
                                  onChange={e => item.equipmentModelId && updateItemQuantity(item.equipmentModelId, parseInt(e.target.value) || 1)}
                                  className="w-20 md:w-24 bg-slate-900 border border-slate-700 rounded-xl px-2 md:px-3 py-2 text-[11px] md:text-xs text-white text-center"
                                />
                        </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-slate-200">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Desconto Manual (opcional)</label>
                      <input 
                        type="number" 
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        className="w-full bg-slate-50 border border-slate-200 rounded-3xl px-4 md:px-8 h-12 md:h-16 text-[13px] md:text-sm font-bold focus:ring-4 focus:ring-blue-100 outline-none shadow-sm"
                        value={newOS.descontoManual || ''}
                        onChange={e => setNewOS({...newOS, descontoManual: parseFloat(e.target.value) || 0})}
                      />
                    </div>
                    
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Previsão Total</p>
                      <p className="text-2xl md:text-4xl font-black text-slate-900 tracking-tighter">R$ {totalOSPrevisto.toLocaleString()}</p>
                        {newOS.descontoManual > 0 && (
                          <p className="text-[11px] md:text-xs text-slate-500 mt-1">
                            Subtotal: R$ {(newOS.items.reduce((acc, item) => acc + calculateItemCost(item), 0)).toLocaleString()} - 
                            Desconto: R$ {newOS.descontoManual.toLocaleString()}
                          </p>
                        )}
                    </div>
                    <button onClick={handleCreateOS} className="bg-blue-600 text-white px-6 md:px-12 py-3 md:py-5 rounded-[2rem] font-black uppercase text-[11px] md:text-xs shadow-2xl active:scale-95 transition-all w-full md:w-auto">{editingOSId ? 'Atualizar Locação' : 'Criar Locação'}</button>
                    </div>
                  </div>
                </>
              )}

              {isModalOpen === 'catalogo' && (
                <>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome *</label>
                      <input 
                        type="text" 
                        placeholder="Nome do equipamento"
                        className="w-full bg-slate-50 border border-slate-200 rounded-3xl px-8 h-16 text-sm font-bold focus:ring-4 focus:ring-blue-100 outline-none shadow-sm"
                        value={newCat.nome || ''}
                        onChange={e => setNewCat({...newCat, nome: e.target.value})}
                        required
                      />
            </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descrição</label>
                      <textarea 
                        placeholder="Descrição detalhada do equipamento"
                        className="w-full bg-slate-50 border border-slate-200 rounded-3xl px-8 py-4 h-24 text-sm font-bold focus:ring-4 focus:ring-blue-100 outline-none shadow-sm resize-none"
                        value={newCat.descricao || ''}
                        onChange={e => setNewCat({...newCat, descricao: e.target.value})}
                      />
          </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Valor Unitário *</label>
                        <input 
                          type="number" 
                          step="0.01"
                          placeholder="0.00"
                          className="w-full bg-slate-50 border border-slate-200 rounded-3xl px-8 h-16 text-sm font-bold focus:ring-4 focus:ring-blue-100 outline-none shadow-sm"
                          value={newCat.valorUnitario || ''}
                          onChange={e => setNewCat({...newCat, valorUnitario: parseFloat(e.target.value) || 0})}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unidade de Locação</label>
                        <select
                          className="w-full bg-slate-50 border border-slate-200 rounded-3xl px-8 h-16 text-sm font-bold focus:ring-4 focus:ring-blue-100 outline-none shadow-sm"
                          value={newCat.unidade || RentalUnit.DIARIA}
                          onChange={e => setNewCat({...newCat, unidade: e.target.value as RentalUnit})}
                        >
                          <option value={RentalUnit.DIARIA}>Diária</option>
                          <option value={RentalUnit.MES}>Mês</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">URL da Foto</label>
                      <input 
                        type="url" 
                        placeholder="https://exemplo.com/foto.jpg"
                        className="w-full bg-slate-50 border border-slate-200 rounded-3xl px-8 h-16 text-sm font-bold focus:ring-4 focus:ring-blue-100 outline-none shadow-sm"
                        value={newCat.foto || ''}
                        onChange={e => setNewCat({...newCat, foto: e.target.value})}
                      />
                      {newCat.foto && (
                        <div className="mt-2">
                          <img src={newCat.foto} alt="Preview" className="w-full h-48 object-cover rounded-xl border border-slate-200" onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1581094288338-2314dddb7bc3?w=400';
                          }} />
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Número de Série</label>
                        <input 
                          type="text" 
                          placeholder="Número de série do equipamento (opcional)"
                          className="w-full bg-slate-50 border border-slate-200 rounded-3xl px-8 h-16 text-sm font-bold focus:ring-4 focus:ring-blue-100 outline-none shadow-sm"
                          value={newCat.numSerie || ''}
                          onChange={e => setNewCat({...newCat, numSerie: e.target.value})}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                          Quantidade Disponível 
                          <span className="text-slate-300 ml-2">(opcional - para equipamentos sem controle por ID)</span>
                        </label>
                        <input 
                          type="number" 
                          min="0"
                          step="1"
                          placeholder="Deixe vazio se controle por ID"
                          className="w-full bg-slate-50 border border-slate-200 rounded-3xl px-8 h-16 text-sm font-bold focus:ring-4 focus:ring-blue-100 outline-none shadow-sm"
                          value={newCat.quantidade !== undefined ? newCat.quantidade : ''}
                          onChange={e => {
                            const val = e.target.value;
                            setNewCat({
                              ...newCat, 
                              quantidade: val === '' ? undefined : parseInt(val) || 0
                            });
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-4 pt-4 border-t border-slate-100">
                    <button 
                      onClick={() => {
                        setIsModalOpen(null);
                        setNewCat({ unidade: RentalUnit.DIARIA, foto: 'https://images.unsplash.com/photo-1581094288338-2314dddb7bc3?w=400' });
                        setEditingCatId(null);
                      }}
                      className="bg-slate-100 text-slate-600 px-8 py-4 rounded-2xl font-black uppercase text-xs hover:bg-slate-200 transition-all active:scale-95"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={handleAddCatalog}
                      className="bg-blue-600 text-white px-12 py-4 rounded-2xl font-black uppercase text-xs shadow-2xl shadow-blue-500/20 active:scale-95 transition-all hover:bg-blue-700"
                    >
                      <Save size={18} className="inline mr-2" />
                      {editingCatId ? 'Atualizar Equipamento' : 'Salvar Equipamento'}
                    </button>
                  </div>
                </>
              )}

              {isModalOpen === 'client' && (
                <>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome *</label>
                      <input 
                        type="text" 
                        placeholder="Nome completo do cliente"
                        className="w-full bg-slate-50 border border-slate-200 rounded-3xl px-8 h-16 text-sm font-bold focus:ring-4 focus:ring-blue-100 outline-none shadow-sm"
                        value={newCli.nome || ''}
                        onChange={e => setNewCli({...newCli, nome: e.target.value})}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Telefone *</label>
                        <input 
                          type="tel" 
                          placeholder="(11) 98765-4321"
                          className="w-full bg-slate-50 border border-slate-200 rounded-3xl px-8 h-16 text-sm font-bold focus:ring-4 focus:ring-blue-100 outline-none shadow-sm"
                          value={newCli.telefone || ''}
                          onChange={e => setNewCli({...newCli, telefone: e.target.value})}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email *</label>
                        <input 
                          type="email" 
                          placeholder="cliente@email.com"
                          className="w-full bg-slate-50 border border-slate-200 rounded-3xl px-8 h-16 text-sm font-bold focus:ring-4 focus:ring-blue-100 outline-none shadow-sm"
                          value={newCli.email || ''}
                          onChange={e => setNewCli({...newCli, email: e.target.value})}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Documento</label>
                        <select
                          className="w-full bg-slate-50 border border-slate-200 rounded-3xl px-8 h-16 text-sm font-bold focus:ring-4 focus:ring-blue-100 outline-none shadow-sm"
                          value={newCli.tipoDocumento || ''}
                          onChange={e => {
                            setNewCli({
                              ...newCli,
                              tipoDocumento: e.target.value ? (e.target.value as DocumentType) : undefined,
                              documento: '', // Limpa documento ao mudar tipo
                            });
                          }}
                        >
                          <option value="">Selecione...</option>
                          <option value={DocumentType.CPF}>CPF</option>
                          <option value={DocumentType.CNPJ}>CNPJ</option>
                          <option value={DocumentType.RG}>RG</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                          Documento {newCli.tipoDocumento ? `(${newCli.tipoDocumento})` : ''}
                        </label>
                        <input 
                          type="text" 
                          placeholder={newCli.tipoDocumento ? `Digite o ${newCli.tipoDocumento}` : "Selecione o tipo primeiro"}
                          className="w-full bg-slate-50 border border-slate-200 rounded-3xl px-8 h-16 text-sm font-bold focus:ring-4 focus:ring-blue-100 outline-none shadow-sm"
                          value={newCli.documento ? formatDocument(newCli.documento, newCli.tipoDocumento) : ''}
                          onChange={e => {
                            const rawValue = e.target.value.replace(/\D/g, '');
                            const maxLen = getMaxLength(newCli.tipoDocumento);
                            if (!maxLen || rawValue.length <= maxLen) {
                              setNewCli({...newCli, documento: rawValue});
                            }
                          }}
                          disabled={!newCli.tipoDocumento}
                          maxLength={newCli.tipoDocumento ? (newCli.tipoDocumento === DocumentType.CPF ? 14 : newCli.tipoDocumento === DocumentType.CNPJ ? 18 : 12) : undefined}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Endereço</label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2 space-y-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Rua</label>
                          <input 
                            type="text" 
                            placeholder="Nome da rua, avenida, etc."
                            className="w-full bg-slate-50 border border-slate-200 rounded-3xl px-6 h-14 text-sm font-bold focus:ring-4 focus:ring-blue-100 outline-none shadow-sm"
                            value={newCli.rua || ''}
                            onChange={e => setNewCli({...newCli, rua: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Número</label>
                          <input 
                            type="text" 
                            placeholder="123"
                            className="w-full bg-slate-50 border border-slate-200 rounded-3xl px-6 h-14 text-sm font-bold focus:ring-4 focus:ring-blue-100 outline-none shadow-sm"
                            value={newCli.numero || ''}
                            onChange={e => setNewCli({...newCli, numero: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Cidade</label>
                        <input 
                          type="text" 
                          placeholder="Cidade - Estado"
                          className="w-full bg-slate-50 border border-slate-200 rounded-3xl px-6 h-14 text-sm font-bold focus:ring-4 focus:ring-blue-100 outline-none shadow-sm"
                          value={newCli.cidade || 'Presidente Olegário-MG'}
                          onChange={e => setNewCli({...newCli, cidade: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-4 pt-4 border-t border-slate-100">
                    <button 
                      onClick={() => {
                        setIsModalOpen(null);
                        setNewCli({ cidade: 'Presidente Olegário-MG' });
                        setEditingCliId(null);
                      }}
                      className="bg-slate-100 text-slate-600 px-8 py-4 rounded-2xl font-black uppercase text-xs hover:bg-slate-200 transition-all active:scale-95"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={handleAddClient}
                      className="bg-blue-600 text-white px-12 py-4 rounded-2xl font-black uppercase text-xs shadow-2xl shadow-blue-500/20 active:scale-95 transition-all hover:bg-blue-700"
                    >
                      <Save size={18} className="inline mr-2" />
                      {editingCliId ? 'Atualizar Cliente' : 'Salvar Cliente'}
                    </button>
                  </div>
                </>
              )}

              {isModalOpen === 'finish-os' && finishingOSId && (
                <>
                  <div className="space-y-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
                      <p className="text-sm font-bold text-blue-800 mb-4">
                        Finalizar Ordem de Serviço: {finishingOSId}
                      </p>
                      <p className="text-xs text-blue-600">
                        Informe a data de conclusão para recalcular o valor final baseado nos dias reais de locação.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data de Conclusão *</label>
                      <input 
                        type="date" 
                        value={dataConclusao}
                        onChange={e => setDataConclusao(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-3xl px-8 h-16 text-sm font-bold focus:ring-4 focus:ring-blue-100 outline-none shadow-sm"
                        required
                      />
                      {dataConclusao && (
                        <p className="text-xs text-slate-500 mt-2">
                          Data selecionada: <span className="font-bold">{formatDateBR(dataConclusao)}</span>
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Desconto Manual (opcional)</label>
                      <input 
                        type="number" 
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        className="w-full bg-slate-50 border border-slate-200 rounded-3xl px-8 h-16 text-sm font-bold focus:ring-4 focus:ring-blue-100 outline-none shadow-sm"
                        value={descontoManualFinalizacao || ''}
                        onChange={e => setDescontoManualFinalizacao(parseFloat(e.target.value) || 0)}
                      />
                    </div>

                    {(() => {
                      const os = orders.find(o => o.id === finishingOSId);
                      if (!os || !dataConclusao) return null;
                      
                      const previewItems = os.items.map(item => ({ ...item, dataDevolucaoReal: dataConclusao }));
                      const previewSubtotal = previewItems.reduce((acc, item) => acc + calculateItemCost(item, true), 0);
                      const previewTotal = previewSubtotal - descontoManualFinalizacao;
                      
                      return (
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Valor Final Calculado</p>
                          <div className="space-y-2">
                            <div className="flex items-baseline justify-between">
                              <span className="text-sm text-slate-600">Subtotal:</span>
                              <span className="text-lg font-bold text-slate-800">R$ {previewSubtotal.toLocaleString()}</span>
                            </div>
                            {descontoManualFinalizacao > 0 && (
                              <div className="flex items-baseline justify-between text-red-600">
                                <span className="text-sm">Desconto:</span>
                                <span className="text-lg font-bold">- R$ {descontoManualFinalizacao.toLocaleString()}</span>
                              </div>
                            )}
                            <div className="border-t border-slate-300 pt-2 flex items-baseline justify-between">
                              <span className="text-sm font-bold text-slate-700">Total Final:</span>
                              <p className="text-3xl font-black text-blue-600">R$ {Math.max(0, previewTotal).toLocaleString()}</p>
                            </div>
                          </div>
                          <p className="text-xs text-slate-400 mt-3">
                            Valor previsto: <span className="line-through">R$ {os.valorTotalPrevisto.toLocaleString()}</span>
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            Baseado na data de conclusão informada
                          </p>
                        </div>
                      );
                    })()}
                  </div>

                  <div className="flex justify-end gap-4 pt-4 border-t border-slate-100">
                    <button 
                      onClick={() => {
                        setIsModalOpen(null);
                        setFinishingOSId(null);
                        setDataConclusao('');
                        setDescontoManualFinalizacao(0);
                      }}
                      className="bg-slate-100 text-slate-600 px-8 py-4 rounded-2xl font-black uppercase text-xs hover:bg-slate-200 transition-all active:scale-95"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={finishOS}
                      className="bg-blue-600 text-white px-12 py-4 rounded-2xl font-black uppercase text-xs shadow-2xl shadow-blue-500/20 active:scale-95 transition-all hover:bg-blue-700"
                    >
                      <CheckCircle2 size={18} className="inline mr-2" />
                      Finalizar e Recalcular
                    </button>
                  </div>
                </>
              )}

              {isModalOpen === 'despesa' && (
                <>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data *</label>
                      <input 
                        type="date" 
                        className="w-full bg-slate-50 border border-slate-200 rounded-3xl px-8 h-16 text-sm font-bold focus:ring-4 focus:ring-blue-100 outline-none shadow-sm"
                        value={newDespesa.data || ''}
                        onChange={e => setNewDespesa({...newDespesa, data: e.target.value})}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Agrupador *</label>
                      <select 
                        className="w-full bg-slate-50 border border-slate-200 rounded-3xl px-8 h-16 text-sm font-bold focus:ring-4 focus:ring-blue-100 outline-none shadow-sm"
                        value={newDespesa.agrupador || AgrupadorDespesa.OUTROS}
                        onChange={e => setNewDespesa({...newDespesa, agrupador: e.target.value})}
                        required
                      >
                        <option value={AgrupadorDespesa.MANUTENCAO}>Manutenção</option>
                        <option value={AgrupadorDespesa.ALUGUEL}>Aluguel</option>
                        <option value={AgrupadorDespesa.ENERGIA}>Energia</option>
                        <option value={AgrupadorDespesa.AGUA}>Água</option>
                        <option value={AgrupadorDespesa.COMBUSTIVEL}>Combustível</option>
                        <option value={AgrupadorDespesa.VEICULO}>Veículo</option>
                        <option value={AgrupadorDespesa.OUTROS}>Outros</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descrição *</label>
                      <textarea 
                        placeholder="Descrição detalhada da despesa"
                        className="w-full bg-slate-50 border border-slate-200 rounded-3xl px-8 py-4 h-24 text-sm font-bold focus:ring-4 focus:ring-blue-100 outline-none shadow-sm resize-none"
                        value={newDespesa.descricao || ''}
                        onChange={e => setNewDespesa({...newDespesa, descricao: e.target.value})}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Valor *</label>
                      <input 
                        type="number" 
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        className="w-full bg-slate-50 border border-slate-200 rounded-3xl px-8 h-16 text-sm font-bold focus:ring-4 focus:ring-blue-100 outline-none shadow-sm"
                        value={newDespesa.valor || ''}
                        onChange={e => setNewDespesa({...newDespesa, valor: parseFloat(e.target.value) || 0})}
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-4 pt-4 border-t border-slate-100">
                    <button 
                      onClick={() => {
                        setIsModalOpen(null);
                        setNewDespesa({
                          data: new Date().toISOString().split('T')[0],
                          agrupador: AgrupadorDespesa.OUTROS,
                          descricao: '',
                          valor: 0
                        });
                        setEditingDespesaId(null);
                      }}
                      className="bg-slate-100 text-slate-600 px-8 py-4 rounded-2xl font-black uppercase text-xs hover:bg-slate-200 transition-all active:scale-95"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={handleAddDespesa}
                      className="bg-blue-600 text-white px-12 py-4 rounded-2xl font-black uppercase text-xs shadow-2xl shadow-blue-500/20 active:scale-95 transition-all hover:bg-blue-700"
                    >
                      {editingDespesaId ? 'Atualizar' : 'Cadastrar'} Despesa
                    </button>
                  </div>
                </>
              )}

              {isModalOpen === 'retirada' && (
                <>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data Retirada *</label>
                      <input 
                        type="date" 
                        className="w-full bg-slate-50 border border-slate-200 rounded-3xl px-8 h-16 text-sm font-bold focus:ring-4 focus:ring-blue-100 outline-none shadow-sm"
                        value={newRetirada.dataRetirada || ''}
                        onChange={e => setNewRetirada({...newRetirada, dataRetirada: e.target.value})}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sócio Retirada *</label>
                      <input 
                        type="text" 
                        placeholder="Nome do sócio"
                        className="w-full bg-slate-50 border border-slate-200 rounded-3xl px-8 h-16 text-sm font-bold focus:ring-4 focus:ring-blue-100 outline-none shadow-sm"
                        value={newRetirada.socioRetirada || ''}
                        onChange={e => setNewRetirada({...newRetirada, socioRetirada: e.target.value})}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Valor *</label>
                      <input 
                        type="number" 
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        className="w-full bg-slate-50 border border-slate-200 rounded-3xl px-8 h-16 text-sm font-bold focus:ring-4 focus:ring-blue-100 outline-none shadow-sm"
                        value={newRetirada.valor || ''}
                        onChange={e => setNewRetirada({...newRetirada, valor: parseFloat(e.target.value) || 0})}
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-4 pt-4 border-t border-slate-100">
                    <button 
                      onClick={() => {
                        setIsModalOpen(null);
                        setNewRetirada({
                          dataRetirada: new Date().toISOString().split('T')[0],
                          socioRetirada: '',
                          valor: 0
                        });
                        setEditingRetiradaId(null);
                      }}
                      className="bg-slate-100 text-slate-600 px-8 py-4 rounded-2xl font-black uppercase text-xs hover:bg-slate-200 transition-all active:scale-95"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={handleAddRetirada}
                      className="bg-blue-600 text-white px-12 py-4 rounded-2xl font-black uppercase text-xs shadow-2xl shadow-blue-500/20 active:scale-95 transition-all hover:bg-blue-700"
                    >
                      {editingRetiradaId ? 'Atualizar' : 'Cadastrar'} Retirada
                    </button>
                  </div>
                </>
              )}

            </div>
          </div>
        </div>
      )}


      {/* Toast Notifications */}
      <ToastComponent />
    </div>
  );
};

// --- Helpers ---
const NavButton: React.FC<{ icon: React.ReactNode; label: string; active: boolean; onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-6 py-5 rounded-[1.5rem] transition-all ${active ? 'bg-blue-600 text-white shadow-2xl shadow-blue-600/20' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'}`}>
    <span>{icon}</span>
    <span className="font-bold text-sm tracking-tight">{label}</span>
  </button>
);

const StatCard: React.FC<{ label: string; value: any; color: string }> = ({ label, value, color }) => {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    green: 'bg-green-50 text-green-600 border-green-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    orange: 'bg-orange-50 text-orange-600 border-orange-100',
  };
  return (
    <div className={`p-8 rounded-[2.5rem] border ${colors[color]} shadow-sm`}>
      <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-70 leading-none">{label}</p>
      <p className="text-3xl font-black tracking-tighter leading-none">{value}</p>
    </div>
  );
};

export default App;
