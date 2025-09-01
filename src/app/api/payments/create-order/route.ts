
import { NextResponse } from 'next/server';
import { createOrder } from '@/lib/paypal';
import { verifyAuth } from '@/lib/auth'; // I will create this helper function next

export async function POST(request: Request) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { planId } = await request.json();
    if (!planId) {
      return NextResponse.json({ error: 'planId is required' }, { status: 400 });
    }

    const order = await createOrder(planId);
    return NextResponse.json(order);

  } catch (error: any) {
    console.error('Create order error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
