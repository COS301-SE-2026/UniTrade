/*const BASE_URL = import.meta.env.VITE_API_URL

export interface RegisterPayload {
  FirstName: string
  LastName: string
  Email: string
  university: string
  degreeProgram: string
  Password: string
  YearOfStudy: number
}

export interface LoginPayload {
  Email: string
  Password: string
}

export interface MeResponse {
  userId: string
  firstName: string
  lastName: string
  email: string
  university: string
  role: 'buyer' | 'seller' | 'admin'
}

export const authService = {
  register: async (payload: RegisterPayload): Promise<void> => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error ?? 'server_error')
    }
  },

  verifyOtp: async (email: string, otp: string): Promise<void> => {
    const res = await fetch(`${BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // needed for the cookie
      body: JSON.stringify({ email, otp }),
    })
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error ?? 'server_error')
    }
  },

  resendOtp: async (email: string): Promise<void> => {
    const res = await fetch(`${BASE_URL}/auth/resend-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error ?? 'server_error')
    }
  },

  login: async (payload: LoginPayload): Promise<void> => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // needed so the cookie is saved
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error ?? 'server_error')
    }
  },

  getMe: async (): Promise<MeResponse> => {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      credentials: 'include', // sends the cookie automatically
    })
    if (!res.ok) {
      throw new Error('unauthenticated')
    }
    return res.json()
  },

  logout: async (): Promise<void> => {
    await fetch(`${BASE_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    })
  },
}*/

const BASE_URL = import.meta.env.VITE_API_URL

export interface RegisterPayload {
  firstName: string
  lastName: string
  email: string
  university: string
  degreeProgram: string
  yearOfStudy: string  
  password: string
}

export interface LoginPayload {
  Email: string
  Password: string
}

export interface MeResponse {
  userId: string
  firstName: string
  lastName: string
  email: string
  university: string
  role: 'student' | 'buyer' | 'seller' | 'admin'
  verificationStatus?: string
}

export const authService = {
  register: async (payload: RegisterPayload): Promise<void> => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error ?? 'server_error')
    }
  },

  verifyOtp: async (email: string, otp: string): Promise<void> => {
    const res = await fetch(`${BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, otp }),
    })
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error ?? 'server_error')
    }
  },

  resendOtp: async (email: string): Promise<void> => {
    const res = await fetch(`${BASE_URL}/auth/resend-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email }),
    })
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error ?? 'server_error')
    }
  },

  login: async (payload: LoginPayload): Promise<void> => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error ?? 'server_error')
    }
  },

  getMe: async (): Promise<MeResponse> => {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      credentials: 'include',
    })
    if (!res.ok) {
      throw new Error('unauthenticated')
    }
    return res.json()
  },

  logout: async (): Promise<void> => {
    await fetch(`${BASE_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    })
  },
}