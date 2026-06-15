import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyPayment } from '@/lib/razorpay'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { orderId, paymentId, signature, tier } = await req.json()

    // Verify payment signature
    const isValid = await verifyPayment(orderId, paymentId, signature)

    if (!isValid) {
      return NextResponse.json(
        { error: 'Payment verification failed' },
        { status: 400 }
      )
    }

    // Update user subscription in database
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        subscription_tier: tier,
        subscription_status: 'active',
        subscription_updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('[v0] Error updating subscription:', updateError)
      return NextResponse.json(
        { error: 'Failed to update subscription' },
        { status: 500 }
      )
    }

    // Insert payment record for audit trail
    await supabase.from('payments').insert({
      user_id: user.id,
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      amount: 0, // Amount is in paise from the order
      tier,
      status: 'completed',
    })

    return NextResponse.json({
      success: true,
      message: 'Payment successful',
    })
  } catch (error) {
    console.error('[v0] Error verifying payment:', error)
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    )
  }
}
