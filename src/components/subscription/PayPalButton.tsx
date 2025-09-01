
'use client';

import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { useToast } from '@/hooks/use-toast';

interface PayPalButtonProps {
  planId: string;
}

export function PayPalButton({ planId }: PayPalButtonProps) {
  const { toast } = useToast();
  const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!;

  const createOrder = async () => {
    try {
      const response = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      });
      const order = await response.json();
      if (!response.ok) {
        throw new Error(order.error || 'Failed to create order');
      }
      return order.id;
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return '';
    }
  };

  const onApprove = async (data: any) => {
    try {
      const response = await fetch('/api/payments/capture-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: data.orderID }),
      });
      const capturedOrder = await response.json();
      if (!response.ok) {
        throw new Error(capturedOrder.error || 'Failed to capture order');
      }

      // Now, update the subscription in our database
      const subResponse = await fetch('/api/subscriptions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: planId,
          status: 'active',
          paypalSubscriptionId: capturedOrder.id, // Or a more specific ID from PayPal response
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Example: 30 days from now
        }),
      });

      if (!subResponse.ok) {
        const subResult = await subResponse.json();
        throw new Error(subResult.error || 'Failed to update subscription');
      }

      toast({ title: 'Success', description: 'Subscription activated!' });
      window.location.reload();

    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  if (!paypalClientId) {
    return <div>Loading PayPal...</div>;
  }

  return (
    <PayPalScriptProvider options={{ 'clientId': paypalClientId, currency: 'USD' }}>
      <PayPalButtons
        style={{ layout: 'vertical' }}
        createOrder={createOrder}
        onApprove={onApprove}
      />
    </PayPalScriptProvider>
  );
}
