import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createOrder } from '@/lib/razorpay'

export const dynamic = 'force-dynamic'

const SUBSCRIPTION_PRICES: Record<string, number> = {
  pro: 1000, // £10 in pence (100 pence = £1)
  premium: 1500, // £15 in pence
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { tier } = await req.json()

    if (!tier || !['pro', 'premium'].includes(tier)) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })
    }

    const amount = SUBSCRIPTION_PRICES[tier]

    const order = await createOrder({
      amount,
      currency: 'GBP',
      receipt: `hireflow_${user.id}_${Date.now()}`,
      notes: {
        userId: user.id,
        userEmail: user.email || '',
        tier,
      },
    })

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    })
  } catch (error) {
    console.error('[v0] Error creating Razorpay order:', error)
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    )
  }
}
