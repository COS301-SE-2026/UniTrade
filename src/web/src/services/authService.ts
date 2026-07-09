import { getApiUrl } from "../config";

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
  user: {
    userId: string
    firstName: string
    lastName: string
    email: string
    userRole: 'student' | 'admin'
    university?: string
  }
  std: {
    verificationStatus: string
  }
}

export interface University { //defines the exact shape of the university data coming back for backend
  universityId: string;
  name: string;
  emailDomain: string;
}

export const authService = {
  register: async (payload: RegisterPayload): Promise<void> => {
    const res = await fetch(`${getApiUrl()}/auth/register`, {
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
    const res = await fetch(`${getApiUrl()}/auth/verify-otp`, {
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
    const res = await fetch(`${getApiUrl()}/auth/resend-otp`, {
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
    const res = await fetch(`${getApiUrl()}/auth/login`, {
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
    const res = await fetch(`${getApiUrl()}/auth/me`, {
      credentials: 'include',
    })
    if (!res.ok) {
      throw new Error('unauthenticated')
    }
    return res.json()
  },

  logout: async (): Promise<void> => {
    await fetch(`${getApiUrl()}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    })
  },

  getUniversities: async(): Promise<University[]> => {
    
    const res = await fetch(`${getApiUrl()}/universities`, {
      method: 'GET',
      //headers: { 'Content-Type': 'application/json'},
      credentials: 'include'
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to load Universities');
    }
    const json = await res.json();
    return json.data || [];
  },
}