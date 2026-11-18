const { sb, wrap } = require('../lib/db');
module.exports = wrap(async (req, res) => {
  const id = Number(req.query.id), secret = String(req.query.secret || '');
  if (!Number.isInteger(id) || !secret) return res.status(400).json({ error: 'Permintaan tidak valid' });
  const { data: c } = await sb.from('login_challenges')
    .select('status,token,username,expires_at').eq('id', id).eq('secret', secret).maybeSingle();
  if (!c) return res.status(404).json({ error: 'Tidak ditemukan' });
  if (c.status === 'done') return res.json({ status: 'done', token: c.token, username: c.username });
  if (new Date(c.expires_at) < new Date()) return res.json({ status: 'expired' });
  res.json({ status: 'pending' });
});
