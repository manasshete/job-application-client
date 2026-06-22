'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

declare global {
  interface Window {
    Razorpay: any
  }
}

interface RazorpayCheckoutProps {
  tier: 'pro' | 'premium'
  onSuccess?: () => void
  onError?: (error: string) => void
}

export function RazorpayCheckout({ tier, onSuccess, onError }: RazorpayCheckoutProps) {
  const [loading, setLoading] = useState(false)

  const handleCheckout = async () => {
    setLoading(true)
    try {
      // Create order on server
      const orderRes = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      })

      if (!orderRes.ok) {
        throw new Error('Failed to create order')
      }

      const orderData = await orderRes.json()

      // Load Razorpay script
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.async = true
      script.onload = () => {
        const options = {
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency,
          order_id: orderData.orderId,
          handler: async (response: any) => {
            try {
              // Verify payment on server
              const verifyRes = await fetch('/api/payment/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  orderId: response.razorpay_order_id,
                  paymentId: response.razorpay_payment_id,
                  signature: response.razorpay_signature,
                  tier,
                }),
              })

              if (!verifyRes.ok) {
                throw new Error('Payment verification failed')
              }

              // Payment successful
              onSuccess?.()
            } catch (error) {
              onError?.(error instanceof Error ? error.message : 'Verification failed')
            } finally {
              setLoading(false)
            }
          },
          prefill: {
            name: 'Pursuitz User',
            email: '',
          },
          theme: {
            color: '#3b82f6',
          },
        }

        const razorpay = new window.Razorpay(options)
        razorpay.open()
      }
      document.body.appendChild(script)
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Checkout failed')
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleCheckout}
      disabled={loading}
      className="w-full"
      size="lg"
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        `Upgrade to ${tier === 'pro' ? 'Pro' : 'Premium'}`
      )}
    </Button>
  )
}
