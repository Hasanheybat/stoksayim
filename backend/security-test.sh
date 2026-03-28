#!/bin/bash
#
# StokSay Backend API — Comprehensive Security Test Suite
# Requires: curl, jq
# Target: http://localhost:3001/api
#

BASE="http://localhost:3001/api"
ADMIN_EMAIL="admin@stoksay.com"
ADMIN_PASS="TestAdmin123"

PASS_COUNT=0
FAIL_COUNT=0
WARN_COUNT=0

pass() { ((PASS_COUNT++)); echo "  [PASS] $1"; }
fail() { ((FAIL_COUNT++)); echo "  [FAIL] $1"; }
warn() { ((WARN_COUNT++)); echo "  [WARN] $1"; }

header() { echo ""; echo "========================================"; echo "  $1"; echo "========================================"; }

# ──────────────────────────────────────────
# 0. HEALTH CHECK
# ──────────────────────────────────────────
header "0. HEALTH CHECK"
HC=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/health")
if [ "$HC" = "200" ]; then
  pass "Health endpoint reachable (HTTP $HC)"
else
  fail "Health endpoint NOT reachable (HTTP $HC) — aborting"
  echo ""; echo "SUMMARY: Cannot reach API. Is the server running on port 3001?"
  exit 1
fi

# ──────────────────────────────────────────
# 1. AUTH SECURITY
# ──────────────────────────────────────────
header "1. AUTH SECURITY"

# 1a. Login without credentials
echo "--- 1a. Login without credentials ---"
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" -d '{}')
if [ "$CODE" = "400" ] || [ "$CODE" = "401" ]; then
  pass "Login with empty body returns $CODE"
else
  fail "Login with empty body returns $CODE (expected 400 or 401)"
fi

# 1b. Login with wrong password
echo "--- 1b. Login with wrong password ---"
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" -d '{"email":"admin@stoksay.com","password":"wrongpass"}')
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | head -n -1)
if [ "$CODE" = "401" ]; then
  pass "Wrong password returns 401"
else
  fail "Wrong password returns $CODE (expected 401)"
fi
# Check that error message doesn't reveal if email exists vs password wrong
if echo "$BODY" | grep -qi "password_hash\|bcrypt\|stack\|trace\|Error:"; then
  fail "Login error leaks internal details"
else
  pass "Login error message is generic (no internal leak)"
fi

# 1c. Access protected endpoint without token
echo "--- 1c. Protected endpoint without token ---"
CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/auth/me")
if [ "$CODE" = "401" ]; then
  pass "/auth/me without token returns 401"
else
  fail "/auth/me without token returns $CODE (expected 401)"
fi

CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/sayimlar")
if [ "$CODE" = "401" ]; then
  pass "/sayimlar without token returns 401"
else
  fail "/sayimlar without token returns $CODE (expected 401)"
fi

CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/kullanicilar")
if [ "$CODE" = "401" ]; then
  pass "/kullanicilar without token returns 401"
else
  fail "/kullanicilar without token returns $CODE (expected 401)"
fi

# 1d. Access with invalid JWT
echo "--- 1d. Invalid/expired JWT ---"
CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/auth/me" \
  -H "Authorization: Bearer invalid.token.here")
if [ "$CODE" = "401" ]; then
  pass "Invalid JWT returns 401"
else
  fail "Invalid JWT returns $CODE (expected 401)"
fi

# Expired-style token (random base64 segments)
FAKE_JWT="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZW1haWwiOiJmYWtlQGZha2UuY29tIiwicm9sIjoiYWRtaW4iLCJpYXQiOjE1MTYyMzkwMjIsImV4cCI6MTUxNjIzOTAyMn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/auth/me" \
  -H "Authorization: Bearer $FAKE_JWT")
if [ "$CODE" = "401" ]; then
  pass "Forged/expired JWT returns 401"
else
  fail "Forged/expired JWT returns $CODE (expected 401)"
fi

# 1e. SQL Injection in login
echo "--- 1e. SQL injection in login fields ---"
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"'\'' OR 1=1--","password":"'\'' OR 1=1--"}')
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | head -n -1)
if [ "$CODE" = "401" ] || [ "$CODE" = "400" ]; then
  pass "SQL injection in login returns $CODE (no bypass)"
else
  fail "SQL injection in login returns $CODE — POTENTIAL VULNERABILITY"
fi
# Check body doesn't contain a token (which would mean auth bypass)
if echo "$BODY" | grep -q '"token"'; then
  fail "SQL injection returned a token — AUTH BYPASS DETECTED"
else
  pass "SQL injection did not return a token"
fi

# More SQL injection variants
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@stoksay.com'\'' OR '\''1'\''='\''1","password":"x"}')
CODE=$(echo "$RESP" | tail -1)
if [ "$CODE" = "401" ] || [ "$CODE" = "400" ]; then
  pass "SQL injection variant 2 returns $CODE"
else
  fail "SQL injection variant 2 returns $CODE"
fi

RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@stoksay.com\" OR \"1\"=\"1","password":"x"}')
CODE=$(echo "$RESP" | tail -1)
if [ "$CODE" = "401" ] || [ "$CODE" = "400" ]; then
  pass "SQL injection variant 3 (double quotes) returns $CODE"
else
  fail "SQL injection variant 3 returns $CODE"
fi

# ──────────────────────────────────────────
# OBTAIN VALID ADMIN TOKEN
# ──────────────────────────────────────────
header "OBTAINING ADMIN TOKEN"
LOGIN_RESP=$(curl -s -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASS\"}")
TOKEN=$(echo "$LOGIN_RESP" | jq -r '.token // empty')
if [ -z "$TOKEN" ]; then
  fail "Could not obtain admin token — remaining tests will fail"
  echo "$LOGIN_RESP"
  echo ""
  echo "SUMMARY: PASS=$PASS_COUNT FAIL=$FAIL_COUNT WARN=$WARN_COUNT"
  exit 1
else
  pass "Admin token obtained successfully"
fi
AUTH="Authorization: Bearer $TOKEN"

# ──────────────────────────────────────────
# 2. IDOR TESTS
# ──────────────────────────────────────────
header "2. IDOR TESTS"

# 2a. Non-existent sayim ID
echo "--- 2a. Non-existent resource IDs ---"
CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/sayimlar/nonexistent-uuid-9999" \
  -H "$AUTH")
if [ "$CODE" = "404" ]; then
  pass "Non-existent sayim ID returns 404"
else
  fail "Non-existent sayim ID returns $CODE (expected 404)"
fi

CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/kullanicilar/nonexistent-uuid-9999" \
  -H "$AUTH")
if [ "$CODE" = "404" ]; then
  pass "Non-existent kullanici ID returns 404"
else
  fail "Non-existent kullanici ID returns $CODE (expected 404)"
fi

# 2b. Sayim kalem with wrong sayim ID
echo "--- 2b. Kalem endpoints with wrong sayim ID ---"
CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/sayimlar/nonexistent-id/kalemler" \
  -H "$AUTH")
if [ "$CODE" = "404" ]; then
  pass "Kalemler with wrong sayim ID returns 404"
else
  fail "Kalemler with wrong sayim ID returns $CODE (expected 404)"
fi

# Try to add kalem to non-existent sayim
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/sayimlar/nonexistent-id/kalem" \
  -H "$AUTH" -H "Content-Type: application/json" \
  -d '{"urun_id":"fake-urun","miktar":5}')
CODE=$(echo "$RESP" | tail -1)
if [ "$CODE" = "404" ]; then
  pass "Add kalem to non-existent sayim returns 404"
else
  fail "Add kalem to non-existent sayim returns $CODE (expected 404)"
fi

# 2c. Try to delete non-existent sayim
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE/sayimlar/nonexistent-uuid" \
  -H "$AUTH")
if [ "$CODE" = "404" ]; then
  pass "Delete non-existent sayim returns 404"
else
  fail "Delete non-existent sayim returns $CODE (expected 404)"
fi

# ──────────────────────────────────────────
# 3. ERROR MESSAGE LEAKAGE
# ──────────────────────────────────────────
header "3. ERROR MESSAGE LEAKAGE"

# 3a. Malformed JSON body
echo "--- 3a. Malformed JSON body ---"
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{invalid json here}')
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | head -n -1)
if [ "$CODE" = "400" ] || [ "$CODE" = "500" ]; then
  # Check body doesn't leak stack traces
  if echo "$BODY" | grep -qi "stack\|at Module\|at Object\|node_modules\|\.js:"; then
    fail "Malformed JSON leaks stack trace (HTTP $CODE)"
  else
    pass "Malformed JSON returns $CODE with no stack trace"
  fi
else
  warn "Malformed JSON returns $CODE (unusual)"
fi

# 3b. Wrong data types
echo "--- 3b. Invalid data types ---"
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":12345,"password":true}')
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | head -n -1)
if echo "$BODY" | grep -qi "stack\|at Module\|at Object\|err\.message\|node_modules"; then
  fail "Invalid data types leaks internal error details"
else
  pass "Invalid data types response has no internal leak (HTTP $CODE)"
fi

# 3c. Extra-large JSON payload
echo "--- 3c. Extra-large JSON payload ---"
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"x","password":"y","extra":"'"$(python3 -c "print('A'*100000)")"'"}')
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | head -n -1)
if echo "$BODY" | grep -qi "stack\|at Module\|node_modules"; then
  fail "Large payload leaks stack trace"
else
  pass "Large payload handled safely (HTTP $CODE)"
fi

# ──────────────────────────────────────────
# 4. INPUT VALIDATION
# ──────────────────────────────────────────
header "4. INPUT VALIDATION"

# 4a. SQL injection in query params
echo "--- 4a. SQL injection in query params ---"
RESP=$(curl -s -w "\n%{http_code}" "$BASE/sayimlar?isletme_id=1%20OR%201=1" \
  -H "$AUTH")
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | head -n -1)
if echo "$BODY" | grep -qi "syntax\|sql\|mysql\|mariadb\|ER_"; then
  fail "SQL injection in query param leaks SQL error"
else
  pass "SQL injection in query param handled safely (HTTP $CODE)"
fi

RESP=$(curl -s -w "\n%{http_code}" "$BASE/urunler?isletme_id=1;DROP%20TABLE%20users" \
  -H "$AUTH")
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | head -n -1)
if echo "$BODY" | grep -qi "syntax\|sql\|mysql\|mariadb\|ER_"; then
  fail "DROP TABLE injection leaks SQL error"
else
  pass "DROP TABLE injection handled safely (HTTP $CODE)"
fi

# UNION-based SQLi attempt
RESP=$(curl -s -w "\n%{http_code}" "$BASE/sayimlar?isletme_id=1%20UNION%20SELECT%20*%20FROM%20kullanicilar--" \
  -H "$AUTH")
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | head -n -1)
if echo "$BODY" | grep -qi "password_hash"; then
  fail "UNION SQL injection returned password_hash — DATA LEAK"
else
  pass "UNION SQL injection did not leak sensitive data (HTTP $CODE)"
fi

# 4b. XSS in text fields
echo "--- 4b. XSS in text fields ---"
XSS_PAYLOAD='<script>alert(1)</script>'
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/sayimlar" \
  -H "$AUTH" -H "Content-Type: application/json" \
  -d "{\"isletme_id\":\"test-xss\",\"depo_id\":\"test-xss\",\"ad\":\"$XSS_PAYLOAD\"}")
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | head -n -1)
# XSS is mainly a frontend concern, but check the API doesn't crash
if [ "$CODE" = "201" ] || [ "$CODE" = "400" ] || [ "$CODE" = "500" ]; then
  if echo "$BODY" | grep -qi "stack\|at Module\|node_modules"; then
    fail "XSS payload causes stack trace leak"
  else
    if [ "$CODE" = "500" ]; then
      warn "XSS payload in sayim name returns 500 (server error, but no leak)"
    else
      pass "XSS payload handled without crash (HTTP $CODE)"
    fi
  fi
fi

# XSS in search query
RESP=$(curl -s -w "\n%{http_code}" "$BASE/sayimlar?q=%3Cscript%3Ealert(1)%3C/script%3E" \
  -H "$AUTH")
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | head -n -1)
if echo "$BODY" | grep -qi "stack\|at Module"; then
  fail "XSS in search query causes stack trace leak"
else
  pass "XSS in search query handled safely (HTTP $CODE)"
fi

# 4c. Very long strings
echo "--- 4c. Very long strings (10000+ chars) ---"
LONG_STR=$(python3 -c "print('X' * 15000)")
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$LONG_STR\",\"password\":\"$LONG_STR\"}")
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | head -n -1)
if echo "$BODY" | grep -qi "stack\|at Module\|heap\|ENOMEM"; then
  fail "Long string causes error leak (HTTP $CODE)"
else
  pass "Long string in login handled safely (HTTP $CODE)"
fi

# 4d. Negative/zero/special chars in numeric fields
echo "--- 4d. Negative/zero/special chars in numeric fields ---"
RESP=$(curl -s -w "\n%{http_code}" "$BASE/sayimlar?sayfa=-1&limit=-10" \
  -H "$AUTH")
CODE=$(echo "$RESP" | tail -1)
if [ "$CODE" = "200" ] || [ "$CODE" = "400" ]; then
  pass "Negative pagination params handled (HTTP $CODE)"
else
  fail "Negative pagination params return $CODE"
fi

RESP=$(curl -s -w "\n%{http_code}" "$BASE/sayimlar?sayfa=0&limit=0" \
  -H "$AUTH")
CODE=$(echo "$RESP" | tail -1)
if [ "$CODE" = "200" ] || [ "$CODE" = "400" ]; then
  pass "Zero pagination params handled (HTTP $CODE)"
else
  fail "Zero pagination params return $CODE"
fi

RESP=$(curl -s -w "\n%{http_code}" "$BASE/sayimlar?limit=999999" \
  -H "$AUTH")
CODE=$(echo "$RESP" | tail -1)
if [ "$CODE" = "200" ] || [ "$CODE" = "400" ]; then
  pass "Extremely large limit handled (HTTP $CODE)"
else
  fail "Extremely large limit returns $CODE"
fi

RESP=$(curl -s -w "\n%{http_code}" "$BASE/sayimlar?sayfa=abc&limit=xyz" \
  -H "$AUTH")
CODE=$(echo "$RESP" | tail -1)
if [ "$CODE" = "200" ] || [ "$CODE" = "400" ]; then
  pass "Non-numeric pagination params handled (HTTP $CODE)"
else
  fail "Non-numeric pagination params return $CODE"
fi

# ──────────────────────────────────────────
# 5. RATE LIMITING
# ──────────────────────────────────────────
header "5. RATE LIMITING"

# 5a. Check rate limit headers
echo "--- 5a. Rate limit headers ---"
HEADERS=$(curl -s -D - -o /dev/null "$BASE/health")
if echo "$HEADERS" | grep -qi "ratelimit-limit\|x-ratelimit-limit\|ratelimit-remaining"; then
  pass "Rate limit headers present"
  echo "$HEADERS" | grep -i "ratelimit" | head -5 | sed 's/^/    /'
else
  fail "No rate limit headers found"
fi

# Check auth-specific rate limit headers
HEADERS=$(curl -s -D - -o /dev/null -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" -d '{"email":"x","password":"y"}')
if echo "$HEADERS" | grep -qi "ratelimit-limit"; then
  LIMIT_VAL=$(echo "$HEADERS" | grep -i "ratelimit-limit" | head -1 | tr -d '\r')
  pass "Login endpoint has rate limit headers: $LIMIT_VAL"
else
  fail "Login endpoint missing rate limit headers"
fi

# 5b. Rapid login attempts
echo "--- 5b. Rapid login attempts (25 requests) ---"
GOT_429=false
for i in $(seq 1 25); do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"brute@force.test","password":"wrongpass"}')
  if [ "$CODE" = "429" ]; then
    GOT_429=true
    pass "Rate limited after $i attempts (HTTP 429)"
    break
  fi
done
if [ "$GOT_429" = false ]; then
  warn "No 429 after 25 rapid login attempts (auth rate limit may be > 25 or IP-based reset)"
fi

# ──────────────────────────────────────────
# 6. CORS & SECURITY HEADERS
# ──────────────────────────────────────────
header "6. CORS & SECURITY HEADERS"

# 6a. CORS headers
echo "--- 6a. CORS configuration ---"
HEADERS=$(curl -s -D - -o /dev/null "$BASE/health" \
  -H "Origin: http://evil-site.com")
if echo "$HEADERS" | grep -qi "access-control-allow-origin: http://evil-site.com"; then
  fail "CORS allows arbitrary origin http://evil-site.com"
else
  pass "CORS does NOT allow arbitrary origin"
fi

# Check legitimate origin
HEADERS=$(curl -s -D - -o /dev/null "$BASE/health" \
  -H "Origin: http://localhost:5173")
if echo "$HEADERS" | grep -qi "access-control-allow-origin"; then
  pass "CORS allows legitimate origin (localhost:5173)"
else
  warn "CORS does not return header for localhost:5173 (may still work)"
fi

# 6b. Security headers
echo "--- 6b. Security headers (Helmet) ---"
HEADERS=$(curl -s -D - -o /dev/null "$BASE/health")

if echo "$HEADERS" | grep -qi "x-content-type-options: nosniff"; then
  pass "X-Content-Type-Options: nosniff present"
else
  fail "X-Content-Type-Options header missing"
fi

if echo "$HEADERS" | grep -qi "x-frame-options"; then
  pass "X-Frame-Options present"
else
  fail "X-Frame-Options header missing"
fi

if echo "$HEADERS" | grep -qi "x-xss-protection"; then
  pass "X-XSS-Protection present"
else
  warn "X-XSS-Protection header missing (deprecated but still useful)"
fi

if echo "$HEADERS" | grep -qi "strict-transport-security"; then
  pass "Strict-Transport-Security present"
else
  warn "HSTS header missing (expected in production with HTTPS)"
fi

if echo "$HEADERS" | grep -qi "x-powered-by"; then
  fail "X-Powered-By header is present (leaks server technology)"
else
  pass "X-Powered-By header removed (Helmet)"
fi

if echo "$HEADERS" | grep -qi "x-dns-prefetch-control"; then
  pass "X-DNS-Prefetch-Control present"
else
  warn "X-DNS-Prefetch-Control missing"
fi

if echo "$HEADERS" | grep -qi "referrer-policy"; then
  pass "Referrer-Policy present"
else
  warn "Referrer-Policy missing"
fi

# ──────────────────────────────────────────
# 7. JWT SECURITY
# ──────────────────────────────────────────
header "7. JWT SECURITY"

# 7a. Token structure and expiry
echo "--- 7a. JWT structure analysis ---"
# Decode the payload (base64)
JWT_PAYLOAD=$(echo "$TOKEN" | cut -d'.' -f2 | tr '_-' '/+' | base64 -d 2>/dev/null || echo "$TOKEN" | cut -d'.' -f2 | tr '_-' '/+' | python3 -c "import sys,base64,json; data=sys.stdin.read().strip(); padded=data+'='*(4-len(data)%4); print(json.dumps(json.loads(base64.b64decode(padded))))" 2>/dev/null)
JWT_HEADER=$(echo "$TOKEN" | cut -d'.' -f1 | tr '_-' '/+' | base64 -d 2>/dev/null || echo "$TOKEN" | cut -d'.' -f1 | tr '_-' '/+' | python3 -c "import sys,base64,json; data=sys.stdin.read().strip(); padded=data+'='*(4-len(data)%4); print(json.dumps(json.loads(base64.b64decode(padded))))" 2>/dev/null)

echo "  JWT Header: $JWT_HEADER"
echo "  JWT Payload: $JWT_PAYLOAD"

# Check algorithm
ALG=$(echo "$JWT_HEADER" | python3 -c "import sys,json; print(json.load(sys.stdin).get('alg',''))" 2>/dev/null)
if [ "$ALG" = "none" ]; then
  fail "JWT uses 'none' algorithm — CRITICAL VULNERABILITY"
elif [ "$ALG" = "HS256" ] || [ "$ALG" = "HS384" ] || [ "$ALG" = "HS512" ]; then
  pass "JWT uses $ALG algorithm"
else
  warn "JWT uses $ALG algorithm (verify this is intentional)"
fi

# Check expiry
EXP=$(echo "$JWT_PAYLOAD" | python3 -c "import sys,json; print(json.load(sys.stdin).get('exp',0))" 2>/dev/null)
IAT=$(echo "$JWT_PAYLOAD" | python3 -c "import sys,json; print(json.load(sys.stdin).get('iat',0))" 2>/dev/null)
if [ "$EXP" -gt 0 ] 2>/dev/null && [ "$IAT" -gt 0 ] 2>/dev/null; then
  DIFF=$((EXP - IAT))
  HOURS=$((DIFF / 3600))
  pass "JWT has expiry: ${HOURS}h (iat=$IAT, exp=$EXP)"
  if [ "$HOURS" -gt 168 ]; then
    warn "JWT expiry is very long (${HOURS}h / $((HOURS/24))d). Consider shorter tokens."
  elif [ "$HOURS" -le 24 ]; then
    pass "JWT expiry is reasonable (<= 24h)"
  fi
else
  fail "JWT missing exp or iat claims"
fi

# Check if password_hash is in token
if echo "$JWT_PAYLOAD" | grep -qi "password"; then
  fail "JWT payload contains password-related data"
else
  pass "JWT payload does not contain password data"
fi

# 7b. Tampered JWT
echo "--- 7b. Tampered JWT ---"
# Modify the payload to change role to admin with different sub
TAMPERED_PAYLOAD=$(echo '{"sub":"hacked-user-id","email":"hacker@evil.com","rol":"admin","iat":1700000000,"exp":9999999999}' | python3 -c "import sys,base64; print(base64.urlsafe_b64encode(sys.stdin.read().strip().encode()).decode().rstrip('='))")
JWT_PARTS=($(echo "$TOKEN" | tr '.' ' '))
TAMPERED_TOKEN="${JWT_PARTS[0]}.${TAMPERED_PAYLOAD}.${JWT_PARTS[2]}"

CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/auth/me" \
  -H "Authorization: Bearer $TAMPERED_TOKEN")
if [ "$CODE" = "401" ]; then
  pass "Tampered JWT rejected (401)"
else
  fail "Tampered JWT returned $CODE — SIGNATURE VERIFICATION MAY BE BROKEN"
fi

# 7c. JWT with "none" algorithm attack
echo "--- 7c. 'none' algorithm attack ---"
NONE_HEADER=$(echo '{"alg":"none","typ":"JWT"}' | python3 -c "import sys,base64; print(base64.urlsafe_b64encode(sys.stdin.read().strip().encode()).decode().rstrip('='))")
NONE_PAYLOAD=$(echo '{"sub":"1","email":"admin@stoksay.com","rol":"admin","iat":1700000000,"exp":9999999999}' | python3 -c "import sys,base64; print(base64.urlsafe_b64encode(sys.stdin.read().strip().encode()).decode().rstrip('='))")
NONE_TOKEN="${NONE_HEADER}.${NONE_PAYLOAD}."

CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/auth/me" \
  -H "Authorization: Bearer $NONE_TOKEN")
if [ "$CODE" = "401" ]; then
  pass "'none' algorithm JWT rejected (401)"
else
  fail "'none' algorithm JWT returned $CODE — CRITICAL VULNERABILITY"
fi

# 7d. Empty signature
echo "--- 7d. Empty signature ---"
EMPTY_SIG_TOKEN="${JWT_PARTS[0]}.${JWT_PARTS[1]}."
CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/auth/me" \
  -H "Authorization: Bearer $EMPTY_SIG_TOKEN")
if [ "$CODE" = "401" ]; then
  pass "JWT with empty signature rejected (401)"
else
  fail "JWT with empty signature returned $CODE — SIGNATURE CHECK BYPASSED"
fi

# ──────────────────────────────────────────
# 8. ADDITIONAL CHECKS
# ──────────────────────────────────────────
header "8. ADDITIONAL CHECKS"

# 8a. HTTP verb tampering
echo "--- 8a. HTTP verb tampering ---"
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH "$BASE/auth/login" \
  -H "Content-Type: application/json" -d '{}')
if [ "$CODE" = "404" ] || [ "$CODE" = "405" ]; then
  pass "PATCH on login endpoint returns $CODE"
else
  warn "PATCH on login endpoint returns $CODE"
fi

# 8b. Path traversal attempt
echo "--- 8b. Path traversal ---"
CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/../../../etc/passwd" \
  -H "$AUTH")
if [ "$CODE" = "404" ] || [ "$CODE" = "400" ] || [ "$CODE" = "301" ] || [ "$CODE" = "200" ]; then
  BODY=$(curl -s "$BASE/../../../etc/passwd" -H "$AUTH")
  if echo "$BODY" | grep -q "root:"; then
    fail "Path traversal returned /etc/passwd content"
  else
    pass "Path traversal does not leak files (HTTP $CODE)"
  fi
fi

# 8c. Admin-only endpoints protection
echo "--- 8c. Admin-only endpoint access control ---"
# Create a marker: we already have admin access, just verify the structure
CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/kullanicilar" \
  -H "$AUTH")
if [ "$CODE" = "200" ]; then
  pass "Admin can access /kullanicilar (HTTP $CODE)"
else
  fail "Admin cannot access /kullanicilar (HTTP $CODE)"
fi

# 8d. Check if password_hash is ever returned
echo "--- 8d. Password hash in responses ---"
RESP=$(curl -s "$BASE/auth/me" -H "$AUTH")
if echo "$RESP" | grep -qi "password_hash"; then
  fail "password_hash exposed in /auth/me response"
else
  pass "password_hash not in /auth/me response"
fi

LOGIN_RESP_CHECK=$(curl -s -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASS\"}")
if echo "$LOGIN_RESP_CHECK" | grep -qi "password_hash"; then
  fail "password_hash exposed in login response"
else
  pass "password_hash not in login response"
fi

# 8e. Content-Type enforcement
echo "--- 8e. Content-Type check ---"
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/auth/login" \
  -H "Content-Type: text/plain" \
  -d 'email=admin@stoksay.com&password=TestAdmin123')
if [ "$CODE" = "400" ] || [ "$CODE" = "401" ]; then
  pass "Non-JSON Content-Type rejected properly (HTTP $CODE)"
else
  warn "Non-JSON Content-Type returns $CODE (server may accept non-JSON)"
fi

# ──────────────────────────────────────────
# SUMMARY
# ──────────────────────────────────────────
echo ""
echo "========================================"
echo "  SECURITY TEST RESULTS"
echo "========================================"
echo "  PASS: $PASS_COUNT"
echo "  FAIL: $FAIL_COUNT"
echo "  WARN: $WARN_COUNT"
echo "  TOTAL: $((PASS_COUNT + FAIL_COUNT + WARN_COUNT))"
echo "========================================"

if [ "$FAIL_COUNT" -eq 0 ]; then
  echo "  ALL TESTS PASSED"
else
  echo "  $FAIL_COUNT ISSUE(S) FOUND — review FAIL items above"
fi
echo ""
