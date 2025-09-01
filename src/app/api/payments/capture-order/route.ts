
import { NextResponse } from 'next/server';
import { captureOrder } from '@/lib/paypal';
import { verifyAuth } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId } = await request.json();
    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
    }

    const capturedOrder = await captureOrder(orderId);

    // Here you would typically update the user's subscription status in your database.
    // For now, we just return the captured order data.

    return NextResponse.json(capturedOrder);

  } catch (error: any) {
    console.error('Capture order error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
