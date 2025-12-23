import { useState, useEffect, useCallback } from 'react';
import { sheetsSyncService, SyncStatus } from '../services/sheetsSyncService';
import { getServiceAccountConfig } from '../services/serviceAccountAuth';
import {
  EquipmentModel,
  StockItem,
  Client,
  ServiceOrder,
  Retirada,
} from '../types';

interface UseSheetsSyncReturn {
  // Estado
  isAuthenticated: boolean;
  isSyncing: boolean;
  lastSync: Date | null;
  syncError: string | null;
  spreadsheetId: string;

  // Ações
  authenticate: (spreadsheetId: string, accessToken: string) => void;
  disconnect: () => void;
  syncAll: (data: {
    catalogo: EquipmentModel[];
    stock: StockItem[];
    clients: Client[];
    orders: ServiceOrder[];
  }) => Promise<void>;
  loadAll: () => Promise<{
    catalogo: EquipmentModel[];
    stock: StockItem[];
    clients: Client[];
    orders: ServiceOrder[];
  } | null>;
  setSpreadsheetId: (id: string) => void;
}

/**
 * Hook para gerenciar sincronização com Google Sheets
 */
export function useSheetsSync(): UseSheetsSyncReturn {
  // Com Service Account, sempre está autenticado
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  
  // ID da planilha padrão ou do localStorage
  const [spreadsheetId, setSpreadsheetIdState] = useState<string>(() => {
    const saConfig = getServiceAccountConfig();
    return localStorage.getItem('sheets_spreadsheet_id') || saConfig.spreadsheetId;
  });

  // Configura Service Account automaticamente ao carregar (com tratamento de erro)
  useEffect(() => {
    // Configura com Service Account de forma assíncrona e segura
    const setupServiceAccount = async () => {
      try {
        console.log('🔧 Configurando Service Account...');
        // Configura com Service Account usando getAccessToken
        const config = getServiceAccountConfig();
        sheetsSyncService.setConfig({
          spreadsheetId: config.spreadsheetId,
          getAccessToken: config.getAccessToken,
        });
        // Testa a autenticação tentando obter um token
        try {
          const token = await config.getAccessToken();
          console.log('✅ Service Account configurado com sucesso');
          setIsAuthenticated(true);
          setSyncError(null);
        } catch (authError: any) {
          console.error('❌ Erro ao autenticar Service Account:', authError);
          const errorMsg = authError.message || 'Erro ao autenticar';
          // Verifica se é erro de arquivo não encontrado
          if (errorMsg.includes('404') || errorMsg.includes('Não foi possível carregar credenciais')) {
            setSyncError('Arquivo de credenciais não encontrado. Verifique se o arquivo JSON está na pasta public/');
          } else {
            setSyncError(`Erro de autenticação: ${errorMsg}`);
          }
          setIsAuthenticated(false);
        }
      } catch (error: any) {
        console.error('❌ Erro ao configurar Service Account:', error);
        setSyncError(error.message || 'Erro ao configurar autenticação');
        setIsAuthenticated(false);
      }
    };
    
    setupServiceAccount();
  }, []);

  const authenticate = useCallback((spreadsheetId: string, accessToken?: string) => {
    // Com Service Account, não precisa de accessToken manual
    localStorage.setItem('sheets_spreadsheet_id', spreadsheetId);
    setSpreadsheetIdState(spreadsheetId);
    
    // Reconfigura Service Account
    const config = getServiceAccountConfig();
    sheetsSyncService.setConfig({
      spreadsheetId: spreadsheetId,
      getAccessToken: config.getAccessToken,
    });
    
    setIsAuthenticated(true);
    setSyncError(null);
  }, []);

  const disconnect = useCallback(() => {
    // Com Service Account, não desconecta completamente
    // Apenas limpa preferências do usuário
    localStorage.removeItem('sheets_spreadsheet_id');
    const saConfig = getServiceAccountConfig();
    setSpreadsheetIdState(saConfig.spreadsheetId);
    setIsAuthenticated(true); // Sempre autenticado com Service Account
    setSyncError(null);
  }, []);

  const setSpreadsheetId = useCallback((id: string) => {
    setSpreadsheetIdState(id);
    localStorage.setItem('sheets_spreadsheet_id', id);
  }, []);

  const syncAll = useCallback(async (data: {
    catalogo: EquipmentModel[];
    stock: StockItem[];
    clients: Client[];
    orders: ServiceOrder[];
    retiradas: Retirada[];
  }) => {
    if (!isAuthenticated) {
      throw new Error('Não autenticado. Conecte-se ao Google Sheets primeiro.');
    }

    setIsSyncing(true);
    setSyncError(null);

    try {
      await sheetsSyncService.ensureSheetsExist();
      await sheetsSyncService.syncAll(data);
      setLastSync(new Date());
    } catch (error: any) {
      setSyncError(error.message || 'Erro ao sincronizar');
      throw error;
    } finally {
      setIsSyncing(false);
    }
  }, [isAuthenticated]);

  const loadAll = useCallback(async () => {
    if (!isAuthenticated) {
      const errorMsg = 'Não autenticado. Configure o Google Sheets primeiro.';
      setSyncError(errorMsg);
      console.warn('⚠️', errorMsg);
      return null;
    }

    setIsSyncing(true);
    setSyncError(null);
    console.log('📥 Carregando dados do Google Sheets...');

    try {
      const data = await sheetsSyncService.loadAll();
      if (data) {
        console.log(`✅ Dados carregados: ${data.catalogo.length} equipamentos, ${data.clients.length} clientes, ${data.orders.length} ordens, ${data.retiradas?.length || 0} retiradas`);
      }
      setLastSync(new Date());
      return data;
    } catch (error: any) {
      const errorMsg = error.message || 'Erro ao carregar dados';
      console.error('❌ Erro ao carregar dados do Sheets:', error);
      
      // Mensagens de erro mais específicas
      let userFriendlyError = errorMsg;
      if (errorMsg.includes('404')) {
        userFriendlyError = 'Planilha não encontrada. Verifique o ID da planilha.';
      } else if (errorMsg.includes('403') || errorMsg.includes('permission')) {
        userFriendlyError = 'Sem permissão para acessar a planilha. Compartilhe a planilha com o email da Service Account.';
      } else if (errorMsg.includes('401') || errorMsg.includes('Unauthorized')) {
        userFriendlyError = 'Erro de autenticação. Verifique as credenciais.';
      } else if (errorMsg.includes('fetch')) {
        userFriendlyError = 'Erro de conexão. Verifique sua conexão com a internet.';
      }
      
      setSyncError(userFriendlyError);
      return null;
    } finally {
      setIsSyncing(false);
    }
  }, [isAuthenticated]);

  return {
    isAuthenticated,
    isSyncing,
    lastSync,
    syncError,
    spreadsheetId,
    authenticate,
    disconnect,
    syncAll,
    loadAll,
    setSpreadsheetId,
  };
}

