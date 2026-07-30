import React from 'react';
import { HeartPulse, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Dokta Error Boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-10 max-w-md w-full text-center space-y-6">
            <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto">
              <HeartPulse className="text-rose-500" size={32} />
            </div>
            <div className="space-y-2">
              <h1 className="text-xl font-bold text-slate-900">
                Une erreur est survenue
              </h1>
              <p className="text-sm text-slate-500">
                L'application a rencontré un problème inattendu. Veuillez rafraichir la page.
              </p>
            </div>
            {this.state.error && (
              <pre className="text-xs text-left bg-slate-50 p-4 rounded-xl border border-slate-100 overflow-auto max-h-32 text-slate-600">
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors"
            >
              <RefreshCw size={16} />
              Rafraichir la page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
