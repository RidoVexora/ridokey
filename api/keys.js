export default async function handler(req, res) {
  const url = process.env.PTERO_URL || 'https://alfa-store-officials.alfamarket2.my.id';
  const key = process.env.PTERO_CLIENT_KEY;

  if (!key) return res.status(500).json({ ok: false, error: "PTERO_CLIENT_KEY belum diisi!" });

  try {
    if (req.method === 'POST') {
      const r = await fetch(`${url}/api/client/account/api-keys`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: "ridokey", allowed_ips: [] })
      });
      const d = await r.json();
      if (!r.ok) return res.status(400).json({ ok: false, error: "Gagal buat key", detail: d });
      
      return res.status(201).json({ 
        ok: true, 
        secret: d.meta?.secret_token || d.attributes?.key
      });
    }
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
}