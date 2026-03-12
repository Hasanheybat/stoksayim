const router = require('express').Router();
const { supabaseAdmin } = require('../lib/supabase');
const authGuard = require('../middleware/authGuard');

// POST /api/auth/me — Oturum bilgisi
router.get('/me', authGuard, (req, res) => {
  res.json({ kullanici: req.user });
});

module.exports = router;
