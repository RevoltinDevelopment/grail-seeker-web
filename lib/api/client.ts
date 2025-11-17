import { createClient } from '@/lib/supabase/client'

// Dynamically determine API URL based on current hostname
// This allows mobile devices to connect to the backend server
function getAPIBaseURL(): string {
  // Server-side: use environment variable or default
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
  }

  // Client-side: detect hostname and use same IP with port 3000
  const hostname = window.location.hostname

  // If localhost, use localhost:3000
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3000'
  }

  // Otherwise, use same IP as frontend but port 3000 (for mobile/network access)
  return `http://${hostname}:3000`
}

class APIError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message)
    this.name = 'APIError'
  }
}

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  // Get API URL dynamically for each request (handles SSR + client-side)
  const apiBaseURL = getAPIBaseURL()
  const url = `${apiBaseURL}${endpoint}`

  // Get auth token from Supabase
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      ...options?.headers,
    },
  })

  if (!response.ok) {
    let errorData
    try {
      errorData = await response.json()
    } catch {
      throw new APIError(
        response.status,
        'UNKNOWN_ERROR',
        `HTTP ${response.status}: ${response.statusText}`
      )
    }

    throw new APIError(
      response.status,
      errorData.error?.code || 'API_ERROR',
      errorData.error?.message || 'An error occurred',
      errorData.error?.details
    )
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T
  }

  return response.json()
}

export const apiClient = {
  get: <T>(endpoint: string, options?: RequestInit) =>
    fetchAPI<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, data?: unknown, options?: RequestInit) =>
    fetchAPI<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  patch: <T>(endpoint: string, data?: unknown, options?: RequestInit) =>
    fetchAPI<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T>(endpoint: string, options?: RequestInit) =>
    fetchAPI<T>(endpoint, { ...options, method: 'DELETE' }),
}

export { APIError }
