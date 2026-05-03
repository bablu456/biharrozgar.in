'use client';

import Link from 'next/link';
import { Phone, Mail, MapPin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-bihar-green rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">बी</span>
              </div>
              <div>
                <span className="text-lg font-bold text-white">बिहरोज़गार</span>
                <span className="text-xs text-bihar-green block -mt-1">Bihar Jobs</span>
              </div>
            </div>
            <p className="text-gray-400 mb-4 max-w-md">
              Bihar&apos;s largest local job portal. Connecting job seekers with 
              opportunities across Patna and all 38 districts of Bihar.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4" />
                <span>+91 91626 40000</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4" />
                <span>info@biharrozgar.in</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4" />
                <span>Patna, Bihar</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">For Job Seekers</h3>
            <ul className="space-y-2">
              <li><Link href="/jobs" className="hover:text-bihar-green">Search Jobs</Link></li>
              <li><Link href="/register" className="hover:text-bihar-green">Create Profile</Link></li>
              <li><Link href="/jobs?fresher=true" className="hover:text-bihar-green">Fresher Jobs</Link></li>
              <li><Link href="/jobs?type=daily-wage" className="hover:text-bihar-green">Daily Wage</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">For Employers</h3>
            <ul className="space-y-2">
              <li><Link href="/register?role=employer" className="hover:text-bihar-green">Post a Job</Link></li>
              <li><Link href="/pricing" className="hover:text-bihar-green">Pricing</Link></li>
              <li><Link href="/about" className="hover:text-bihar-green">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-bihar-green">Contact</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Bihar Rozgar Portal. All rights reserved.
          </p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <Link href="/privacy" className="text-sm text-gray-500 hover:text-gray-400">Privacy</Link>
            <Link href="/terms" className="text-sm text-gray-500 hover:text-gray-400">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}