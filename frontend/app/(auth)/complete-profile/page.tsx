'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { BIHAR_DISTRICTS } from '@/constants/districts';
import {
  getDashboardRoute,
  getRegistrationNameForRole,
  isProfileComplete,
} from '@/lib/auth';
import { createClient } from '@/lib/supabase';

type AccountRole = 'seeker' | 'employer';

const districtOptions = BIHAR_DISTRICTS.map((district) => ({
  value: district.slug,
  label: district.name.trim(),
}));

export default function CompleteProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preferredRole = searchParams.get('role') === 'employer' ? 'employer' : 'seeker';

  const [role, setRole] = useState<AccountRole>(preferredRole);
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [district, setDistrict] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        router.replace('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, role, district')
        .eq('id', session.user.id)
        .single();

      if (profile?.role === 'admin') {
        router.replace('/dashboard/admin');
        return;
      }

      if (isProfileComplete(profile)) {
        router.replace(getDashboardRoute(profile?.role));
        return;
      }

      const metadata = session.user.user_metadata ?? {};
      setRole(profile?.role === 'employer' ? 'employer' : preferredRole);
      setFullName(profile?.full_name || metadata.full_name || metadata.name || '');
      setCompanyName(profile?.full_name || '');
      setDistrict(profile?.district || '');
      setLoading(false);
    };

    loadProfile();
  }, [preferredRole, router]);

  const handleCompleteProfile = async () => {
    const trimmedName = getRegistrationNameForRole(role, {
      full_name: fullName,
      company_name: companyName,
    });

    if (!trimmedName) {
      setError(
        role === 'employer'
          ? 'Please enter your company name.'
          : 'Please enter your full name.'
      );
      return;
    }

    if (!district) {
      setError('Please select your district.');
      return;
    }

    setSaving(true);
    setError('');

    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      router.replace('/login');
      return;
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        full_name: trimmedName,
        role,
        district,
      })
      .eq('id', session.user.id);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    router.push(getDashboardRoute(role));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-bihar-green border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-12 h-12 bg-bihar-green rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-2xl">BR</span>
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Complete your profile</h1>
          <p className="text-gray-600 mt-2">
            Finish these details to continue with your Google account.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRole('seeker')}
              className={`rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all ${
                role === 'seeker'
                  ? 'border-bihar-green bg-bihar-green-bg text-bihar-green'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              I want a job
            </button>
            <button
              type="button"
              onClick={() => setRole('employer')}
              className={`rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all ${
                role === 'employer'
                  ? 'border-bihar-green bg-bihar-green-bg text-bihar-green'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              I want to hire
            </button>
          </div>

          {role === 'employer' ? (
            <Input
              label="Company / Business Name"
              value={companyName}
              onChange={(event) => setCompanyName(event.target.value)}
              placeholder="Enter your company name"
            />
          ) : (
            <Input
              label="Full Name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Enter your full name"
            />
          )}

          <Select
            label="District"
            value={district}
            onChange={(event) => setDistrict(event.target.value)}
            options={districtOptions}
            placeholder="Select district"
          />

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <Button className="w-full" onClick={handleCompleteProfile} loading={saving}>
            Save and continue
          </Button>
        </div>
      </div>
    </div>
  );
}
