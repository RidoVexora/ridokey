import { Client, Setup } from 'pterodactyl-api-wrapper';

// URL panel di-hardcode. Kalau env PTERO_URL diisi, env yang menang.
const PANEL = (
  process.env.PTERO_URL || 'https://alfa-store-officials.alfamarket2.my.id'
).replace(/\/+$/, '');

if (PANEL) Setup.setPanel(PANEL);

export const CLIENT_KEY = process.env.PTERO_CLIENT_KEY || '';
export const SERVER_ID = process.env.PTERO_SERVER_ID || '';

export function getClient() {
  if (!CLIENT_KEY) {
    throw new Error('PTERO_CLIENT_KEY belum diset di Vercel.');
  }
  return new Client(CLIENT_KEY);
}

export async function panelFetch(path, options = {}) {
  if (!CLIENT_KEY) {
    throw new Error('PTERO_CLIENT_KEY belum diset.');
  }

  const url = `${PANEL}/api/client${path}`;
  const r = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${CLIENT_KEY}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  const text = await r.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!r.ok) {
    const msg =
      data?.errors?.[0]?.detail ||
      data?.error ||
      `Pterodactyl error ${r.status}`;
    const err = new Error(msg);
    err.status = r.status;
    err.data = data;
    throw err;
  }
  return data;
}

export async function resolveServerId() {
  if (SERVER_ID) return SERVER_ID;

  const client = getClient();
  const res = await client.servers.list();

  const arr = Array.isArray(res)
    ? res
    : (res?.data || res?.servers || res?.items || []);

  const first = arr[0];
  const id =
    first?.attributes?.identifier ||
    first?.identifier ||
    first?.attributes?.id ||
    first?.id;

  if (!id) {
    throw new Error(
      'Tidak ada server yang bisa diakses Client Key. Set PTERO_SERVER_ID manual.'
    );
  }
  return id;
}

export function normalizeList(raw) {
  if (Array.isArray(raw)) return raw;
  return raw?.data || raw?.items || raw?.apiKeys || raw?.keys || [];
}

export function normalizeKey(item) {
  const a = item?.attributes || item || {};
  return {
    id: a.identifier || a.id || item?.id || '',
    description: a.description || '(tanpa deskripsi)',
    allowedIps: a.allowed_ips || a.allowedIps || [],
    createdAt: a.created_at || a.createdAt || null,
    lastUsedAt: a.last_used_at || a.lastUsedAt || null
  };
}