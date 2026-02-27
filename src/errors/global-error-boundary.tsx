import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[GlobalErrorBoundary] Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 p-6">
          <Card className="max-w-md w-full border-red-100 shadow-xl overflow-hidden">
            <div className="h-2 bg-red-500" />
            <CardContent className="pt-8 pb-8 text-center flex flex-col items-center">
              <div className="size-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
                <AlertTriangle className="size-10 text-red-500" />
              </div>
              
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Unexpected System Error</h1>
              <p className="text-muted-foreground mb-8 text-sm leading-relaxed px-4">
                We've encountered a critical error that prevented the page from loading correctly. Our technical team has been notified.
              </p>

              {process.env.NODE_ENV === 'development' && (
                <div className="w-full bg-gray-900 text-left p-4 rounded-lg mb-8 overflow-auto max-h-40">
                  <code className="text-[10px] text-green-400 font-mono block whitespace-pre">
                    {this.state.error?.stack}
                  </code>
                </div>
              )}

              <div className="flex flex-col w-full gap-3">
                <Button onClick={this.handleReset} className="w-full bg-gray-900 hover:bg-gray-800">
                  <RefreshCw className="size-4 mr-2" />
                  Try Again
                </Button>
                <Button onClick={this.handleGoHome} variant="outline" className="w-full">
                  <Home className="size-4 mr-2" />
                  Return to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
