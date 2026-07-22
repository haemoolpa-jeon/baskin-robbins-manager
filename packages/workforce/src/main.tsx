import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App.tsx'
import { AppProvider } from '@shared/app/AppProvider'
import { ToastProvider } from '@shared/components/Toast'
import { ConfirmProvider } from '@shared/components/ConfirmDialog'
import { PromptProvider } from '@shared/components/PromptModal'
import { ErrorBoundary } from '@shared/components/ErrorBoundary'
import { OnlineBanner } from '@shared/components/OnlineBanner'
import '@shared/styles/global.css'
import '@shared/styles/components.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <ConfirmProvider>
            <PromptProvider>
              <AppProvider>
                <OnlineBanner />
                <App />
              </AppProvider>
            </PromptProvider>
          </ConfirmProvider>
        </ToastProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
)
