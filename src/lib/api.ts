import { supabase } from './supabase';

const FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_URL + '/functions/v1';

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Not authenticated');
  }

  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  };
}

export interface Profile {
  id: string;
  user_id: string;
  display_name: string;
  age: number;
  gender: string;
  bio: string;
  avatar_url: string;
  banner_url: string;
  location: string;
  looking_for: string;
  interests: string[];
  type: string;
  online_status: boolean;
  token?: string;
  created_at?: string;
}

export interface Session {
  id: string;
  user_id: string;
  agent_uuid: string;
  type: string;
  token: string;
  created_at: string;
}

export const profileApi = {
  async getProfile(userId?: string): Promise<Profile | null> {
    const headers = await getAuthHeaders();
    const url = userId
      ? `${FUNCTIONS_URL}/profile?user_id=${userId}`
      : `${FUNCTIONS_URL}/profile`;

    const response = await fetch(url, { headers });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to fetch profile');
    }

    return result.data;
  },

  async saveProfile(profileData: Partial<Profile>): Promise<Profile> {
    const headers = await getAuthHeaders();

    const response = await fetch(`${FUNCTIONS_URL}/profile`, {
      method: 'POST',
      headers,
      body: JSON.stringify(profileData),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to save profile');
    }

    return result.data;
  },
};

export const discoverApi = {
  async getProfiles(type?: string): Promise<Profile[]> {
    const headers = await getAuthHeaders();
    const url = type
      ? `${FUNCTIONS_URL}/discover?type=${type}`
      : `${FUNCTIONS_URL}/discover`;

    const response = await fetch(url, { headers });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to fetch profiles');
    }

    return result.data || [];
  },

  async getProfileById(id: string): Promise<Profile | null> {
    const headers = await getAuthHeaders();
    const url = `${FUNCTIONS_URL}/discover?id=${id}`;

    const response = await fetch(url, { headers });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to fetch profile');
    }

    return result.data;
  },
};

export const sessionApi = {
  async getSessions(): Promise<Session[]> {
    const headers = await getAuthHeaders();

    const response = await fetch(`${FUNCTIONS_URL}/sessions`, { headers });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to fetch sessions');
    }

    return result.data || [];
  },

  async getSession(id: string): Promise<Session | null> {
    const headers = await getAuthHeaders();

    const response = await fetch(`${FUNCTIONS_URL}/sessions?id=${id}`, { headers });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to fetch session');
    }

    return result.data;
  },

  async createSession(sessionData: Partial<Session>): Promise<Session> {
    const headers = await getAuthHeaders();

    const response = await fetch(`${FUNCTIONS_URL}/sessions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(sessionData),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to create session');
    }

    return result.data;
  },

  async updateSession(id: string, updates: Partial<Session>): Promise<Session> {
    const headers = await getAuthHeaders();

    const response = await fetch(`${FUNCTIONS_URL}/sessions?id=${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(updates),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to update session');
    }

    return result.data;
  },

  async deleteSession(id: string): Promise<void> {
    const headers = await getAuthHeaders();

    const response = await fetch(`${FUNCTIONS_URL}/sessions?id=${id}`, {
      method: 'DELETE',
      headers,
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to delete session');
    }
  },
};
