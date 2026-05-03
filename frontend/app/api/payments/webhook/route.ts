import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-razorpay-signature');
    
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const data = JSON.parse(body);
    const { payload } = data;
    
    if (!payload?.payment?.entity) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const payment = payload.payment.entity;
    const order = payment.notes;
    
    const supabase = createAdminClient();
    
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('id')
      .eq('razorpay_payment_id', payment.id)
      .single();

    if (existingPayment) {
      return NextResponse.json({ success: true, message: 'Already processed' });
    }

    const { error: paymentError } = await supabase.from('payments').insert({
      user_id: order.user_id,
      plan_type: order.plan_type,
      amount: payment.amount / 100,
      razorpay_order_id: payment.order_id,
      razorpay_payment_id: payment.id,
      razorpay_signature: signature,
      status: 'completed',
      paid_at: new Date().toISOString(),
      job_id: order.job_id || null,
    });

    if (paymentError) {
      console.error('Payment insert error:', paymentError);
      return NextResponse.json({ error: 'Failed to save payment' }, { status: 500 });
    }

    if (order.job_id) {
      const updateData: Record<string, unknown> = {};
      if (order.plan_type === 'featured') {
        updateData.is_featured = true;
      } else if (order.plan_type === 'urgent') {
        updateData.is_urgent = true;
        updateData.is_featured = true;
      }
      
      if (Object.keys(updateData).length > 0) {
        await supabase.from('jobs').update(updateData).eq('id', order.job_id);
      }
    }

    if (order.user_id && order.plan_type === 'premium') {
      await supabase
        .from('profiles')
        .update({
          is_premium: true,
          premium_plan: 'premium',
          premium_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq('id', order.user_id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}