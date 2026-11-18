const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false }
});
const CFG = {
  bot: process.env.BOT_NAME || 'NAMA_BOT',
  minWd: Number(process.env.MIN_WD || 1000),
  maxMult: Number(process.env.MAX_MULT || 1000)
};
const MSG = {
  SALDO_TIDAK_CUKUP: 'Saldo tidak cukup',
  USER_TIDAK_ADA: 'Pengguna tidak ditemukan',
  BET_TIDAK_ADA: 'Taruhan tidak ditemukan',
  SUDAH_DISELESAIKAN: 'Taruhan sudah diselesaikan',
  PAYOUT_TIDAK_VALID: 'Hasil tidak valid',
  SUDAH_PUTAR: 'Kamu sudah memutar dalam 24 jam terakhir',
  AKUN_DIBLOKIR: 'Akun diblokir',
  MIN_WD: 'Jumlah tarik di bawah minimum',
  WD_MASIH_DIPROSES: 'Masih ada penarikan yang sedang diproses'
};
function human(m) {
  m = String(m || '');
  if (m.startsWith('WAGER_KURANG:')) {
    return 'Kamu harus bermain (wager) dulu sebesar ' + Number(m.split(':')[1]).toLocaleString('id-ID') + ' lagi sebelum bisa menarik';
  }
  return MSG[m] || m || 'Terjadi kesalahan, coba lagi';
}
async function rpc(fn, args) {
  const { data, error } = await sb.rpc(fn, args);
  if (error) throw new Error(error.message);
  return data;
}
function wrap(fn) {
  return async (req, res) => {
    try { await fn(req, res); }
    catch (e) { console.error(e); res.status(400).json({ error: human(e.message) }); }
  };
}
async function requireUser(req, res) {
  const t = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (t) {
    const { data: s } = await sb.from('sessions').select('username').eq('token', t).maybeSingle();
    if (s) {
      const { data: u } = await sb.from('users').select('*').eq('username', s.username).maybeSingle();
      if (u && !u.banned) return u;
    }
  }
  res.status(401).json({ error: 'Silakan masuk dulu' });
  return null;
}
function intOf(v, max) {
  const n = Math.floor(Number(v));
  return Number.isSafeInteger(n) && n >= 0 && n <= (max || 1e15) ? n : null;
}
module.exports = { sb, rpc, wrap, requireUser, intOf, crypto, CFG };
