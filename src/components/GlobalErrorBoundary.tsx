import { ErrorBoundary as ReactErrorBoundary, FallbackProps } from 'react-error-boundary';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full border border-destructive/50 bg-destructive/10 rounded-xl p-6 shadow-lg shadow-destructive/20 text-center space-y-4">
        <div className="mx-auto w-12 h-12 bg-destructive/20 rounded-full flex items-center justify-center text-destructive mb-4">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold tracking-tight">System Crash Detected</h2>
        <p className="text-sm text-muted-foreground whitespace-pre-wrap text-left bg-black/50 p-3 rounded-md font-mono border border-white/5">
          {error.message || 'An unexpected rendering error occurred.'}
        </p>
        <p className="text-sm text-muted-foreground">
          The dashboard encountered a fatal rendering error. Please try reloading the system.
        </p>
        <Button onClick={resetErrorBoundary} variant="destructive" className="w-full mt-4 flex gap-2">
          <RefreshCcw className="h-4 w-4" /> Restart application
        </Button>
      </div>
    </div>
  );
}

export function GlobalErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ReactErrorBoundary FallbackComponent={ErrorFallback} onReset={() => window.location.replace('/')}>
      {children}
    </ReactErrorBoundary>
  );
}
