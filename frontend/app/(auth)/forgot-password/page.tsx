'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, KeyRound, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { requestForgotPasswordOtp, resetPasswordWithOtp } from '@/lib/api-auth';

type ForgotPasswordStep = 'request' | 'reset';

function getMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unable to complete request. Please try again.';
}

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<ForgotPasswordStep>('request');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [debugOtp, setDebugOtp] = useState('');

  const handleRequestOtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const data = await requestForgotPasswordOtp(email);
      setDebugOtp(data.debug_otp_code ?? '');
      setStep('reset');
      setSuccess('If an account exists, an OTP has been sent to your email.');
    } catch (err) {
      setError(getMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await resetPasswordWithOtp(email, otp, newPassword);
      setSuccess('Password successfully reset. You can now login.');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err) {
      setError(getMessage(err));
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
          <h1 className="text-2xl font-bold text-gray-900">Forgot Password</h1>
          <p className="text-gray-600 mt-2">Reset your account password</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          {step === 'request' && (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
              />
              <p className="text-sm text-gray-500">We will send a 6-digit OTP to your email to verify your identity.</p>
              {error && <ErrorMessage message={error} />}
              <Button type="submit" className="w-full" loading={loading}>
                Send OTP <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </form>
          )}

          {step === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <button
                type="button"
                onClick={() => setStep('request')}
                className="inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-bihar-green mb-2"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              
              <Input
                label="Email Address"
                type="email"
                value={email}
                disabled
              />
              
              <Input
                label="Enter OTP"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={otp}
                onChange={(event) => setOtp(event.target.value.replace(/\D/g, ''))}
                placeholder="Enter 6-digit OTP"
                className="text-center text-2xl tracking-widest"
                maxLength={6}
                required
              />

              <Input
                label="New Password"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="Enter new password"
                required
              />
              <p className="text-xs text-gray-500">Password must be at least 8 characters, with 1 uppercase, 1 number, and 1 special character.</p>
              
              {debugOtp && (
                <p className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-800">
                  Development OTP: <strong>{debugOtp}</strong>
                </p>
              )}
              
              {error && <ErrorMessage message={error} />}
              {success && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                  {success}
                </div>
              )}
              
              <Button type="submit" className="w-full" loading={loading}>
                Reset Password
              </Button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Remember your password?{' '}
          <Link href="/login" className="text-bihar-green font-medium hover:underline">
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
}

function ErrorMessage({ message }: { message: string }) {
  if (!message) return null;

  return (
    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
      {message}
    </div>
  );
}
