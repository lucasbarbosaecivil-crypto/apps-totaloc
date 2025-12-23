import React, { useState } from 'react';
import { CheckCircle2, XCircle, Loader2, Download, RefreshCw } from 'lucide-react';

interface GoogleAuthProps {
  isAuthenticated: boolean;
  spreadsheetId: string;
  setSpreadsheetId: (id: string) => void;
  isSyncing?: boolean;
  syncError?: string | null;
  lastSync?: Date | null;
  onLoadFromSheets?: () => Promise<{ success: boolean; message?: string }>;
  onSyncToSheets?: () => Promise<void>;
}

export const GoogleAuth: React.FC<GoogleAuthProps> = ({
  isAuthenticated,
  spreadsheetId,
  setSpreadsheetId,
  isSyncing = false,
  syncError = null,
  lastSync = null,
  onLoadFromSheets,
  onSyncToSheets,
}) => {
  const [loadingManual, setLoadingManual] = useState(false);
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error' | null>(null);

  const handleLoadFromSheets = async () => {
    if (!onLoadFromSheets) return;
    
    setLoadingManual(true);
    setLastMessage(null);
    setMessageType(null);
    
    try {
      const result = await onLoadFromSheets();
      if (result.success) {
        setLastMessage(result.message || 'Dados carregados com sucesso!');
        setMessageType('success');
      } else {
        setLastMessage(result.message || 'Erro ao carregar dados');
        setMessageType('error');
      }
    } catch (error: any) {
      setLastMessage(error.message || 'Erro ao carregar dados');
      setMessageType('error');
    } finally {
      setLoadingManual(false);
      // Limpa mensagem após 5 segundos
      setTimeout(() => {
        setLastMessage(null);
        setMessageType(null);
      }, 5000);
    }
  };

  const handleSyncToSheets = async () => {
    if (!onSyncToSheets) return;
    
    try {
      await onSyncToSheets();
      setLastMessage('Dados sincronizados com sucesso!');
      setMessageType('success');
      setTimeout(() => {
        setLastMessage(null);
        setMessageType(null);
      }, 3000);
    } catch (error: any) {
      setLastMessage(error.message || 'Erro ao sincronizar dados');
      setMessageType('error');
      setTimeout(() => {
        setLastMessage(null);
        setMessageType(null);
      }, 5000);
    }
  };

  const getStatusIcon = () => {
    if (isSyncing || loadingManual) {
      return <Loader2 size={20} className="text-blue-600 animate-spin" />;
    }
    if (syncError || messageType === 'error') {
      return <XCircle size={20} className="text-red-600" />;
    }
    if (isAuthenticated) {
      return <CheckCircle2 size={20} className="text-green-600" />;
    }
    return <XCircle size={20} className="text-yellow-600" />;
  };

  const getStatusMessage = () => {
    if (isSyncing || loadingManual) {
      return 'Carregando...';
    }
    if (syncError) {
      return `Erro: ${syncError}`;
    }
    if (messageType === 'error' && lastMessage) {
      return lastMessage;
    }
    if (messageType === 'success' && lastMessage) {
      return lastMessage;
    }
    if (isAuthenticated) {
      return 'Conectado via Service Account';
    }
    return 'Não conectado';
  };

  const getStatusBgColor = () => {
    if (syncError || messageType === 'error') {
      return 'bg-red-50 border-red-200';
    }
    if (messageType === 'success') {
      return 'bg-green-50 border-green-200';
    }
    if (isAuthenticated) {
      return 'bg-green-50 border-green-200';
    }
    return 'bg-yellow-50 border-yellow-200';
  };

  const getStatusTextColor = () => {
    if (syncError || messageType === 'error') {
      return 'text-red-700';
    }
    if (messageType === 'success') {
      return 'text-green-700';
    }
    if (isAuthenticated) {
      return 'text-green-700';
    }
    return 'text-yellow-700';
  };

  return (
    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm max-w-md mx-auto">
      <h3 className="text-xl font-black text-slate-800 mb-4">
        Configuração Google Sheets
      </h3>
      
      <div className="space-y-4">
        {/* Status Indicator */}
        <div className={`${getStatusBgColor()} border rounded-2xl p-4`}>
          <div className="flex items-center gap-3 mb-2">
            {getStatusIcon()}
            <p className={`text-sm font-bold ${getStatusTextColor()}`}>
              {getStatusMessage()}
            </p>
          </div>
          {lastSync && !syncError && !loadingManual && (
            <p className="text-xs text-slate-600">
              Última sincronização: {lastSync.toLocaleString('pt-BR')}
            </p>
          )}
        </div>

        {/* ID da Planilha */}
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
            ID da Planilha Google Sheets
          </label>
          <input
            type="text"
            value={spreadsheetId}
            onChange={(e) => setSpreadsheetId(e.target.value)}
            placeholder="Ex: 1BoQDpRDjg_Cwp-9OSkf2emUdkmdF7xx5ZIPGJNm5vuQ"
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono"
          />
          <p className="text-xs text-slate-400 mt-2">
            O ID fica na URL da planilha: <code className="bg-slate-100 px-1 rounded">docs.google.com/spreadsheets/d/<strong>ID_AQUI</strong>/edit</code>
          </p>
          {!spreadsheetId && (
            <button
              onClick={() => setSpreadsheetId('1BoQDpRDjg_Cwp-9OSkf2emUdkmdF7xx5ZIPGJNm5vuQ')}
              className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-bold"
            >
              Usar planilha padrão
            </button>
          )}
        </div>

        {/* Botões de Ação */}
        <div className="flex gap-3">
          {onLoadFromSheets && (
            <button
              onClick={handleLoadFromSheets}
              disabled={!isAuthenticated || isSyncing || loadingManual}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-2xl transition-colors text-sm"
            >
              {loadingManual ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Carregando...</span>
                </>
              ) : (
                <>
                  <Download size={16} />
                  <span>Carregar do Sheets</span>
                </>
              )}
            </button>
          )}
          {onSyncToSheets && (
            <button
              onClick={handleSyncToSheets}
              disabled={!isAuthenticated || isSyncing || loadingManual}
              className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-2xl transition-colors text-sm"
            >
              {isSyncing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Sincronizando...</span>
                </>
              ) : (
                <>
                  <RefreshCw size={16} />
                  <span>Sincronizar</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Aviso de Compartilhamento */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
          <p className="text-xs text-blue-700 font-bold mb-1">
            ⚠️ Importante:
          </p>
          <p className="text-xs text-blue-600">
            Certifique-se de compartilhar a planilha com: <code className="bg-blue-100 px-1 rounded">locadora-equip@locadora-482015.iam.gserviceaccount.com</code> com permissão de <strong>Editor</strong>.
          </p>
        </div>
      </div>
    </div>
  );
};

