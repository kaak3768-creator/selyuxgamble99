const { rpc, wrap, requireUser, crypto } = require('../lib/db');
// urutan sama dengan roda di tampilan: 1M, zonk, 5M, zonk, 100K, zonk, 500K
const PRIZE = [1e6, 0, 5e6, 0, 1e5, 0, 5e5];
const WEIGHT = [1.5, 28, 0.5, 28, 10, 28, 4]; // total 100 (persen)
module.exports = wrap(async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Metode tidak didukung' });
  const u = await requireUser(req, res); if (!u) return;
  const r = crypto.randomInt(0, 1000000) / 10000; // 0..99.9999
  let s = 0, idx = 1;
  for (let i = 0; i < WEIGHT.length; i++) { s += WEIGHT[i]; if (r < s) { idx = i; break; } }
  const balance = await rpc('claim_wheel', { p_user: u.username, p_prize: PRIZE[idx] });
  res.json({ index: idx, prize: PRIZE[idx], balance });
});
