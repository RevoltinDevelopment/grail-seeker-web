import { createClient } from '@/lib/supabase/client'

// Dynamically determine API URL based on current hostname
// This allows mobile devices to connect to the backend server
function getAPIBaseURL(): string {
  // Server-side: use environment variable or default
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
  }

  // Client-side: If we have an environment variable, use it (production/staging)
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL
  }

  // Client-side development: detect hostname and use same IP with port 3000
  const hostname = window.location.hostname

  // If localhost, use localhost:3000
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3000'
  }

  // Otherwise, use same IP as frontend but port 3000 (for mobile/network access on local network)
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

  // Get auth token from Supabase with a timeout guard.
  // Without this, a stale session attempting a token refresh can hang indefinitely
  // (e.g. iCloud Private Relay slowing the Supabase auth endpoint), leaving React
  // Query permanently in isLoading:true and the dashboard spinner never resolving.
  const supabase = createClient()
  let session = null
  try {
    const result = await Promise.race([
      supabase.auth.getSession(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Session timeout')), 8000)
      ),
    ])
    session = result.data.session
  } catch {
    // Session fetch failed or timed out — clear local state and redirect to login
    // so the user can establish a fresh session rather than seeing an infinite spinner.
    await supabase.auth.signOut({ scope: 'local' })
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
    throw new APIError(401, 'SESSION_UNAVAILABLE', 'Your session expired. Please log in again.')
  }

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
