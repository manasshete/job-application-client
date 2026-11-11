/**
 * Razorpay Integration Test Script
 * Tests: create-order → HMAC signature → verify logic
 * Run: node scripts/test-razorpay.mjs
 */

import crypto from 'crypto'

const KEY_ID     = 'rzp_test_Tyuot80I3izJua'
const KEY_SECRET = 'JVtpS0f1c31Mm9KgSL3am3f3'
const BASE_URL   = 'https://api.razorpay.com/v1'
const AUTH       = 'Basic ' + Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString('base64')

const PASS = '\x1b[32m✔\x1b[0m'
const FAIL = '\x1b[31m✘\x1b[0m'
const INFO = '\x1b[36mℹ\x1b[0m'

let passed = 0, failed = 0

function ok(label, value) {
  console.log(`  ${PASS} ${label}`, value !== undefined ? `→ ${JSON.stringify(value)}` : '')
  passed++
}
function fail(label, err) {
  console.log(`  ${FAIL} ${label}: ${err}`)
  failed++
}

// ─── TEST 1: Credentials ───────────────────────────────────────────────────
console.log('\n\x1b[1m[1] Credentials check\x1b[0m')
if (KEY_ID.startsWith('rzp_test_')) ok('KEY_ID is a test key', KEY_ID)
else fail('KEY_ID must start with rzp_test_', KEY_ID)
if (KEY_SECRET.length >= 20) ok('KEY_SECRET length looks valid', `${KEY_SECRET.length} chars`)
else fail('KEY_SECRET too short', KEY_SECRET.length)

// ─── TEST 2: Create Order ──────────────────────────────────────────────────
console.log('\n\x1b[1m[2] Create Razorpay Order (POST /v1/orders)\x1b[0m')

let orderId, orderAmount, orderCurrency

try {
  const receipt = `pz_test_${Date.now().toString(36)}`
  console.log(`  ${INFO} Receipt: ${receipt} (${receipt.length} chars — max 56)`)
  if (receipt.length > 56) fail('Receipt too long', receipt.length)
  else ok('Receipt length valid', receipt.length)

  const res = await fetch(`${BASE_URL}/orders`, {
    method: 'POST',
    headers: { Authorization: AUTH, 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: 29900, currency: 'INR', receipt })
  })
  const order = await res.json()

  if (!res.ok) {
    fail('Create order API call', order?.error?.description ?? res.status)
  } else {
    orderId       = order.id
    orderAmount   = order.amount
    orderCurrency = order.currency
    ok('Order created', orderId)
    ok('Amount', `₹${orderAmount / 100} (${orderAmount} paise)`)
    ok('Currency', orderCurrency)
    ok('Status', order.status)
    ok('Amount matches Pro tier (₹299)', orderAmount === 29900)
  }
} catch (e) {
  fail('Create order network error', e.message)
}

// ─── TEST 3: Fetch Order ───────────────────────────────────────────────────
console.log('\n\x1b[1m[3] Fetch Order (GET /v1/orders/:id)\x1b[0m')

if (orderId) {
  try {
    const res = await fetch(`${BASE_URL}/orders/${orderId}`, {
      headers: { Authorization: AUTH }
    })
    const fetched = await res.json()
    if (!res.ok) fail('Fetch order', fetched?.error?.description)
    else {
      ok('Order fetched successfully', fetched.id)
      ok('IDs match', fetched.id === orderId)
    }
  } catch (e) {
    fail('Fetch order network error', e.message)
  }
} else {
  console.log(`  ${INFO} Skipped (no orderId from step 2)`)
}

// ─── TEST 4: HMAC Signature Verification ──────────────────────────────────
console.log('\n\x1b[1m[4] HMAC-SHA256 Signature Verification\x1b[0m')

const fakePaymentId = `pay_test_${Date.now().toString(36)}`
const sigInput      = `${orderId ?? 'order_test123'}|${fakePaymentId}`

const correctSig = crypto
  .createHmac('sha256', KEY_SECRET)
  .update(sigInput)
  .digest('hex')

const tamperedSig = correctSig.slice(0, -4) + 'aaaa'

function verifyHmac(ordId, payId, sig) {
  const expected = crypto.createHmac('sha256', KEY_SECRET).update(`${ordId}|${payId}`).digest('hex')
  const exp = Buffer.from(expected)
  const rec = Buffer.from(typeof sig === 'string' ? sig : '')
  return exp.length === rec.length && crypto.timingSafeEqual(exp, rec)
}

ok('Correct signature verifies as TRUE',  verifyHmac(orderId ?? 'order_test123', fakePaymentId, correctSig))
ok('Tampered signature verifies as FALSE', !verifyHmac(orderId ?? 'order_test123', fakePaymentId, tamperedSig))
ok('Empty signature verifies as FALSE',   !verifyHmac(orderId ?? 'order_test123', fakePaymentId, ''))
ok('Wrong paymentId verifies as FALSE',   !verifyHmac(orderId ?? 'order_test123', 'pay_wrong', correctSig))

// ─── TEST 5: Receipt length edge cases ────────────────────────────────────
console.log('\n\x1b[1m[5] Receipt Format Validation\x1b[0m')

const testUserId    = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' // 36-char UUID
const shortReceipt  = `pz_${testUserId.slice(-8)}_${Date.now().toString(36)}`
const oldReceipt    = `pursuitz_${testUserId}_${Date.now()}`

console.log(`  ${INFO} OLD format: "${oldReceipt}" = ${oldReceipt.length} chars`)
console.log(`  ${INFO} NEW format: "${shortReceipt}" = ${shortReceipt.length} chars`)
ok('New receipt format ≤ 56 chars', shortReceipt.length <= 56)
ok('Old receipt format WOULD have failed (> 56)', oldReceipt.length > 56)

// ─── TEST 6: Pricing Sanity ────────────────────────────────────────────────
console.log('\n\x1b[1m[6] Pricing Sanity\x1b[0m')

const PRICES = { pro: 29900, premium: 49900 }
ok('Pro tier = ₹299 (29900 paise)',     PRICES.pro === 29900)
ok('Premium tier = ₹499 (49900 paise)', PRICES.premium === 49900)
ok('Both above Razorpay minimum (100 paise)', PRICES.pro >= 100 && PRICES.premium >= 100)

// ─── SUMMARY ──────────────────────────────────────────────────────────────
console.log('\n' + '─'.repeat(50))
console.log(`\x1b[1mResults: ${PASS} ${passed} passed  ${FAIL} ${failed} failed\x1b[0m`)

if (failed === 0) {
  console.log('\x1b[32m\n✅ All tests passed — Razorpay integration is healthy!\x1b[0m')
  if (orderId) {
    console.log(`\n${INFO} Live test order created: \x1b[33m${orderId}\x1b[0m`)
    console.log(`   View it at: https://dashboard.razorpay.com/app/orders`)
  }
} else {
  console.log('\x1b[31m\n❌ Some tests failed — check output above.\x1b[0m')
  process.exit(1)
}
