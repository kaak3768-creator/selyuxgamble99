const { sb, wrap, crypto, CFG } = require('../lib/db');
module.exports = wrap(async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Metode tidak didukung' });
  const u = String((req.body && req.body.username) || '').trim();
  if (!/^(?:\.[A-Za-z0-9_]{3,16}|[A-Za-z0-9_]{3,16})$/.test(u)) return res.status(400).json({ error: 'Username Minecraft tidak valid' });
  const l = u.toLowerCase();
  const { data: ex } = await sb.from('users').select('banned').eq('lname', l).maybeSingle();
  if (ex && ex.banned) return res.status(403).json({ error: 'Akun diblokir' });
  await sb.from('login_challenges').delete().eq('lname', l).eq('status', 'pending');
  const amount = 100 + crypto.randomInt(900); // 100..999 (di bawah $1k)
  const secret = crypto.randomBytes(16).toString('hex');
  const { data, error } = await sb.from('login_challenges').insert({
    username: u, lname: l, amount, secret,
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString()
  }).select('id').single();
  if (error) throw new Error(error.message);
  res.json({ id: data.id, secret, amount, bot: CFG.bot });
});
