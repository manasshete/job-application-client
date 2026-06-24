import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/admin/service-client'
import { verifyPayment, fetchOrder, fetchPayment } from '@/lib/razorpay'
import { SUBSCRIPTION_PRICES } from '@/app/api/payment/create-order/route'
import { grantTokens, resetUserTokens } from '@/lib/data/tokens'
import { SUBSCRIPTION_LIMITS } from '@/lib/subscription'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { orderId, paymentId, signature } = (body ?? {}) as {
      orderId?: unknown
      paymentId?: unknown
      signature?: unknown
    }

    if (
      typeof orderId !== 'string' ||
      typeof paymentId !== 'string' ||
      typeof signature !== 'string'
    ) {
      return NextResponse.json({ error: 'Missing payment parameters' }, { status: 400 })
    }

    // 1. Verify the HMAC signature (proves the payload came from Razorpay).
    let signatureValid = false
    try {
      signatureValid = await verifyPayment(orderId, paymentId, signature)
    } catch {
      signatureValid = false
    }
    if (!signatureValid) {
      return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 })
    }

    // 2. Fetch the authoritative order + payment from Razorpay. NEVER trust
    //    the tier or amount sent by the client.
    const order = await fetchOrder(orderId)
    const payment = await fetchPayment(paymentId)

    // 3. The order must belong to the authenticated user (notes set server-side
    //    at creation time). Prevents claiming someone else's paid order.
    const orderUserId = (order.notes as Record<string, string> | undefined)?.userId
    const tier = (order.notes as Record<string, string> | undefined)?.tier
    if (orderUserId !== user.id) {
      return NextResponse.json({ error: 'Order does not belong to this user' }, { status: 403 })
    }
    if (tier !== 'pro' && tier !== 'premium') {
      return NextResponse.json({ error: 'Invalid order tier' }, { status: 400 })
    }

    // 4. The payment must actually be captured/authorized and match the order.
    if (payment.order_id !== orderId) {
      return NextResponse.json({ error: 'Payment does not match order' }, { status: 400 })
    }
    if (payment.status !== 'captured' && payment.status !== 'authorized') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 })
    }

    // 5. The captured amount must match the server-authoritative price for the tier.
    const expectedAmount = SUBSCRIPTION_PRICES[tier]
    if (Number(payment.amount) !== expectedAmount || Number(order.amount) !== expectedAmount) {
      console.error('[v0] Payment amount mismatch', {
        tier,
        expectedAmount,
        paymentAmount: payment.amount,
        orderAmount: order.amount,
      })
      return NextResponse.json({ error: 'Payment amount mismatch' }, { status: 400 })
    }

    // All checks passed. Use the service-role client for the privileged write
    // (subscription_tier is no longer writable by the user-scoped client).
    const admin = createAdminClient()

    // 6. Replay protection: record the payment first. The unique index on
    //    razorpay_order_id rejects a second attempt to reuse the same order.
    const { error: paymentInsertError } = await admin.from('payments').insert({
      user_id: user.id,
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      amount: expectedAmount,
      currency: order.currency ?? 'INR',
      tier,
      status: 'completed',
    })

    if (paymentInsertError) {
      // 23505 = unique_violation -> this order was already processed.
      if (paymentInsertError.code === '23505') {
        return NextResponse.json({ error: 'This payment has already been processed.' }, { status: 409 })
      }
      console.error('[v0] Error recording payment:', paymentInsertError.message)
      return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 })
    }

    // 7. Activate the subscription (server-derived tier only).
    const { error: updateError } = await admin
      .from('profiles')
      .update({
        subscription_tier: tier,
        subscription_status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('[v0] Error updating subscription:', updateError.message)
      return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 })
    }

    // 8. Reset any existing tokens first so the user starts fresh at the new
    //    tier — prevents stacking if they renew or upgrade while tokens remain.
    const resetResult = await resetUserTokens(user.id)
    if (resetResult.error) {
      console.error('[v0] Payment: failed to reset tokens before grant:', resetResult.error.message)
    }

    // Grant this tier's fresh tokens valid for 60 days from now.
    const limits = SUBSCRIPTION_LIMITS[tier]
    const aiGrant = await grantTokens(user.id, 'ai_extraction', limits.aiExtractionLimit, 'payment')
    if (aiGrant.error) {
      console.error('[v0] Failed to grant AI extraction tokens after payment:', aiGrant.error.message)
    }
    const docGrant = await grantTokens(user.id, 'document_generation', limits.documentGenerationLimit, 'payment')
    if (docGrant.error) {
      console.error('[v0] Failed to grant document generation tokens after payment:', docGrant.error.message)
    }

    return NextResponse.json({ success: true, message: 'Payment successful', tier })
  } catch (error) {
    console.error('[v0] Error verifying payment:', error)
    return NextResponse.json({ error: 'Failed to verify payment' }, { status: 500 })
  }
}
