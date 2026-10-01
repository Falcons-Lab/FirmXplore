import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getConfig, saveConfig } from '@/api/client'

export function useConfig() {
  return useQuery({ queryKey: ['config'], queryFn: getConfig })
}

export function useSaveConfig() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: saveConfig,
    onSuccess: (data) => queryClient.setQueryData(['config'], data),
  })
}
