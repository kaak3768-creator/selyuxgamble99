const { sb, wrap, crypto } = require('../lib/db');
const USER_RE = /^(?:\.[A-Za-z0-9_]{3,16}|[A-Za-z0-9_]{3,16})$/;
function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}
module.exports = wrap(async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Metode tidak didukung' });
  const username = String((req.body && req.body.username) || '').trim();
  const password = String((req.body && req.body.password) || '');
  if (!USER_RE.test(username)) return res.status(400).json({ error: 'Username Minecraft tidak valid' });
  if (password.length < 8 || password.length > 72) return res.status(400).json({ error: 'Password wajib 8–72 karakter' });
  const lname = username.toLowerCase();
  let { data: user, error } = await sb.from('users').select('username,password_hash,banned').eq('lname', lname).maybeSingle();
  if (error) throw new Error(error.message);
  if (user && user.banned) return res.status(403).json({ error: 'Akun diblokir' });
  if (!user) {
    const salt = crypto.randomBytes(16).toString('hex');
    const password_hash = salt + ':' + hashPassword(password, salt);
    const created = await sb.from('users').insert({ username, password_hash }).select('username,password_hash,banned').single();
    if (created.error) {
      if (created.error.code === '23505') return res.status(409).json({ error: 'Akun sedang dibuat. Coba masuk lagi.' });
      throw new Error(created.error.message);
    }
    user = created.data;
  } else if (!user.password_hash) {
    // Akun lama yang sebelumnya dibuat lewat sistem /pay: password dibuat saat login pertama.
    const salt = crypto.randomBytes(16).toString('hex');
    const password_hash = salt + ':' + hashPassword(password, salt);
    const updated = await sb.from('users').update({ password_hash }).eq('username', user.username).is('password_hash', null).select('username,password_hash').maybeSingle();
    if (updated.error) throw new Error(updated.error.message);
    if (!updated.data) return res.status(409).json({ error: 'Password akun sedang disiapkan. Coba masuk lagi.' });
    user = { ...user, ...updated.data };
  } else {
    const [salt, stored] = String(user.password_hash).split(':');
    const actual = Buffer.from(hashPassword(password, salt || ''), 'hex');
    const expected = Buffer.from(stored || '', 'hex');
    if (!salt || actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) {
      return res.status(401).json({ error: 'Username atau password salah' });
    }
  }
  const token = crypto.randomBytes(32).toString('hex');
  const session = await sb.from('sessions').insert({ token, username: user.username });
  if (session.error) throw new Error(session.error.message);
  res.json({ token, username: user.username });
});
