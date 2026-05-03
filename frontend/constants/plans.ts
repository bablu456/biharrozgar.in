export const PLANS = {
  employer: {
    free: {
      name_en: 'Free',
      name_hi: 'मुफ्त',
      price: 0,
      features: [
        'Post up to 5 jobs',
        'Basic job visibility',
        'View applicant profiles',
        'Email support',
      ],
    },
    premium: {
      name_en: 'Premium',
      name_hi: 'प्रीमियम',
      price: 2999,
      duration: 'month',
      features: [
        'Unlimited job posts',
        'Featured job badge',
        'Priority visibility',
        'Analytics dashboard',
        'Candidate shortlisting',
        'Priority support',
      ],
    },
  },
  job: {
    featured: {
      name_en: 'Featured Job',
      name_hi: 'विशेष नौकरी',
      price: 499,
      duration: '7 days',
      features: [
        'Top of listing',
        'Yellow featured badge',
        '7 days visibility',
        'Extra exposure',
      ],
    },
    urgent: {
      name_en: 'Urgent Hiring',
      name_hi: 'तत्काल भर्ती',
      price: 1999,
      duration: '7 days',
      features: [
        'Top + Urgent badge',
        'Middleman verification',
        'Priority support',
        '7 days visibility',
        'WhatsApp blast to seekers',
      ],
    },
  },
} as const;

export type PlanType = keyof typeof PLANS;