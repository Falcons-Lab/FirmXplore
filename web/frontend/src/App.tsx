import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Layout from '@/components/Layout'
import TasksPage from '@/pages/TasksPage'
import NewAnalysisPage from '@/pages/NewAnalysisPage'
import TaskDetailPage from '@/pages/TaskDetailPage'
import SettingsPage from '@/pages/SettingsPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 3000,
      refetchOnWindowFocus: false,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<TasksPage />} />
            <Route path="new" element={<NewAnalysisPage />} />
            <Route path="tasks/:id" element={<TaskDetailPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<TasksPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
