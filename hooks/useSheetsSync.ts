import { useState, useEffect, useCallback } from 'react';
import { sheetsSyncService } from '../services/sheetsSyncService';
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
  accessToken: string | null;
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
    retiradas: Retirada[];
  }) => Promise<void>;
  loadAll: () => Promise<{
    catalogo: EquipmentModel[];
    stock: StockItem[];
    clients: Client[];
    orders: ServiceOrder[];
    retiradas: Retirada[];
  } | null>;
  setSpreadsheetId: (id: string) => void;
}

/**
 * Hook para gerenciar sincronização com Google Sheets usando OAuth 2.0
 */
export function useSheetsSync(): UseSheetsSyncReturn {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(() => {
    // Tenta recuperar token do localStorage
    return localStorage.getItem('google_access_token');
  });
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  
  // ID da planilha padrão ou do localStorage
  const [spreadsheetId, setSpreadsheetIdState] = useState<string>(() => {
    return localStorage.getItem('sheets_spreadsheet_id') || '1BoQDpRDjg_Cwp-9OSkf2emUdkmdF7xx5ZIPGJNm5vuQ';
  });

  // Verifica autenticação ao carregar
  useEffect(() => {
    const token = localStorage.getItem('google_access_token');
    const savedSpreadsheetId = localStorage.getItem('sheets_spreadsheet_id');
    
    if (token) {
      setIsAuthenticated(true);
      setAccessToken(token);
      if (savedSpreadsheetId) {
        setSpreadsheetIdState(savedSpreadsheetId);
      }
    } else {
      setIsAuthenticated(false);
      setAccessToken(null);
    }
  }, []);

  const authenticate = useCallback((spreadsheetId: string, token: string) => {
    localStorage.setItem('google_access_token', token);
    localStorage.setItem('sheets_spreadsheet_id', spreadsheetId);
    setAccessToken(token);
    setSpreadsheetIdState(spreadsheetId);
    setIsAuthenticated(true);
    setSyncError(null);
  }, []);

  const disconnect = useCallback(() => {
    localStorage.removeItem('google_access_token');
    localStorage.removeItem('sheets_spreadsheet_id');
    setAccessToken(null);
    setIsAuthenticated(false);
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
    if (!isAuthenticated || !accessToken) {
      throw new Error('Não autenticado. Faça login com Google primeiro.');
    }

    setIsSyncing(true);
    setSyncError(null);

    try {
      await sheetsSyncService.ensureSheetsExist(accessToken, spreadsheetId);
      await sheetsSyncService.syncAll(accessToken, spreadsheetId, data);
      setLastSync(new Date());
    } catch (error: any) {
      const errorMsg = error.message || 'Erro ao sincronizar';
      console.error('❌ Erro ao sincronizar dados:', error);
      
      // 🚨 TRATAMENTO DE ERRO 401 (Token Expirado) 🚨
      // Se o erro for 401 (Token Vencido/Inválido) ou qualquer erro de autenticação
      if (
        errorMsg.includes('401') || 
        errorMsg.includes('Unauthorized') || 
        errorMsg.includes('invalid authentication') || 
        errorMsg.includes('credentials') ||
        errorMsg.includes('invalid_grant') ||
        errorMsg.includes('Token expired') ||
        errorMsg.includes('token expired')
      ) {
        console.warn('🔒 Token expirado ou inválido durante sincronização. Desconectando automaticamente...');
        // Limpa tudo e força o usuário a logar de novo
        disconnect();
        setSyncError('Sessão expirada. Por favor, faça login novamente.');
        // Não relança o erro para evitar que o auto-sync continue tentando
        return;
      }
      
      setSyncError(errorMsg);
      throw error;
    } finally {
      setIsSyncing(false);
    }
  }, [isAuthenticated, accessToken, spreadsheetId, disconnect]);

  const loadAll = useCallback(async () => {
    if (!isAuthenticated || !accessToken) {
      const errorMsg = 'Não autenticado. Faça login com Google primeiro.';
      setSyncError(errorMsg);
      console.warn('⚠️', errorMsg);
      return null;
    }

    setIsSyncing(true);
    setSyncError(null);
    console.log('📥 Carregando dados do Google Sheets...');

    try {
      const data = await sheetsSyncService.loadAll(accessToken, spreadsheetId);
      if (data) {
        console.log(`✅ Dados carregados do Google Sheets:`);
        console.log(`   - Equipamentos: ${data.catalogo.length}`);
        console.log(`   - Clientes: ${data.clients.length}`);
        console.log(`   - Ordens: ${data.orders.length}`);
        console.log(`   - Retiradas: ${data.retiradas?.length || 0}`);
        
        if (data.catalogo.length === 0) {
          console.warn('⚠️ Nenhum equipamento foi carregado. Verifique se a aba EQUIPAMENTOS possui dados.');
        }
      } else {
        console.warn('⚠️ loadAll retornou null - nenhum dado foi carregado');
      }
      setLastSync(new Date());
      return data;
    } catch (error: any) {
      const errorMsg = error.message || 'Erro ao carregar dados';
      console.error('❌ Erro ao carregar dados do Sheets:', error);
      
      // 🚨 TRATAMENTO DE ERRO 401 (Token Expirado) 🚨
      // Se o erro for 401 (Token Vencido/Inválido) ou qualquer erro de autenticação
      if (
        errorMsg.includes('401') || 
        errorMsg.includes('Unauthorized') || 
        errorMsg.includes('invalid authentication') || 
        errorMsg.includes('credentials') ||
        errorMsg.includes('invalid_grant') ||
        errorMsg.includes('Token expired') ||
        errorMsg.includes('token expired')
      ) {
        console.warn('🔒 Token expirado ou inválido. Desconectando automaticamente...');
        // Limpa tudo e força o usuário a logar de novo
        disconnect();
        setSyncError('Sessão expirada. Por favor, faça login novamente.');
        return null;
      }
      
      // Mensagens de erro mais específicas para outros erros
      let userFriendlyError = errorMsg;
      if (errorMsg.includes('404')) {
        userFriendlyError = 'Planilha não encontrada. Verifique o ID da planilha.';
      } else if (errorMsg.includes('403') || errorMsg.includes('permission')) {
        userFriendlyError = 'Sem permissão para acessar a planilha. Verifique as permissões do Google OAuth.';
      } else if (errorMsg.includes('fetch')) {
        userFriendlyError = 'Erro de conexão. Verifique sua conexão com a internet.';
      }
      
      setSyncError(userFriendlyError);
      return null;
    } finally {
      setIsSyncing(false);
    }
  }, [isAuthenticated, accessToken, spreadsheetId, disconnect]);

  return {
    isAuthenticated,
    accessToken,
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
