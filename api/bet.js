const { rpc, wrap, requireUser, intOf } = require('../lib/db');
module.exports = wrap(async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Metode tidak didukung' });
  const u = await requireUser(req, res); if (!u) return;
  const amount = intOf(req.body && req.body.amount, 1e13);
  const game = String((req.body && req.body.game) || '').slice(0, 30);
  if (!amount || amount < 1 || !game) return res.status(400).json({ error: 'Taruhan tidak valid' });
  res.json(await rpc('place_bet', { p_user: u.username, p_game: game, p_amount: amount }));
});
