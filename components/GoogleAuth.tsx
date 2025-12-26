import React, { useState } from 'react';
import { CheckCircle2, XCircle, Loader2, Download, RefreshCw, LogIn, LogOut, ShieldAlert } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';

interface GoogleAuthProps {
  isAuthenticated: boolean;
  accessToken: string | null;
  spreadsheetId: string;
  setSpreadsheetId: (id: string) => void;
  isSyncing?: boolean;
  syncError?: string | null;
  lastSync?: Date | null;
  onAuthenticate: (spreadsheetId: string, accessToken: string) => void;
  onDisconnect: () => void;
  onLoadFromSheets?: () => Promise<{ success: boolean; message?: string }>;
  onSyncToSheets?: () => Promise<void>;
}

export const GoogleAuth: React.FC<GoogleAuthProps> = ({
  isAuthenticated,
  accessToken,
  spreadsheetId,
  setSpreadsheetId,
  isSyncing = false,
  syncError = null,
  lastSync = null,
  onAuthenticate,
  onDisconnect,
  onLoadFromSheets,
  onSyncToSheets,
}) => {
  const [loadingManual, setLoadingManual] = useState(false);
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error' | null>(null);
  const [checkingPermission, setCheckingPermission] = useState(false);

  // Configuração do Google Login
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      console.log('✅ Login com Google iniciado, verificando permissões...');
      setCheckingPermission(true);

      if (tokenResponse.access_token) {
        try {
          // 1. Buscar dados do usuário para verificar o E-mail
          const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
          });
          
          if (!userInfoResponse.ok) throw new Error("Falha ao verificar identidade do usuário.");
          
          const userInfo = await userInfoResponse.json();
          const userEmail = userInfo.email;

          // 2. Ler lista de permitidos do .env
          const allowedEmailsEnv = import.meta.env.VITE_ALLOWED_EMAILS || "";
          // Cria array e limpa espaços em branco
          const allowedEmails = allowedEmailsEnv.split(',').map((e: string) => e.trim().toLowerCase()).filter((e: string) => e.length > 0);

          console.log(`👤 Usuário tentando logar: ${userEmail}`);

          // 3. Verificar se o email está na lista (Se a lista estiver vazia, bloqueia tudo por segurança)
          if (allowedEmails.length > 0 && allowedEmails.includes(userEmail.toLowerCase())) {
            // ✅ PERMITIDO
            onAuthenticate(spreadsheetId, tokenResponse.access_token);
            setLastMessage(`Bem-vindo(a), ${userInfo.name || userEmail}!`);
            setMessageType('success');
            setTimeout(() => {
              setLastMessage(null);
              setMessageType(null);
            }, 3000);
          } else {
            // ⛔ NEGADO
            console.warn(`⛔ Acesso negado para: ${userEmail}`);
            setLastMessage(`Acesso negado para o e-mail: ${userEmail}. Contate o administrador.`);
            setMessageType('error');
            // Não chama onAuthenticate, o usuário permanece desconectado
          }

        } catch (error) {
          console.error("Erro na verificação de usuário:", error);
          setLastMessage('Erro ao verificar permissões do usuário.');
          setMessageType('error');
        } finally {
          setCheckingPermission(false);
        }
      }
    },
    onError: (error) => {
      console.error('❌ Erro ao fazer login com Google:', error);
      setLastMessage('Erro ao conectar com Google. Tente novamente.');
      setMessageType('error');
      setCheckingPermission(false);
    },
    scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file email profile', // Adicionado email profile
  });

  const handleLogin = () => {
    if (!spreadsheetId.trim()) {
      setLastMessage('Por favor, informe o ID da planilha primeiro.');
      setMessageType('error');
      setTimeout(() => {
        setLastMessage(null);
        setMessageType(null);
      }, 3000);
      return;
    }
    googleLogin();
  };

  const handleDisconnect = () => {
    onDisconnect();
    setLastMessage('Desconectado com sucesso.');
    setMessageType('success');
    setTimeout(() => {
      setLastMessage(null);
      setMessageType(null);
    }, 3000);
  };

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
    if (isSyncing || loadingManual || checkingPermission) {
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
    if (checkingPermission) return 'Verificando permissões...';
    if (isSyncing || loadingManual) return 'Carregando...';
    if (syncError) return `Erro: ${syncError}`;
    if (messageType === 'error' && lastMessage) return lastMessage;
    if (messageType === 'success' && lastMessage) return lastMessage;
    if (isAuthenticated) return 'Conectado via Google OAuth';
    return 'Não conectado - Faça login com Google';
  };

  const getStatusBgColor = () => {
    if (syncError || messageType === 'error') return 'bg-red-50 border-red-200';
    if (messageType === 'success') return 'bg-green-50 border-green-200';
    if (isAuthenticated) return 'bg-green-50 border-green-200';
    return 'bg-yellow-50 border-yellow-200';
  };

  const getStatusTextColor = () => {
    if (syncError || messageType === 'error') return 'text-red-700';
    if (messageType === 'success') return 'text-green-700';
    if (isAuthenticated) return 'text-green-700';
    return 'text-yellow-700';
  };

  return (
    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm max-w-md mx-auto">
      <h3 className="text-xl font-black text-slate-800 mb-4">
        Configuração Google Sheets
      </h3>
      
      <div className="space-y-4">
        {/* Status Indicator */}
        <div className={`${getStatusBgColor()} border rounded-2xl p-4 transition-colors duration-300`}>
          <div className="flex items-center gap-3 mb-2">
            {getStatusIcon()}
            <p className={`text-sm font-bold ${getStatusTextColor()}`}>
              {getStatusMessage()}
            </p>
          </div>
          {lastSync && !syncError && !loadingManual && !checkingPermission && (
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
            placeholder="Ex: 1BoQDpRDjg_..."
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono"
            disabled={isAuthenticated || checkingPermission}
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

        {/* Botão de Login/Logout */}
        {!isAuthenticated ? (
          <button
            onClick={handleLogin}
            disabled={!spreadsheetId.trim() || checkingPermission}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-2xl transition-colors text-sm"
          >
            {checkingPermission ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
            <span>{checkingPermission ? 'Verificando...' : 'Conectar com Google'}</span>
          </button>
        ) : (
          <button
            onClick={handleDisconnect}
            className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-2xl transition-colors text-sm"
          >
            <LogOut size={16} />
            <span>Desconectar</span>
          </button>
        )}

        {/* Botões de Ação (apenas se autenticado) */}
        {isAuthenticated && (
          <div className="flex gap-3">
            {onLoadFromSheets && (
              <button
                onClick={handleLoadFromSheets}
                disabled={isSyncing || loadingManual}
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
                    <span>Carregar</span>
                  </>
                )}
              </button>
            )}
            {onSyncToSheets && (
              <button
                onClick={handleSyncToSheets}
                disabled={isSyncing || loadingManual}
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
        )}

        {/* Aviso sobre Segurança */}
        {!isAuthenticated && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-start gap-2">
            <ShieldAlert size={16} className="text-slate-400 mt-0.5" />
            <p className="text-xs text-slate-500">
              Acesso restrito a e-mails autorizados na organização.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
