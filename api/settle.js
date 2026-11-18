const { rpc, wrap, requireUser, intOf, CFG } = require('../lib/db');
module.exports = wrap(async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Metode tidak didukung' });
  const u = await requireUser(req, res); if (!u) return;
  const id = intOf(req.body && req.body.id), payout = intOf(req.body && req.body.payout);
  if (id === null || payout === null) return res.status(400).json({ error: 'Data tidak valid' });
  const balance = await rpc('settle_bet', { p_id: id, p_user: u.username, p_payout: payout, p_maxmult: CFG.maxMult });
  res.json({ balance });
});
