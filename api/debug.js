export default async function handler(req, res) {
  const url = process.env.PTERO_URL || 'https://alfa-store-officials.alfamarket2.my.id';
  const key = process.env.PTERO_CLIENT_KEY;
  
  const report = { 
    url_panel: url, 
    key_terisi: !!key, 
    awalan_key: key ? key.substring(0, 5) + '...' : 'KOSONG',
  };

  try {
    const r = await fetch(`${url}/api/client`, { headers: { Authorization: `Bearer ${key}`, Accept: 'application/json' } });
    const data = await r.json();
    report.http_status = r.status;
    report.respons_panel = data;
    if (r.ok) report.KESIMPULAN = "✅ SUKSES! API KEY VALID DAN BISA KONEK KE PANEL.";
    else report.KESIMPULAN = "❌ GAGAL! Panel menolak key kamu. Cek Allowed IPs di panel (harus kosong).";
  } catch (e) {
    report.KESIMPULAN = "❌ GAGAL TOTAL! Vercel tidak bisa menghubungi panel. Mungkin blokir firewall.";
    report.error = e.message;
  }

  res.status(200).json(report);
}