import React from 'react';
import { RefreshCw, CheckCircle2, XCircle, Wifi, WifiOff } from 'lucide-react';

interface SyncStatusProps {
  isSyncing: boolean;
  lastSync: Date | null;
  error: string | null;
  isAuthenticated: boolean;
  onSync: () => void;
}

export const SyncStatus: React.FC<SyncStatusProps> = ({
  isSyncing,
  lastSync,
  error,
  isAuthenticated,
  onSync,
}) => {
  const formatLastSync = (date: Date | null) => {
    if (!date) return 'Nunca';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes}min atrás`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h atrás`;
    const days = Math.floor(hours / 24);
    return `${days}d atrás`;
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="hidden md:flex items-center gap-3">
      {isSyncing ? (
        <div className="flex items-center gap-2 text-xs text-blue-600 font-bold">
          <RefreshCw size={16} className="animate-spin" />
          <span>Sincronizando...</span>
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 text-xs text-red-600 font-bold" title={error}>
          <XCircle size={16} />
          <span>Erro</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-xs text-green-600 font-bold" title={`Última sync: ${formatLastSync(lastSync)}`}>
          <CheckCircle2 size={16} />
          <span className="hidden lg:inline">Sync OK</span>
        </div>
      )}

      <button
        onClick={onSync}
        disabled={isSyncing}
        className="bg-blue-600 text-white px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center gap-2"
        title="Sincronizar agora"
      >
        <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
        <span className="hidden sm:inline">Sync</span>
      </button>
    </div>
  );
};

