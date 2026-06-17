import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createOrder } from '@/lib/razorpay'

export const dynamic = 'force-dynamic'

// Server-authoritative pricing. Never trust amounts from the client.
export const SUBSCRIPTION_PRICES: Record<string, number> = {
  pro: 1000, // £10.00 in pence
  premium: 1500, // £15.00 in pence
}

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

    const tier = (body as { tier?: unknown })?.tier
    if (typeof tier !== 'string' || !['pro', 'premium'].includes(tier)) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })
    }

    const amount = SUBSCRIPTION_PRICES[tier]

    const order = await createOrder({
      amount,
      currency: 'GBP',
      receipt: `hireflow_${user.id}_${Date.now()}`,
      // notes are returned to us (signed) by Razorpay on verification, so we
      // use them as the source of truth for which tier was actually paid for.
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
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}
