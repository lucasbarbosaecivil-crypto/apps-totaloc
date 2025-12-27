import { useState, useEffect, useCallback } from 'react';
import {
  EquipmentModel,
  StockItem,
  Client,
  ServiceOrder,
  Retirada,
  Despesa,
} from '../types';
// RentalUnit e OSStatus não são mais usados aqui (foram removidos os dados padrão)

interface UseSyncStateReturn {
  // Estado
  catalogo: EquipmentModel[];
  stock: StockItem[];
  clients: Client[];
  orders: ServiceOrder[];
  retiradas: Retirada[];
  despesas: Despesa[];
  
  // Setters
  setCatalogo: (data: EquipmentModel[]) => void;
  setStock: (data: StockItem[]) => void;
  setClients: (data: Client[]) => void;
  setOrders: (data: ServiceOrder[]) => void;
  setRetiradas: (data: Retirada[]) => void;
  setDespesas: (data: Despesa[]) => void;
  
  // Ações
  saveToLocalStorage: () => void;
  loadFromLocalStorage: () => void;
}

/**
 * Hook que gerencia estado sincronizado - Google Sheets é a fonte de verdade
 * localStorage é usado apenas como cache temporário após carregar do Sheets
 * 
 * NOTA: Este hook NÃO depende mais de useSheetsSync para evitar dependências circulares.
 * O App.tsx gerencia a sincronização diretamente usando useSheetsSync.
 */
export function useSyncState(): UseSyncStateReturn {
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

  const [despesas, setDespesas] = useState<Despesa[]>(() => {
    // Não carrega do localStorage na inicialização - dados devem vir do Google Sheets
    return [];
  });

  // localStorage usado apenas como cache temporário - Google Sheets é a fonte de verdade
  // Sincroniza com localStorage quando houver dados (sem verificar autenticação aqui, pois é gerenciado pelo App.tsx)
  useEffect(() => {
    // Só salva no localStorage se tiver dados (evita sobrescrever com arrays vazios antes do carregamento)
    if (catalogo.length > 0) {
      localStorage.setItem('rental_catalogo', JSON.stringify(catalogo));
    }
  }, [catalogo]);

  useEffect(() => {
    // Stock não precisa ser salvo no localStorage (é calculado dinamicamente)
    // Mas podemos salvar como cache se necessário
    if (stock.length > 0) {
      localStorage.setItem('rental_stock', JSON.stringify(stock));
    }
  }, [stock]);

  useEffect(() => {
    if (clients.length > 0) {
      localStorage.setItem('rental_clients', JSON.stringify(clients));
    }
  }, [clients]);

  useEffect(() => {
    if (orders.length > 0) {
      localStorage.setItem('rental_orders', JSON.stringify(orders));
    }
  }, [orders]);

  useEffect(() => {
    if (retiradas.length > 0) {
      localStorage.setItem('rental_retiradas', JSON.stringify(retiradas));
    }
  }, [retiradas]);

  useEffect(() => {
    if (despesas.length > 0) {
      localStorage.setItem('rental_despesas', JSON.stringify(despesas));
    }
  }, [despesas]);

  const saveToLocalStorage = useCallback(() => {
    localStorage.setItem('rental_catalogo', JSON.stringify(catalogo));
    localStorage.setItem('rental_stock', JSON.stringify(stock));
    localStorage.setItem('rental_clients', JSON.stringify(clients));
    localStorage.setItem('rental_orders', JSON.stringify(orders));
    localStorage.setItem('rental_retiradas', JSON.stringify(retiradas));
    localStorage.setItem('rental_despesas', JSON.stringify(despesas));
  }, [catalogo, stock, clients, orders, retiradas, despesas]);

  const loadFromLocalStorage = useCallback(() => {
    // Não carrega mais do localStorage - Google Sheets é a única fonte de dados
    // Esta função é mantida apenas para compatibilidade, mas não faz nada
    console.log('⚠️ loadFromLocalStorage não é mais usado - use loadFromSheets()');
  }, []);


  return {
    catalogo,
    stock,
    clients,
    orders,
    retiradas,
    despesas,
    setCatalogo,
    setStock,
    setClients,
    setOrders,
    setRetiradas,
    setDespesas,
    saveToLocalStorage,
    loadFromLocalStorage,
  };
}

