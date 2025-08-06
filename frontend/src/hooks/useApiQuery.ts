import { useQuery, useMutation, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import api from '@services/api'
import { ApiError } from '@types'

// Generic API response type
type ApiResponse<T> = T

// Query hook for GET requests
export function useApiQuery<T>(
  key: string | string[],
  url: string,
  params?: Record<string, any>,
  options?: Omit<UseQueryOptions<ApiResponse<T>, AxiosError<ApiError>>, 'queryKey' | 'queryFn'>
) {
  return useQuery<ApiResponse<T>, AxiosError<ApiError>>({
    queryKey: Array.isArray(key) ? key : [key],
    queryFn: async () => {
      const { data } = await api.get<T>(url, { params })
      return data
    },
    ...options,
  })
}

// Mutation hook for POST requests
export function useApiMutation<TData, TVariables = void>(
  url: string,
  options?: UseMutationOptions<ApiResponse<TData>, AxiosError<ApiError>, TVariables>
) {
  return useMutation<ApiResponse<TData>, AxiosError<ApiError>, TVariables>({
    mutationFn: async (variables) => {
      const { data } = await api.post<TData>(url, variables)
      return data
    },
    ...options,
  })
}

// Mutation hook for PUT requests
export function useApiUpdate<TData, TVariables = void>(
  url: string,
  options?: UseMutationOptions<ApiResponse<TData>, AxiosError<ApiError>, TVariables>
) {
  return useMutation<ApiResponse<TData>, AxiosError<ApiError>, TVariables>({
    mutationFn: async (variables) => {
      const { data } = await api.put<TData>(url, variables)
      return data
    },
    ...options,
  })
}

// Mutation hook for DELETE requests
export function useApiDelete<TData = void>(
  url: string,
  options?: UseMutationOptions<ApiResponse<TData>, AxiosError<ApiError>, void>
) {
  return useMutation<ApiResponse<TData>, AxiosError<ApiError>, void>({
    mutationFn: async () => {
      const { data } = await api.delete<TData>(url)
      return data
    },
    ...options,
  })
}