import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App.tsx'
import { AppProvider } from '@/app/AppProvider'
import { ToastProvider } from '@/components/Toast'
import { ConfirmProvider } from '@/components/ConfirmDialog'
import { PromptProvider } from '@/components/PromptModal'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { OnlineBanner } from '@/components/OnlineBanner'
import './styles/global.css'
import './styles/components.css'

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
