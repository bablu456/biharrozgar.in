import { Category } from '@/types';

export const JOB_CATEGORIES: Category[] = [
  { id: 1, name_en: 'Coaching & Tutoring', name_hi: 'कोचिंग और ट्यूशन', icon: 'GraduationCap', slug: 'coaching' },
  { id: 2, name_en: 'Retail & Sales', name_hi: 'रेटेल और सेल्स', icon: 'ShoppingBag', slug: 'retail' },
  { id: 3, name_en: 'Services', name_hi: 'सेवाएं', icon: 'Briefcase', slug: 'services' },
  { id: 4, name_en: 'Daily Wage', name_hi: 'दैनिक मजदूरी', icon: 'Clock', slug: 'daily-wage' },
  { id: 5, name_en: 'Tech & IT', name_hi: 'टेक और आईटी', icon: 'Laptop', slug: 'tech' },
  { id: 6, name_en: 'Government', name_hi: 'सरकारी नौकरी', icon: 'Building2', slug: 'government' },
  { id: 7, name_en: 'Delivery', name_hi: 'डिलीवरी', icon: 'Truck', slug: 'delivery' },
  { id: 8, name_en: 'Security', name_hi: 'सुरक्षा', icon: 'Shield', slug: 'security' },
  { id: 9, name_en: 'Healthcare', name_hi: 'स्वास्थ्य सेवा', icon: 'Heart', slug: 'healthcare' },
  { id: 10, name_en: 'Hospitality', name_hi: 'आतिथ्य', icon: 'Hotel', slug: 'hospitality' },
  { id: 11, name_en: 'Factory & Manufacturing', name_hi: 'फैक्ट्री और विनिर्माण', icon: 'Factory', slug: 'factory' },
  { id: 12, name_en: 'Other', name_hi: 'अन्य', icon: 'MoreHorizontal', slug: 'other' },
] as const;

export const JOB_TYPES = [
  { value: 'full-time', label_en: 'Full Time', label_hi: 'पूर्णकालिक' },
  { value: 'part-time', label_en: 'Part Time', label_hi: 'पार्ट-टाइम' },
  { value: 'contract', label_en: 'Contract', label_hi: 'अनुबंध' },
  { value: 'internship', label_en: 'Internship', label_hi: 'इंटर्नशिप' },
  { value: 'daily-wage', label_en: 'Daily Wage', label_hi: 'दैनिक मजदूरी' },
] as const;

export type JobTypeValue = typeof JOB_TYPES[number]['value'];