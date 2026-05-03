'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, Phone } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { buildAuthCallbackUrl, getDashboardRoute } from '@/lib/auth';
import { requestLoginOtp, verifyLoginOtp } from '@/lib/api-auth';

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

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (searchParams.get('error') === 'google-login-failed') {
      setError('Google login could not be completed. Please try again.');
    }
  }, [searchParams]);

  const handleGoogleLogin = async () => {
    // OAuth needs more work for the custom backend, keeping placeholder
    setError('Google login is temporarily disabled. Please use phone OTP.');
  };

  const handleSendOTP = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const fullPhone = phone.startsWith('+91') ? phone : `+91${phone}`;
      await requestLoginOtp(fullPhone);
      setOtpSent(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const fullPhone = phone.startsWith('+91') ? phone : `+91${phone}`;
      const data = await verifyLoginOtp(fullPhone, otp);
      
      if (data.profile) {
        router.push(getDashboardRoute(data.profile.role));
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
          <h1 className="text-2xl font-bold text-gray-900">Login to Bihar Rozgar</h1>
          <p className="text-gray-600 mt-2">Use Google or your phone number to continue</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          {!otpSent ? (
            <>
              <Button
                type="button"
                variant="outline"
                className="w-full border-gray-300 text-gray-700 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900"
                onClick={handleGoogleLogin}
                loading={loading}
              >
                <GoogleIcon />
                <span className="ml-2">Continue with Google</span>
              </Button>

              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-3 text-gray-500">Or continue with phone</span>
                </div>
              </div>

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
                  <p className="text-sm text-gray-500 mt-1">
                    We&apos;ll send a verification code to your phone
                  </p>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full" loading={loading}>
                  Send OTP <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </form>
            </>
          ) : (
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
                <p className="text-sm text-gray-500 mt-1">Code sent to {phone}</p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" loading={loading}>
                Verify and Login
              </Button>

              <button
                type="button"
                onClick={() => {
                  setOtpSent(false);
                  setOtp('');
                  setError('');
                }}
                className="w-full mt-3 text-sm text-gray-500 hover:text-gray-700"
              >
                Change phone number
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-bihar-green font-medium hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
