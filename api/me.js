const { sb, wrap, requireUser, CFG } = require('../lib/db');
module.exports = wrap(async (req, res) => {
  const u = await requireUser(req, res); if (!u) return;
  const { data: w } = await sb.from('withdrawals').select('id,amount,status')
    .eq('username', u.username).order('id', { ascending: false }).limit(1).maybeSingle();
  res.json({ username: u.username, balance: u.balance, bot: CFG.bot, min_wd: CFG.minWd, wd: w || null });
});
