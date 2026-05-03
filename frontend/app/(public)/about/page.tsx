'use client';

import Link from 'next/link';
import { Target, Users, MapPin, Heart } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            About बिहरोज़गार Portal
          </h1>
          <p className="text-xl text-gray-600">
            Bihar&apos;s trusted local job platform
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h2>
          <p className="text-gray-600 leading-relaxed">
            We believe every Bihar resident deserves access to quality employment opportunities. 
            बिहरोज़गार Portal connects job seekers with local employers across all 38 districts 
            of Bihar - from Patna to Purnia, Gaya to Darbhanga.
          </p>
          <p className="text-gray-600 leading-relaxed mt-4">
            Our WhatsApp-first approach makes it easy for everyone to apply for jobs directly 
            from their phones, without complicated forms or applications.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="w-12 h-12 bg-bihar-green-bg rounded-full flex items-center justify-center mb-4">
              <Target className="w-6 h-6 text-bihar-green" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Our Vision</h3>
            <p className="text-gray-600">
              To become Bihar&apos;s largest and most trusted job portal, helping millions 
              find meaningful employment in their home state.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="w-12 h-12 bg-bihar-green-bg rounded-full flex items-center justify-center mb-4">
              <Heart className="w-6 h-6 text-bihar-green" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Our Values</h3>
            <p className="text-gray-600">
              Transparency, accessibility, and community-first approach. We prioritize 
              local jobs for local people.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Why Choose Us?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-bihar-green mb-2">50k+</div>
              <div className="text-gray-600">Job Seekers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-bihar-green mb-2">1000+</div>
              <div className="text-gray-600">Employers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-bihar-green mb-2">5000+</div>
              <div className="text-gray-600">Jobs Posted</div>
            </div>
          </div>
        </div>

        <div className="bg-bihar-yellow-light rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Join the Bihar Jobs Revolution</h2>
          <p className="text-gray-600 mb-6">
            Whether you&apos;re looking for a job or want to hire talent, we&apos;re here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg">Get Started</Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" size="lg">Contact Us</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}