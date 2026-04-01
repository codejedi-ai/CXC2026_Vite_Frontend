const BASE_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:8000/api';

function getToken(key: 'access_token' | 'refresh_token') {
  return localStorage.getItem(key);
}

async function request(path: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken('access_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    const refresh = getToken('refresh_token');
    if (refresh) {
      const refreshRes = await fetch(`${BASE_URL}/auth/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh }),
      });
      if (refreshRes.ok) {
        const { access } = await refreshRes.json();
        localStorage.setItem('access_token', access);
        headers['Authorization'] = `Bearer ${access}`;
        res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
      } else {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      }
    }
  }

  return res;
}

export const api = {
  async register(email: string, password: string) {
    const res = await fetch(`${BASE_URL}/auth/register/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    return { ok: res.ok, data };
  },

  async login(email: string, password: string) {
    const res = await fetch(`${BASE_URL}/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    return { ok: res.ok, data };
  },

  async me() {
    const res = await request('/auth/me/');
    if (!res.ok) return null;
    return res.json();
  },

  async getProfiles() {
    const res = await request('/profiles/');
    if (!res.ok) return [];
    return res.json();
  },

  async getProfile(id: string | number) {
    const res = await request(`/profiles/${id}/`);
    if (!res.ok) return null;
    return res.json();
  },

  async getMyProfile() {
    const res = await request('/profiles/me/');
    if (!res.ok) return null;
    return res.json();
  },

  async saveMyProfile(data: Record<string, unknown>) {
    const res = await request('/profiles/me/', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) return { data: null, error: Object.values(json).flat().join(' ') };
    return { data: json, error: null };
  },
};
