import { useState, useEffect, useCallback } from 'react';
import { useSheetsSync } from './useSheetsSync';
import {
  EquipmentModel,
  StockItem,
  Client,
  ServiceOrder,
  Retirada,
} from '../types';
import { RentalUnit, OSStatus } from '../types';

interface UseSyncStateReturn {
  // Estado
  catalogo: EquipmentModel[];
  stock: StockItem[];
  clients: Client[];
  orders: ServiceOrder[];
  retiradas: Retirada[];
  
  // Setters
  setCatalogo: (data: EquipmentModel[]) => void;
  setStock: (data: StockItem[]) => void;
  setClients: (data: Client[]) => void;
  setOrders: (data: ServiceOrder[]) => void;
  setRetiradas: (data: Retirada[]) => void;
  
  // Ações
  saveToLocalStorage: () => void;
  loadFromLocalStorage: () => void;
  syncToSheets: () => Promise<void>;
  loadFromSheets: () => Promise<{ success: boolean; message?: string }>;
  
  // Status
  isSyncing: boolean;
  syncError: string | null;
  lastSync: Date | null;
}

/**
 * Hook que gerencia estado sincronizado entre localStorage e Google Sheets
 */
export function useSyncState(): UseSyncStateReturn {
  const {
    isAuthenticated,
    isSyncing,
    lastSync,
    syncError,
    syncAll,
    loadAll,
  } = useSheetsSync();

  // Estado local (mantém compatibilidade com código existente)
  const [catalogo, setCatalogo] = useState<EquipmentModel[]>(() => {
    const saved = localStorage.getItem('rental_catalogo');
    return saved ? JSON.parse(saved) : [
      { id: 'M1', nome: 'Escavadeira Caterpillar 320', descricao: 'Hidráulica', valorUnitario: 1200, unidade: RentalUnit.DIARIA },
      { id: 'M2', nome: 'Gerador Stemac 100kVA', descricao: 'Silencioso', valorUnitario: 4500, unidade: RentalUnit.MES }
    ];
  });

  const [stock, setStock] = useState<StockItem[]>(() => {
    const saved = localStorage.getItem('rental_stock');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Se o localStorage tem um array vazio, usa dados padrão
      if (Array.isArray(parsed) && parsed.length === 0) {
        console.log('⚠️ localStorage tem stock vazio, usando dados padrão');
        const defaultStock = [
          { id: 'SN-CAT-001', modelId: 'M1', foto: 'https://images.unsplash.com/photo-1578319439584-104c94d37305?w=400' },
          { id: 'SN-CAT-002', modelId: 'M1', foto: 'https://images.unsplash.com/photo-1578319439584-104c94d37305?w=400' },
          { id: 'SN-GEN-99', modelId: 'M2', foto: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400' }
        ];
        localStorage.setItem('rental_stock', JSON.stringify(defaultStock));
        return defaultStock;
      }
      return parsed;
    }
    // Dados padrão apenas se não houver nada salvo
    const defaultStock = [
      { id: 'SN-CAT-001', modelId: 'M1', foto: 'https://images.unsplash.com/photo-1578319439584-104c94d37305?w=400' },
      { id: 'SN-CAT-002', modelId: 'M1', foto: 'https://images.unsplash.com/photo-1578319439584-104c94d37305?w=400' },
      { id: 'SN-GEN-99', modelId: 'M2', foto: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400' }
    ];
    localStorage.setItem('rental_stock', JSON.stringify(defaultStock));
    return defaultStock;
  });

  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem('rental_clients');
    return saved ? JSON.parse(saved) : [
      { 
        id: 'c1', 
        nome: 'Construtora Horizonte', 
        email: 'obra1@horizonte.com.br', 
        telefone: '(11) 98765-4321', 
        rua: 'Rua das Obras',
        numero: '450',
        cidade: 'Presidente Olegário-MG'
      }
    ];
  });

  const [orders, setOrders] = useState<ServiceOrder[]>(() => {
    const saved = localStorage.getItem('rental_orders');
    return saved ? JSON.parse(saved) : [];
  });

  const [retiradas, setRetiradas] = useState<Retirada[]>(() => {
    const saved = localStorage.getItem('rental_retiradas');
    return saved ? JSON.parse(saved) : [];
  });

  // Sincroniza com localStorage sempre que houver mudança
  useEffect(() => {
    localStorage.setItem('rental_catalogo', JSON.stringify(catalogo));
  }, [catalogo]);

  useEffect(() => {
    localStorage.setItem('rental_stock', JSON.stringify(stock));
  }, [stock]);

  useEffect(() => {
    localStorage.setItem('rental_clients', JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem('rental_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('rental_retiradas', JSON.stringify(retiradas));
  }, [retiradas]);

  // Carrega do Sheets ao autenticar (com tratamento de erro)
  useEffect(() => {
    if (isAuthenticated) {
      console.log('🔄 Tentando carregar dados do Google Sheets automaticamente...');
      loadFromSheets()
        .then((result) => {
          if (result.success) {
            console.log('✅ Carregamento automático concluído:', result.message);
          } else {
            console.warn('⚠️ Carregamento automático falhou:', result.message);
            console.log('📦 Continuando com dados do localStorage...');
          }
        })
        .catch((error) => {
          console.error('❌ Erro ao carregar dados do Sheets (usando cache local):', error);
          // Continua com dados do localStorage se falhar
        });
    } else {
      console.log('⏸️ Autenticação não disponível, usando apenas dados locais');
    }
  }, [isAuthenticated, loadFromSheets]);

  const saveToLocalStorage = useCallback(() => {
    localStorage.setItem('rental_catalogo', JSON.stringify(catalogo));
    localStorage.setItem('rental_stock', JSON.stringify(stock));
    localStorage.setItem('rental_clients', JSON.stringify(clients));
    localStorage.setItem('rental_orders', JSON.stringify(orders));
    localStorage.setItem('rental_retiradas', JSON.stringify(retiradas));
  }, [catalogo, stock, clients, orders, retiradas]);

  const loadFromLocalStorage = useCallback(() => {
    const savedCatalogo = localStorage.getItem('rental_catalogo');
    const savedStock = localStorage.getItem('rental_stock');
    const savedClients = localStorage.getItem('rental_clients');
    const savedOrders = localStorage.getItem('rental_orders');
    const savedRetiradas = localStorage.getItem('rental_retiradas');

    if (savedCatalogo) setCatalogo(JSON.parse(savedCatalogo));
    if (savedStock) setStock(JSON.parse(savedStock));
    if (savedClients) setClients(JSON.parse(savedClients));
    if (savedOrders) setOrders(JSON.parse(savedOrders));
    if (savedRetiradas) setRetiradas(JSON.parse(savedRetiradas));
  }, []);

  const syncToSheets = useCallback(async () => {
    if (!isAuthenticated) {
      throw new Error('Não autenticado. Conecte-se ao Google Sheets primeiro.');
    }

    await syncAll({
      catalogo,
      stock,
      clients,
      orders,
      retiradas,
    });
  }, [isAuthenticated, catalogo, stock, clients, orders, retiradas, syncAll]);

  const loadFromSheets = useCallback(async (): Promise<{ success: boolean; message?: string }> => {
    if (!isAuthenticated) {
      const msg = 'Não autenticado. Configure o Google Sheets primeiro.';
      console.warn('⚠️', msg);
      return { success: false, message: msg };
    }

    try {
      console.log('🔄 Iniciando carregamento dos dados do Google Sheets...');
      const data = await loadAll();
      if (data) {
        // Google Sheets é a fonte de verdade - sobrescreve sempre
        setCatalogo(data.catalogo || []);
        setClients(data.clients || []);
        setOrders(data.orders || []);
        if (data.retiradas) {
          setRetiradas(data.retiradas);
        } else {
          setRetiradas([]);
        }
        
        // Stock é calculado virtualmente - só atualiza se houver dados no Sheets
        // Caso contrário, mantém os dados locais (que são calculados baseado em equipamentos e locações)
        if (data.stock && data.stock.length > 0) {
          console.log(`✅ Carregando ${data.stock.length} itens do stock do Sheets`);
          setStock(data.stock);
        } else {
          // Stock vazio no Sheets - mantém cálculo virtual local
          console.log('⚠️ Stock vazio no Sheets, mantendo cálculo virtual local');
        }
        
        const totalItems = data.catalogo.length + data.clients.length + data.orders.length + (data.retiradas?.length || 0);
        const successMsg = `Dados carregados com sucesso! (${totalItems} registros)`;
        console.log(`✅ ${successMsg}`);
        return { success: true, message: successMsg };
      } else {
        const msg = 'Nenhum dado retornado do Google Sheets.';
        console.warn('⚠️', msg);
        return { success: false, message: msg };
      }
    } catch (error: any) {
      const errorMsg = error.message || 'Erro desconhecido ao carregar dados';
      console.error('❌ Erro ao carregar do Sheets:', error);
      return { success: false, message: errorMsg };
    }
  }, [isAuthenticated, loadAll]);

  return {
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
    saveToLocalStorage,
    loadFromLocalStorage,
    syncToSheets,
    loadFromSheets,
    isSyncing,
    syncError,
    lastSync,
  };
}

