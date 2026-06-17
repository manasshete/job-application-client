import Razorpay from 'razorpay'

let razorpayInstance: Razorpay | null = null

function getRazorpay(): Razorpay {
  if (!razorpayInstance) {
    const key_id = process.env.RAZORPAY_KEY_ID
    const key_secret = process.env.RAZORPAY_KEY_SECRET

    if (!key_id || !key_secret) {
      throw new Error(
        'Razorpay is not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.'
      )
    }

    razorpayInstance = new Razorpay({ key_id, key_secret })
  }

  return razorpayInstance
}

export interface RazorpayOrder {
  amount: number
  currency: string
  receipt: string
  notes: Record<string, string>
}

export async function createOrder(orderData: RazorpayOrder) {
  try {
    const order = await getRazorpay().orders.create(orderData)
    return order
  } catch (error) {
    console.error('[v0] Error creating Razorpay order:', error)
    throw error
  }
}

export async function verifyPayment(
  orderId: string,
  paymentId: string,
  signature: string
) {
  try {
    const key_secret = process.env.RAZORPAY_KEY_SECRET
    if (!key_secret) {
      throw new Error('Razorpay is not configured.')
    }

    const crypto = require('crypto')
    const hmac = crypto.createHmac('sha256', key_secret)
    hmac.update(orderId + '|' + paymentId)
    const generated_signature = hmac.digest('hex')

    const isAuthentic = generated_signature === signature

    if (!isAuthentic) {
      throw new Error('Payment signature verification failed')
    }

    return true
  } catch (error) {
    console.error('[v0] Error verifying payment:', error)
    throw error
  }
}

/**
 * Fetches an order from Razorpay so the server can read the trusted, server-set
 * `notes` (tier, userId) and the authoritative `amount`. Used during payment
 * verification so we never trust tier/amount values sent by the client.
 */
export async function fetchOrder(orderId: string) {
  return getRazorpay().orders.fetch(orderId)
}

/**
 * Fetches a payment from Razorpay to confirm it was actually captured and that
 * it belongs to the given order. Prevents accepting unpaid/failed payments.
 */
export async function fetchPayment(paymentId: string) {
  return getRazorpay().payments.fetch(paymentId)
}

export function getRazorpayInstance() {
  return getRazorpay()
}
