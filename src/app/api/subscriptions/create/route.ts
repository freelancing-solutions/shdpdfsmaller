
import { NextResponse } from 'next/server';
import { PrismaClient, SubscriptionPlan } from '@prisma/client';
import { verifyAuth } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { plan, status, paypalSubscriptionId, currentPeriodEnd } = await request.json();

    if (!plan || !Object.values(SubscriptionPlan).includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan specified' }, { status: 400 });
    }

    const subscription = await prisma.subscription.upsert({
      where: { userId: user.id },
      update: {
        plan,
        status,
        paypalSubscriptionId,
        currentPeriodEnd: currentPeriodEnd ? new Date(currentPeriodEnd) : null,
      },
      create: {
        userId: user.id,
        plan,
        status,
        paypalSubscriptionId,
        currentPeriodEnd: currentPeriodEnd ? new Date(currentPeriodEnd) : null,
      },
    });

    return NextResponse.json(subscription);

  } catch (error: any) {
    console.error('Subscription creation error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
