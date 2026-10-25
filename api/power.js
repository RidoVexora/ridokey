export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const url = process.env.PTERO_URL || 'https://alfa-store-officials.alfamarket2.my.id';
  const key = process.env.PTERO_CLIENT_KEY;
  let serverId = process.env.PTERO_SERVER_ID;
  const { signal } = req.body; // start, stop, restart, kill

  if (!key || !signal) return res.status(400).json({ ok: false, error: "Data tidak lengkap" });

  try {
    if (!serverId) {
      const srvRes = await fetch(`${url}/api/client`, { headers: { Authorization: `Bearer ${key}`, Accept: 'application/json' } });
      const srvData = await srvRes.json();
      serverId = srvData.data[0].attributes.identifier;
    }

    const r = await fetch(`${url}/api/client/servers/${serverId}/power`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ signal })
    });

    if (!r.ok) {
      const d = await r.json();
      return res.status(400).json({ ok: false, error: d.errors?.[0]?.detail || "Gagal kirim perintah" });
    }
    res.status(200).json({ ok: true, message: `Server di-${signal}` });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
}