'use client';

import Link from 'next/link';
import { Check, Zap, Star, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

const plans = [
  {
    name: 'Free',
    name_hi: 'मुफ्त',
    price: 0,
    description: 'For small businesses and startups',
    features: [
      'Post up to 5 jobs',
      'Basic visibility',
      'View applicant profiles',
      'Email support',
    ],
    cta: 'Get Started',
    popular: false,
  },
  {
    name: 'Featured Job',
    name_hi: 'विशेष नौकरी',
    price: 499,
    description: 'Boost a single job posting',
    features: [
      'Top of listing for 7 days',
      'Featured badge (yellow)',
      'Extra visibility',
      'Priority review',
    ],
    cta: 'Upgrade Now',
    popular: false,
  },
  {
    name: 'Urgent Hiring',
    name_hi: 'तत्काल भर्ती',
    price: 1999,
    description: 'For urgent hiring needs',
    features: [
      'Top + Urgent badge',
      'Middleman verification',
      'WhatsApp blast to seekers',
      'Priority support',
      '7 days visibility',
    ],
    cta: 'Go Urgent',
    popular: true,
  },
  {
    name: 'Premium',
    name_hi: 'प्रीमियम',
    price: 2999,
    description: 'Monthly plan for employers',
    features: [
      'Unlimited job posts',
      'Featured jobs included',
      'Analytics dashboard',
      'Candidate shortlisting',
      'Priority support',
      'Company profile',
    ],
    cta: 'Go Premium',
    popular: false,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose the plan that works for your hiring needs. All prices in Indian Rupees.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`bg-white rounded-2xl border-2 p-6 relative ${
                plan.popular
                  ? 'border-bihar-green shadow-xl'
                  : 'border-gray-200'
              }`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-bihar-green text-white">
                  <Star className="w-3 h-3 mr-1" /> Most Popular
                </Badge>
              )}

              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">{plan.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{plan.name_hi}</p>
              </div>

              <div className="text-center mb-6">
                <span className="text-4xl font-bold text-gray-900">
                  ₹{plan.price}
                </span>
                {plan.price > 0 && (
                  <span className="text-gray-500">
                    {plan.price === 2999 ? '/month' : ''}
                  </span>
                )}
                <p className="text-sm text-gray-500 mt-2">{plan.description}</p>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="w-5 h-5 text-bihar-green flex-shrink-0" />
                    <span className="text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link href={plan.price === 0 ? '/register?role=employer' : '/register?role=employer'}>
                <Button
                  variant={plan.popular ? 'primary' : 'outline'}
                  className="w-full"
                >
                  {plan.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-16 bg-bihar-green-bg rounded-2xl p-8 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
            Need a custom plan for your company?
          </h2>
          <p className="text-gray-600 text-center mb-6">
            Contact us for bulk hiring, dedicated support, and custom solutions.
          </p>
          <div className="flex justify-center">
            <Link href="/contact">
              <Button size="lg">Contact Sales</Button>
            </Link>
          </div>
        </div>

        <div className="mt-12 max-w-2xl mx-auto">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">
            Frequently Asked Questions
          </h3>
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h4 className="font-medium text-gray-900">How does payment work?</h4>
              <p className="text-gray-600 text-sm mt-1">
                We use Razorpay for secure payments. You can pay via UPI, Cards, Net Banking, or Wallets.
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h4 className="font-medium text-gray-900">Can I cancel anytime?</h4>
              <p className="text-gray-600 text-sm mt-1">
                Yes, you can cancel your subscription anytime. Refunds available for unused months.
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h4 className="font-medium text-gray-900">What if I need help?</h4>
              <p className="text-gray-600 text-sm mt-1">
                Our team is available via WhatsApp, Email, and Phone for support.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}