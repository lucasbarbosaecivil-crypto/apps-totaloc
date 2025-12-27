import { useState, useEffect, useCallback } from 'react';
import { useSheetsSync } from './useSheetsSync';
import {
  EquipmentModel,
  StockItem,
  Client,
  ServiceOrder,
  Retirada,
} from '../types';
// RentalUnit e OSStatus não são mais usados aqui (foram removidos os dados padrão)

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
 * Hook que gerencia estado sincronizado - Google Sheets é a fonte de verdade
 * localStorage é usado apenas como cache temporário após carregar do Sheets
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

  // Estado local - inicia vazio, dados vêm exclusivamente do Google Sheets
  const [catalogo, setCatalogo] = useState<EquipmentModel[]>(() => {
    // Não carrega do localStorage na inicialização - dados devem vir do Google Sheets
    return [];
  });

  const [stock, setStock] = useState<StockItem[]>(() => {
    // Stock é calculado dinamicamente baseado em equipamentos e locações
    // Não carrega do localStorage - sempre inicia vazio
    return [];
  });

  const [clients, setClients] = useState<Client[]>(() => {
    // Não carrega do localStorage na inicialização - dados devem vir do Google Sheets
    return [];
  });

  const [orders, setOrders] = useState<ServiceOrder[]>(() => {
    // Não carrega do localStorage na inicialização - dados devem vir do Google Sheets
    return [];
  });

  const [retiradas, setRetiradas] = useState<Retirada[]>(() => {
    // Não carrega do localStorage na inicialização - dados devem vir do Google Sheets
    return [];
  });

  // localStorage usado apenas como cache temporário - Google Sheets é a fonte de verdade
  // Sincroniza com localStorage apenas se já estiver autenticado e houver dados do Sheets
  useEffect(() => {
    // Só salva no localStorage se tiver dados do Google Sheets (evita sobrescrever com arrays vazios antes do carregamento)
    if (isAuthenticated && catalogo.length > 0) {
      localStorage.setItem('rental_catalogo', JSON.stringify(catalogo));
    }
  }, [catalogo, isAuthenticated]);

  useEffect(() => {
    // Stock não precisa ser salvo no localStorage (é calculado dinamicamente)
    // Mas podemos salvar como cache se necessário
    if (isAuthenticated && stock.length > 0) {
      localStorage.setItem('rental_stock', JSON.stringify(stock));
    }
  }, [stock, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && clients.length > 0) {
      localStorage.setItem('rental_clients', JSON.stringify(clients));
    }
  }, [clients, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && orders.length > 0) {
      localStorage.setItem('rental_orders', JSON.stringify(orders));
    }
  }, [orders, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && retiradas.length > 0) {
      localStorage.setItem('rental_retiradas', JSON.stringify(retiradas));
    }
  }, [retiradas, isAuthenticated]);

  const saveToLocalStorage = useCallback(() => {
    localStorage.setItem('rental_catalogo', JSON.stringify(catalogo));
    localStorage.setItem('rental_stock', JSON.stringify(stock));
    localStorage.setItem('rental_clients', JSON.stringify(clients));
    localStorage.setItem('rental_orders', JSON.stringify(orders));
    localStorage.setItem('rental_retiradas', JSON.stringify(retiradas));
  }, [catalogo, stock, clients, orders, retiradas]);

  const loadFromLocalStorage = useCallback(() => {
    // Não carrega mais do localStorage - Google Sheets é a única fonte de dados
    // Esta função é mantida apenas para compatibilidade, mas não faz nada
    console.log('⚠️ loadFromLocalStorage não é mais usado - use loadFromSheets()');
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
      despesas: [], // Despesas não são gerenciadas pelo useSyncState, então passa vazio
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
        // Google Sheets é a fonte de verdade - sempre sobrescreve, mesmo se vazio
        setCatalogo(data.catalogo || []);
        setClients(data.clients || []);
        setOrders(data.orders || []);
        setRetiradas(data.retiradas || []);
        
        // Stock: se houver dados no Sheets, carrega; senão, mantém vazio (será calculado dinamicamente)
        if (data.stock && data.stock.length > 0) {
          console.log(`✅ Carregando ${data.stock.length} itens do stock do Sheets`);
          setStock(data.stock);
        } else {
          // Stock vazio no Sheets - mantém vazio (será calculado dinamicamente baseado em equipamentos e locações)
          console.log('ℹ️ Stock vazio no Sheets, será calculado dinamicamente');
          setStock([]);
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

  // Carrega do Sheets ao autenticar (com tratamento de erro)
  // IMPORTANTE: Este useEffect deve vir DEPOIS da declaração de loadFromSheets
  useEffect(() => {
    if (isAuthenticated) {
      console.log('🔄 Tentando carregar dados do Google Sheets automaticamente...');
      loadFromSheets()
        .then((result) => {
          if (result.success) {
            console.log('✅ Carregamento automático concluído:', result.message);
          } else {
            console.warn('⚠️ Carregamento automático falhou:', result.message);
            console.log('📦 App iniciará sem dados - conecte-se ao Google Sheets para carregar');
          }
        })
        .catch((error) => {
          console.error('❌ Erro ao carregar dados do Sheets:', error);
          console.log('📦 App iniciará sem dados - conecte-se ao Google Sheets para carregar');
        });
    } else {
      console.log('⏸️ Autenticação não disponível - conecte-se ao Google Sheets para carregar dados');
    }
  }, [isAuthenticated, loadFromSheets]);

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

