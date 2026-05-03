'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Briefcase, Phone, User } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import {
  buildAuthCallbackUrl,
  getDashboardRoute,
  getRegistrationNameForRole,
} from '@/lib/auth';
import { requestRegisterOtp, verifyRegisterOtp } from '@/lib/api-auth';

type AccountRole = 'seeker' | 'employer';

function GoogleIcon() {
  return (
    <svg aria-hidden="true" className="w-5 h-5" viewBox="0 0 24 24">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.9-5.5 3.9-3.3 0-6.1-2.8-6.1-6.2s2.8-6.2 6.1-6.2c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.8 2.8 14.6 2 12 2 6.9 2 2.8 6.3 2.8 11.8S6.9 21.6 12 21.6c6.9 0 9.1-4.9 9.1-7.4 0-.5-.1-.9-.1-1.3H12Z"
      />
      <path
        fill="#34A853"
        d="M2.8 7.4 6 9.8c.9-2 3-4.2 6-4.2 1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.8 2.8 14.6 2 12 2 8 2 4.6 4.2 2.8 7.4Z"
      />
      <path
        fill="#FBBC05"
        d="M12 21.6c2.5 0 4.7-.8 6.3-2.3l-3.1-2.5c-.8.6-1.9 1.2-3.2 1.2-3.9 0-5.3-2.6-5.5-3.9l-3.1 2.4c1.8 3.4 5.2 5.7 8.6 5.7Z"
      />
      <path
        fill="#4285F4"
        d="M21.1 14.2c.1-.4.1-.8.1-1.3 0-.4 0-.8-.1-1.2H12v3.9h5.5c-.3 1.3-1.2 2.5-2.3 3.3l3.1 2.5c1.8-1.7 2.8-4.2 2.8-7.2Z"
      />
    </svg>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<'role' | 'phone' | 'otp' | 'profile'>('role');
  const [role, setRole] = useState<AccountRole>('seeker');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [formData, setFormData] = useState({
    full_name: '',
    company_name: '',
    district: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (searchParams.get('error') === 'google-login-failed') {
      setError('Google signup could not be completed. Please try again.');
    }
  }, [searchParams]);

  const handleGoogleRegister = async () => {
    setError('Google signup is temporarily disabled. Please use phone OTP.');
  };

  const handleSendOTP = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const fullPhone = phone.startsWith('+91') ? phone : `+91${phone}`;
      await requestRegisterOtp(fullPhone);
      setStep('otp');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (event: React.FormEvent) => {
    event.preventDefault();
    setStep('profile');
  };

  const handleProfileComplete = async () => {
    const trimmedName = getRegistrationNameForRole(role, formData);

    if (!trimmedName) {
      setError(
        role === 'employer'
          ? 'Please enter your company name.'
          : 'Please enter your full name.'
      );
      return;
    }

    if (!formData.district) {
      setError('Please select your district.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const fullPhone = phone.startsWith('+91') ? phone : `+91${phone}`;
      const data = await verifyRegisterOtp({
        phone: fullPhone,
        otp_code: otp,
        full_name: trimmedName,
        role: role as any,
        district: formData.district,
      });

      if (data.profile) {
        router.push(getDashboardRoute(role));
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-12 h-12 bg-bihar-green rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-2xl">BR</span>
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
          <p className="text-gray-600 mt-2">Join Bihar Rozgar Portal</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          {step === 'role' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 mb-4">I want to:</p>
              <button
                onClick={() => {
                  setRole('seeker');
                  setStep('phone');
                  setError('');
                }}
                className={`w-full p-4 border-2 rounded-xl flex items-center gap-4 transition-all ${
                  role === 'seeker'
                    ? 'border-bihar-green bg-bihar-green-bg'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="w-12 h-12 bg-bihar-green-bg rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-bihar-green" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-gray-900">Find Jobs</div>
                  <div className="text-sm text-gray-500">Search and apply for jobs</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setRole('employer');
                  setStep('phone');
                  setError('');
                }}
                className={`w-full p-4 border-2 rounded-xl flex items-center gap-4 transition-all ${
                  role === 'employer'
                    ? 'border-bihar-green bg-bihar-green-bg'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="w-12 h-12 bg-bihar-green-bg rounded-full flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-bihar-green" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-gray-900">Post Jobs</div>
                  <div className="text-sm text-gray-500">Hire candidates for my company</div>
                </div>
              </button>

              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-3 text-gray-500">Or use Google</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full border-gray-300 text-gray-700 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900"
                onClick={handleGoogleRegister}
                loading={loading}
              >
                <GoogleIcon />
                <span className="ml-2">Continue with Google</span>
              </Button>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {error}
                </div>
              )}
            </div>
          )}

          {step === 'phone' && (
            <form onSubmit={handleSendOTP}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="tel"
                    placeholder="+91 9876543210"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" loading={loading}>
                Send OTP
              </Button>

              <button
                type="button"
                onClick={() => {
                  setStep('role');
                  setError('');
                }}
                className="w-full mt-3 text-sm text-gray-500 hover:text-gray-700"
              >
                Back
              </button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleVerifyOTP}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter OTP
                </label>
                <Input
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(event) => setOtp(event.target.value)}
                  className="text-center text-2xl tracking-widest"
                  maxLength={6}
                  required
                />
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" loading={loading}>
                Verify OTP
              </Button>

              <button
                type="button"
                onClick={() => {
                  setStep('phone');
                  setOtp('');
                  setError('');
                }}
                className="w-full mt-3 text-sm text-gray-500 hover:text-gray-700"
              >
                Change phone number
              </button>
            </form>
          )}

          {step === 'profile' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 mb-4">
                {role === 'employer' ? 'Company Details' : 'Your Details'}
              </h3>

              {role === 'seeker' ? (
                <Input
                  label="Your Full Name"
                  value={formData.full_name}
                  onChange={(event) =>
                    setFormData({ ...formData, full_name: event.target.value })
                  }
                  placeholder="Enter your name"
                />
              ) : (
                <Input
                  label="Company / Business Name"
                  value={formData.company_name}
                  onChange={(event) =>
                    setFormData({ ...formData, company_name: event.target.value })
                  }
                  placeholder="Enter company name"
                />
              )}

              <Select
                label="District"
                value={formData.district}
                onChange={(event) =>
                  setFormData({ ...formData, district: event.target.value })
                }
                options={[
                  { value: 'patna', label: 'Patna' },
                  { value: 'gaya', label: 'Gaya' },
                  { value: 'bhagalpur', label: 'Bhagalpur' },
                  { value: 'muzaffarpur', label: 'Muzaffarpur' },
                  { value: 'darbhanga', label: 'Darbhanga' },
                  { value: 'other', label: 'Other' },
                ]}
                placeholder="Select District"
              />

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {error}
                </div>
              )}

              <Button onClick={handleProfileComplete} className="w-full" loading={loading}>
                Complete Registration
              </Button>
            </div>
          )}
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-bihar-green font-medium hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
