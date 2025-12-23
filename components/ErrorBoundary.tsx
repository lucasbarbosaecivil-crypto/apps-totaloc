import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Erro capturado pelo ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
          <div className="bg-white rounded-3xl p-8 max-w-2xl border border-slate-200 shadow-xl">
            <h1 className="text-2xl font-black text-red-600 mb-4">⚠️ Erro ao carregar aplicação</h1>
            <p className="text-slate-600 mb-4">
              Ocorreu um erro ao carregar o aplicativo. Por favor, verifique o console para mais detalhes.
            </p>
            {this.state.error && (
              <div className="bg-slate-100 rounded-xl p-4 mb-4">
                <p className="text-xs font-mono text-slate-700 break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all"
            >
              Recarregar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

