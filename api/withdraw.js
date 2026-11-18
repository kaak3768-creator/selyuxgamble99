const { rpc, wrap, requireUser, intOf, CFG } = require('../lib/db');
module.exports = wrap(async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Metode tidak didukung' });
  const u = await requireUser(req, res); if (!u) return;
  const amount = intOf(req.body && req.body.amount, 1e13);
  if (!amount) return res.status(400).json({ error: 'Jumlah tidak valid' });
  if (amount < 100000) return res.status(400).json({ error: 'Minimal penarikan 100k' });
  if (amount > 100000000) return res.status(400).json({ error: 'Maksimal penarikan 100m' });
  res.json(await rpc('request_withdraw', { p_user: u.username, p_amount: amount, p_min: Math.max(CFG.minWd, 100000) }));
});
