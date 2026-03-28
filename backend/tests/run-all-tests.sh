#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# StokSay — Tüm Testleri Çalıştır
# ═══════════════════════════════════════════════════════════════
# Kullanım:
#   ./tests/run-all-tests.sh                    # Node.js backend (localhost:3001)
#   ./tests/run-all-tests.sh http://example.com # PHP veya farklı backend
# ═══════════════════════════════════════════════════════════════

BASE_URL="${1:-http://localhost:3001}"
DIR="$(cd "$(dirname "$0")" && pwd)"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  StokSay Test Runner"
echo "  Backend: $BASE_URL"
echo "  Tarih:   $(date)"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# 1. Backend API Testi
echo "▶ [1/2] Backend API Test Suite çalıştırılıyor..."
echo "─────────────────────────────────────────────────"
node "$DIR/api-test.js" "$BASE_URL"
API_EXIT=$?

echo ""

# 2. Mobil API Uyumluluk Testi
echo "▶ [2/2] Mobil API Uyumluluk Testi çalıştırılıyor..."
echo "─────────────────────────────────────────────────"
node "$DIR/mobile-api-test.js" "$BASE_URL"
MOBILE_EXIT=$?

echo ""
echo "═══════════════════════════════════════════════════════════════"
if [ $API_EXIT -eq 0 ] && [ $MOBILE_EXIT -eq 0 ]; then
  echo "  ✅ TÜM TESTLER BAŞARILI"
else
  echo "  ❌ BAZI TESTLER BAŞARISIZ"
  [ $API_EXIT -ne 0 ] && echo "     - Backend API testleri başarısız"
  [ $MOBILE_EXIT -ne 0 ] && echo "     - Mobil API testleri başarısız"
fi
echo "═══════════════════════════════════════════════════════════════"
echo ""

exit $(( API_EXIT + MOBILE_EXIT ))
