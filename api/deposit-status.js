const { sb, wrap, requireUser } = require('../lib/db');
module.exports = wrap(async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Metode tidak didukung' });
  const u = await requireUser(req, res); if (!u) return;
  const amount = Number(req.query.amount);
  const since = String(req.query.since || '');
  const date = new Date(since);
  if (!Number.isSafeInteger(amount) || amount < 1000000 || amount > 100000000 || !since || Number.isNaN(date.getTime()))
    return res.status(400).json({ error: 'Permintaan cek deposit tidak valid' });
  const { data, error } = await sb.from('deposits').select('id,amount,created_at')
    .eq('username', u.username).eq('amount', amount).eq('kind', 'deposit')
    .gte('created_at', date.toISOString()).order('id', { ascending: false }).limit(1).maybeSingle();
  if (error) throw new Error(error.message);
  res.json({ status: data ? 'done' : 'pending', deposit: data || null });
});
