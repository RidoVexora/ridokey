import { getClient, normalizeList, normalizeKey } from '../_lib.js';

export default async function handler(req, res) {
  try {
    const client = getClient();

    if (req.method === 'GET') {
      const raw = await client.account.listApiKeys();
      const list = normalizeList(raw).map(normalizeKey);
      return res.status(200).json({ ok: true, keys: list });
    }

    if (req.method === 'POST') {
      const description =
        String(req.body?.description || '').trim() || 'ridokey';

      let allowedIps = req.body?.allowedIps;
      if (typeof allowedIps === 'string') {
        allowedIps = allowedIps.split(',').map(s => s.trim()).filter(Boolean);
      }
      if (!Array.isArray(allowedIps)) allowedIps = [];

      const created = await client.account.createApiKey(description, allowedIps);

      const secret =
        created?.meta?.secret_token ||
        created?.attributes?.key ||
        created?.secret_token ||
        created?.key ||
        created?.token ||
        null;

      return res.status(201).json({
        ok: true,
        key: normalizeKey(created?.data || created),
        secret,
        note: secret
          ? 'Simpan key ini sekarang. Panel hanya menampilkannya sekali.'
          : 'Key dibuat, tapi panel tidak mengembalikan secret token.'
      });
    }

    return res.status(405).json({ ok: false, error: 'Method tidak didukung.' });
  } catch (e) {
    return res.status(e.status || 500).json({ ok: false, error: e.message });
  }
}