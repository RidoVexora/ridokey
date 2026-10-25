export default async function handler(req, res) {
  const url = process.env.PTERO_URL || 'https://alfa-store-officials.alfamarket2.my.id';
  const key = process.env.PTERO_CLIENT_KEY;
  let serverId = process.env.PTERO_SERVER_ID;

  if (!key) return res.status(500).json({ ok: false, error: "PTERO_CLIENT_KEY belum diisi di Vercel!" });

  try {
    if (!serverId) {
      const srvRes = await fetch(`${url}/api/client`, { headers: { Authorization: `Bearer ${key}`, Accept: 'application/json' } });
      const srvData = await srvRes.json();
      if (!srvData.data || srvData.data.length === 0) {
        return res.status(404).json({ ok: false, error: "Tidak ada server atau API Key salah." });
      }
      serverId = srvData.data[0].attributes.identifier;
    }

    const [infoRes, resRes] = await Promise.all([
      fetch(`${url}/api/client/servers/${serverId}`, { headers: { Authorization: `Bearer ${key}`, Accept: 'application/json' } }),
      fetch(`${url}/api/client/servers/${serverId}/resources`, { headers: { Authorization: `Bearer ${key}`, Accept: 'application/json' } })
    ]);
    
    const info = await infoRes.json();
    const resources = await resRes.json();

    if (info.errors || resources.errors) {
      return res.status(401).json({ ok: false, error: "API KEY DITOLAK PANEL", detail: info.errors || resources.errors });
    }

    res.status(200).json({
      ok: true,
      server: {
        id: serverId,
        name: info.attributes.name,
        state: resources.attributes.current_state,
        resources: resources.attributes.resources
      }
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: "Gagal konek ke panel", detail: err.message });
  }
}