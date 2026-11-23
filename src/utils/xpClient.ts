import { ServerXPProfile } from '../types';

const DEVICE_KEY_STORAGE = 'pkxd_central_device_key_v1';

export function getPersistentUserKey(user?: { uid?: string } | null): string {
  if (user?.uid && user.uid !== 'guest_user') {
    return `uid_${user.uid}`;
  }
  try {
    let existing = localStorage.getItem(DEVICE_KEY_STORAGE);
    if (!existing) {
      existing = `dev_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(DEVICE_KEY_STORAGE, existing);
    }
    return existing;
  } catch {
    return 'dev_local_session';
  }
}

export async function fetchServerXPProfile(userKey: string): Promise<ServerXPProfile | null> {
  try {
    const res = await fetch(`/api/xp/${encodeURIComponent(userKey)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data?.profile || null;
  } catch {
    return null;
  }
}

export async function awardServerXP(params: {
  userKey: string;
  amount: number;
  reason: string;
  rewardKey?: string;
  displayName?: string;
  playerTag?: string;
}): Promise<{
  awarded: boolean;
  alreadyClaimed: boolean;
  awardedAmount?: number;
  profile?: ServerXPProfile;
  error?: string;
}> {
  try {
    const res = await fetch('/api/xp/award', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok) {
      return { awarded: false, alreadyClaimed: false, error: data?.error || 'Erro ao creditar XP' };
    }
    return {
      awarded: Boolean(data.awarded),
      alreadyClaimed: Boolean(data.alreadyClaimed),
      awardedAmount: data.awardedAmount,
      profile: data.profile,
    };
  } catch (err: any) {
    return { awarded: false, alreadyClaimed: false, error: err?.message || 'Falha de rede' };
  }
}

export async function saveServerIdentity(params: {
  userKey: string;
  pkxdName: string;
  pkxdNumber: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
}): Promise<{
  success: boolean;
  playerTag?: string;
  xpAwarded?: number;
  profile?: ServerXPProfile;
  error?: string;
}> {
  try {
    const res = await fetch('/api/identity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data?.error || 'Erro ao salvar identidade' };
    }
    return {
      success: true,
      playerTag: data.playerTag,
      xpAwarded: Number(data.xpAwarded || 0),
      profile: data.profile,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Falha de rede' };
  }
}
