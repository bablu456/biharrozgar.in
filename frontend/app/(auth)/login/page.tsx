'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, KeyRound, Mail, Phone } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { getDashboardRoute } from '@/lib/auth';
import {
  loginWithPassword,
  requestEmailLoginOtp,
  requestPhoneLoginOtp,
  verifyEmailLoginOtp,
  verifyPhoneLoginOtp,
} from '@/lib/api-auth';

type LoginStep =
  | 'method'
  | 'email-method'
  | 'email-password'
  | 'email-otp'
  | 'phone-otp';

function getMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unable to complete login. Please try again.';
}

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<LoginStep>('method');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [debugOtp, setDebugOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const resetStatus = () => {
    setError('');
    setOtp('');
    setOtpSent(false);
    setDebugOtp('');
  };

  const goTo = (nextStep: LoginStep) => {
    resetStatus();
    setStep(nextStep);
  };

  const finishLogin = (role?: string | null) => {
    router.push(getDashboardRoute(role));
  };

  const handlePasswordLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await loginWithPassword(email, password);
      finishLogin(data.profile.role);
    } catch (err) {
      setError(getMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleRequestEmailOtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await requestEmailLoginOtp(email);
      setDebugOtp(data.debug_otp_code ?? '');
      setOtpSent(true);
    } catch (err) {
      setError(getMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmailOtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await verifyEmailLoginOtp(email, otp);
      finishLogin(data.profile.role);
    } catch (err) {
      setError(getMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPhoneOtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await requestPhoneLoginOtp(phone);
      setDebugOtp(data.debug_otp_code ?? '');
      setOtpSent(true);
    } catch (err) {
      setError(getMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPhoneOtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await verifyPhoneLoginOtp(phone, otp);
      finishLogin(data.profile.role);
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
          <h1 className="text-2xl font-bold text-gray-900">Login to Bihar Rozgar</h1>
          <p className="text-gray-600 mt-2">Choose email or phone to access your account</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          {step === 'method' && (
            <div className="space-y-4">
              <AuthChoice
                icon={<Mail className="w-6 h-6" />}
                title="Login with Gmail (Email)"
                description="Use an email OTP or your password"
                onClick={() => goTo('email-method')}
              />
              <AuthChoice
                icon={<Phone className="w-6 h-6" />}
                title="Login with Phone Number"
                description="Receive a secure OTP on your phone"
                onClick={() => goTo('phone-otp')}
              />
            </div>
          )}

          {step === 'email-method' && (
            <div className="space-y-4">
              <BackButton onClick={() => goTo('method')} />
              <h2 className="text-lg font-semibold text-gray-900">Choose email login method</h2>
              <AuthChoice
                icon={<Mail className="w-6 h-6" />}
                title="Login with OTP"
                description="Send a one-time password to your email"
                onClick={() => goTo('email-otp')}
              />
              <AuthChoice
                icon={<KeyRound className="w-6 h-6" />}
                title="Login with Password"
                description="Use your email and account password"
                onClick={() => goTo('email-password')}
              />
            </div>
          )}

          {step === 'email-password' && (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <BackButton onClick={() => goTo('email-method')} />
              <Input
                label="Email Address"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
              />
              <div className="space-y-1">
                <Input
                  label="Password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  required
                />
                <div className="flex justify-end">
                  <Link 
                    href="/forgot-password" 
                    className="text-xs text-gray-500 hover:text-bihar-green hover:underline"
                  >
                    Forgot Password?
                  </Link>
                </div>
              </div>
              <ErrorMessage message={error} />
              <Button type="submit" className="w-full" loading={loading}>
                Login with Password <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </form>
          )}

          {step === 'email-otp' && (
            <OtpLoginForm
              label="Email Address"
              type="email"
              value={email}
              otp={otp}
              otpSent={otpSent}
              debugOtp={debugOtp}
              error={error}
              loading={loading}
              placeholder="you@example.com"
              onValueChange={setEmail}
              onOtpChange={setOtp}
              onRequest={handleRequestEmailOtp}
              onVerify={handleVerifyEmailOtp}
              onBack={() => goTo('email-method')}
              onChangeRecipient={resetStatus}
            />
          )}

          {step === 'phone-otp' && (
            <OtpLoginForm
              label="Phone Number"
              type="tel"
              value={phone}
              otp={otp}
              otpSent={otpSent}
              debugOtp={debugOtp}
              error={error}
              loading={loading}
              placeholder="+91 9876543210"
              onValueChange={setPhone}
              onOtpChange={setOtp}
              onRequest={handleRequestPhoneOtp}
              onVerify={handleVerifyPhoneOtp}
              onBack={() => goTo('method')}
              onChangeRecipient={resetStatus}
            />
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

function AuthChoice({
  icon,
  title,
  description,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full p-4 border-2 border-gray-200 rounded-xl flex items-center gap-4 text-left transition-all hover:border-bihar-green hover:bg-bihar-green-bg"
    >
      <span className="w-12 h-12 bg-bihar-green-bg rounded-full flex items-center justify-center text-bihar-green">
        {icon}
      </span>
      <span className="flex-1">
        <span className="block font-semibold text-gray-900">{title}</span>
        <span className="block text-sm text-gray-500 mt-0.5">{description}</span>
      </span>
      <ArrowRight className="w-5 h-5 text-gray-400" />
    </button>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-bihar-green"
    >
      <ArrowLeft className="w-4 h-4" /> Back
    </button>
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

function OtpLoginForm({
  label,
  type,
  value,
  otp,
  otpSent,
  debugOtp,
  error,
  loading,
  placeholder,
  onValueChange,
  onOtpChange,
  onRequest,
  onVerify,
  onBack,
  onChangeRecipient,
}: {
  label: string;
  type: 'email' | 'tel';
  value: string;
  otp: string;
  otpSent: boolean;
  debugOtp: string;
  error: string;
  loading: boolean;
  placeholder: string;
  onValueChange: (value: string) => void;
  onOtpChange: (value: string) => void;
  onRequest: (event: FormEvent<HTMLFormElement>) => void;
  onVerify: (event: FormEvent<HTMLFormElement>) => void;
  onBack: () => void;
  onChangeRecipient: () => void;
}) {
  if (!otpSent) {
    return (
      <form onSubmit={onRequest} className="space-y-4">
        <BackButton onClick={onBack} />
        <Input
          label={label}
          type={type}
          autoComplete={type === 'email' ? 'email' : 'tel'}
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          placeholder={placeholder}
          required
        />
        <p className="text-sm text-gray-500">We will send a 6-digit one-time password.</p>
        <ErrorMessage message={error} />
        <Button type="submit" className="w-full" loading={loading}>
          Send OTP
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={onVerify} className="space-y-4">
      <BackButton onClick={onChangeRecipient} />
      <Input
        label="Enter OTP"
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        value={otp}
        onChange={(event) => onOtpChange(event.target.value.replace(/\D/g, ''))}
        placeholder="Enter 6-digit OTP"
        className="text-center text-2xl tracking-widest"
        maxLength={6}
        required
      />
      <p className="text-sm text-gray-500">Code sent to {value}</p>
      {debugOtp && (
        <p className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-800">
          Development OTP: <strong>{debugOtp}</strong>
        </p>
      )}
      <ErrorMessage message={error} />
      <Button type="submit" className="w-full" loading={loading}>
        Verify and Login
      </Button>
    </form>
  );
}
