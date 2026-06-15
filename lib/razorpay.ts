import Razorpay from 'razorpay'

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

export interface RazorpayOrder {
  amount: number
  currency: string
  receipt: string
  notes: Record<string, string>
}

export async function createOrder(orderData: RazorpayOrder) {
  try {
    const order = await razorpay.orders.create(orderData)
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
    const crypto = require('crypto')
    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
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

export function getRazorpayInstance() {
  return razorpay
}
