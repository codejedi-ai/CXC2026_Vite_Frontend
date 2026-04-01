const BASE_URL = (import.meta.env.VITE_API_URL as string) || '/api';
// WebSocket always connects to the same host — Vite proxies /ws → Django in dev,
// and in production the same host serves both HTTP and WS.
const WS_BASE = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}`;

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

/**
 * Open a relay WebSocket to the Django backend for a chat session with an AI profile.
 *
 * Messages flow:  Frontend → Django → AI Agent → Django → Frontend
 *
 * @param profileId  The Profile.id of the AI being chatted with
 * @param onMessage  Called with every parsed JSON message from the agent
 * @param onClose    Called when the socket closes (optional)
 * @returns The WebSocket instance — call .send(JSON.stringify({...})) to talk to the agent
 */
export function createChatSocket(
  profileId: string | number,
  onMessage: (data: Record<string, unknown>) => void,
  onClose?: () => void,
): WebSocket {
  const token = getToken('access_token') ?? '';
  const ws = new WebSocket(`${WS_BASE}/ws/chat/${profileId}/?token=${token}`);

  ws.onmessage = (event) => {
    try {
      onMessage(JSON.parse(event.data as string));
    } catch {
      onMessage({ type: 'raw', message: event.data });
    }
  };

  if (onClose) ws.onclose = onClose;

  return ws;
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

  async getMyAvatars() {
    const res = await request('/profiles/me/avatar/');
    if (!res.ok) return [];
    return res.json() as Promise<{ id: number; url: string; active: boolean }[]>;
  },

  async uploadAvatar(file: File) {
    const token = getToken('access_token');
    const body = new FormData();
    body.append('avatar', file);
    const res = await fetch(`${BASE_URL}/profiles/me/avatar/`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body,
    });
    const json = await res.json();
    if (!res.ok) return { data: null, error: (json.detail as string) ?? 'Upload failed' };
    return { data: json as { id: number; url: string; active: boolean }[], error: null };
  },

  async activateAvatar(id: number) {
    const res = await request(`/profiles/me/avatar/${id}/`, { method: 'POST' });
    if (!res.ok) return null;
    return res.json() as Promise<{ id: number; url: string; active: boolean }[]>;
  },

  async deleteAvatar(id: number) {
    const res = await request(`/profiles/me/avatar/${id}/`, { method: 'DELETE' });
    if (!res.ok) return null;
    return res.json() as Promise<{ id: number; url: string; active: boolean }[]>;
  },

  async getMyBanners() {
    const res = await request('/profiles/me/banner/');
    if (!res.ok) return [];
    return res.json() as Promise<{ id: number; url: string; active: boolean }[]>;
  },

  async uploadBanner(file: File) {
    const token = getToken('access_token');
    const body = new FormData();
    body.append('banner', file);
    const res = await fetch(`${BASE_URL}/profiles/me/banner/`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body,
    });
    const json = await res.json();
    if (!res.ok) return { data: null, error: (json.detail as string) ?? 'Upload failed' };
    return { data: json as { id: number; url: string; active: boolean }[], error: null };
  },

  async activateBanner(id: number) {
    const res = await request(`/profiles/me/banner/${id}/`, { method: 'POST' });
    if (!res.ok) return null;
    return res.json() as Promise<{ id: number; url: string; active: boolean }[]>;
  },

  async deleteBanner(id: number) {
    const res = await request(`/profiles/me/banner/${id}/`, { method: 'DELETE' });
    if (!res.ok) return null;
    return res.json() as Promise<{ id: number; url: string; active: boolean }[]>;
  },

  async getMyPersonalImages() {
    const res = await request('/profiles/me/images/');
    if (!res.ok) return [];
    return res.json() as Promise<{ id: number; url: string }[]>;
  },

  async uploadPersonalImage(file: File) {
    const token = getToken('access_token');
    const body = new FormData();
    body.append('image', file);
    const res = await fetch(`${BASE_URL}/profiles/me/images/`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body,
    });
    const json = await res.json();
    if (!res.ok) return { data: null, error: (json.detail as string) ?? 'Upload failed' };
    return { data: json as { id: number; url: string }, error: null };
  },

  async deletePersonalImage(id: number) {
    const res = await request(`/profiles/me/images/${id}/`, { method: 'DELETE' });
    return res.ok;
  },
};
