import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class NotificationsErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Met à jour le state pour afficher l'interface de fallback lors de la prochaine mise à jour
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log l'erreur pour le debugging
    console.error('Notifications Error Boundary caught an error:', error);
    console.error('Error Info:', errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // Optionnel: Envoyer l'erreur à un service de monitoring
    // if (process.env.NODE_ENV === 'production') {
    //   // Send to error reporting service
    // }
  }

  handleReload = () => {
    // Reset l'état d'erreur et recharge le composant
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Card className="w-full max-w-2xl mx-auto">
          <CardContent className="p-8">
            <div className="text-center">
              <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-red-500" />
              <h2 className="text-xl font-semibold text-red-700 mb-2">
                Erreur dans les notifications
              </h2>
              <p className="text-muted-foreground mb-6">
                Une erreur inattendue s'est produite lors du chargement des notifications.
                Veuillez réessayer ou actualiser la page.
              </p>
              
              <div className="space-y-3">
                <Button
                  onClick={this.handleReload}
                  variant="outline"
                  className="mr-4"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Réessayer
                </Button>
                <Button
                  onClick={() => window.location.reload()}
                  variant="default"
                >
                  Actualiser la page
                </Button>
              </div>

              {/* Afficher les détails de l'erreur en mode développement */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-6 text-left">
                  <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                    Détails de l'erreur (développement)
                  </summary>
                  <div className="mt-2 p-4 bg-muted rounded-md text-xs font-mono overflow-auto">
                    <div className="text-red-600 font-semibold mb-2">
                      {this.state.error.name}: {this.state.error.message}
                    </div>
                    {this.state.error.stack && (
                      <pre className="whitespace-pre-wrap text-xs">
                        {this.state.error.stack}
                      </pre>
                    )}
                    {this.state.errorInfo && (
                      <div className="mt-4 border-t pt-2">
                        <div className="font-semibold text-orange-600 mb-2">
                          Component Stack:
                        </div>
                        <pre className="whitespace-pre-wrap text-xs">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

export default NotificationsErrorBoundary;