import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { plan_type, job_id, user_id } = body;

    const plans: Record<string, number> = {
      featured: 49900,
      urgent: 199900,
      premium: 299900,
    };

    const amount = plans[plan_type] || 49900;

    const order = await razorpay.orders.create({
      amount,
      currency: 'INR',
      receipt: `order_${Date.now()}`,
      notes: {
        plan_type,
        job_id: job_id || '',
        user_id: user_id || '',
      },
    });

    return NextResponse.json({
      order_id: order.id,
      amount: order.amount,
    });
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}