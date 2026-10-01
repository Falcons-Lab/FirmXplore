import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { deleteTask, getTask, listTasks } from '@/api/client'

export function useTasks(status?: string) {
  return useQuery({
    queryKey: ['tasks', status ?? 'all'],
    queryFn: () => listTasks(status),
    // 任务列表轮询刷新：pending/running 时常变化，终态也保留低频轮询以同步其他端的变化
    refetchInterval: 5000,
  })
}

export function useTask(id: string, active: boolean) {
  return useQuery({
    queryKey: ['task', id],
    queryFn: () => getTask(id),
    enabled: active,
    refetchInterval: (query) => {
      const status = query.state.data?.status
      return status === 'pending' || status === 'running' ? 5000 : false
    },
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteTask,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  })
}
