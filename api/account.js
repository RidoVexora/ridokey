import { getClient } from './_lib.js';

export default async function handler(req, res) {
  try {
    const client = getClient();
    const raw = await client.account.getDetails();
    const a = raw?.attributes || raw || {};

    return res.status(200).json({
      ok: true,
      account: {
        id: a.id || null,
        username: a.username || null,
        email: a.email || null,
        firstName: a.first_name || null,
        lastName: a.last_name || null
      }
    });
  } catch (e) {
    return res.status(e.status || 500).json({ ok: false, error: e.message });
  }
}