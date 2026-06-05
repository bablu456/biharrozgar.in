'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Mail, Phone } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { BIHAR_DISTRICTS } from '@/constants/districts';
import { getDashboardRoute } from '@/lib/auth';
import { registerUser } from '@/lib/api-auth';

type RegistrationMethod = 'email' | 'phone';
type AccountRole = 'seeker' | 'employer';

const districtOptions = BIHAR_DISTRICTS.map((district) => ({
  value: district.slug,
  label: district.name.trim(),
}));

function getMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Unable to create your account. Please try again.';
}

export default function RegisterPage() {
  const router = useRouter();
  const [method, setMethod] = useState<RegistrationMethod | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: 'seeker' as AccountRole,
    district: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Password and confirm password must match.');
      return;
    }

    setLoading(true);
    try {
      const data = await registerUser({
        full_name: formData.fullName,
        email: formData.email,
        phone_number: formData.phone,
        password: formData.password,
        role: formData.role,
        district: formData.district,
      });
      router.push(getDashboardRoute(data.profile.role));
    } catch (err) {
      setError(getMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-lg w-full">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-12 h-12 bg-bihar-green rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-2xl">BR</span>
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Create your Bihar Rozgar account</h1>
          <p className="text-gray-600 mt-2">
            Register with verified contact details and a complete profile
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          {!method ? (
            <div className="space-y-4">
              <RegistrationChoice
                icon={<Mail className="w-6 h-6" />}
                title="Register with Gmail (Email)"
                description="Open the detailed registration form with email first"
                onClick={() => setMethod('email')}
              />
              <RegistrationChoice
                icon={<Phone className="w-6 h-6" />}
                title="Register with Phone Number"
                description="Open the detailed registration form with phone first"
                onClick={() => setMethod('phone')}
              />
              <p className="text-xs text-center text-gray-500 pt-2">
                Both options require your complete details. There is no one-click signup.
              </p>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <button
                type="button"
                onClick={() => {
                  setMethod(null);
                  setError('');
                }}
                className="inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-bihar-green"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>

              <div>
                <h2 className="text-lg font-semibold text-gray-900">Detailed Registration Form</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {method === 'email'
                    ? 'Email registration selected. Complete all fields below.'
                    : 'Phone registration selected. Complete all fields below.'}
                </p>
              </div>

              <Input
                label="Full Name"
                autoComplete="name"
                value={formData.fullName}
                onChange={(event) => updateField('fullName', event.target.value)}
                placeholder="Enter your full name"
                required
              />

              {method === 'email' ? (
                <>
                  <EmailField value={formData.email} onChange={(value) => updateField('email', value)} />
                  <PhoneField value={formData.phone} onChange={(value) => updateField('phone', value)} />
                </>
              ) : (
                <>
                  <PhoneField value={formData.phone} onChange={(value) => updateField('phone', value)} />
                  <EmailField value={formData.email} onChange={(value) => updateField('email', value)} />
                </>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Account Type"
                  value={formData.role}
                  onChange={(event) => updateField('role', event.target.value)}
                  options={[
                    { value: 'seeker', label: 'Job Seeker' },
                    { value: 'employer', label: 'Employer' },
                  ]}
                />
                <Select
                  label="District"
                  value={formData.district}
                  onChange={(event) => updateField('district', event.target.value)}
                  options={districtOptions}
                  placeholder="Select district"
                  required
                />
              </div>

              <Input
                label="Password"
                type="password"
                autoComplete="new-password"
                value={formData.password}
                onChange={(event) => updateField('password', event.target.value)}
                placeholder="Create a strong password"
                hint="Use 8+ characters with uppercase, lowercase, number, and special character."
                minLength={8}
                required
              />
              <Input
                label="Confirm Password"
                type="password"
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={(event) => updateField('confirmPassword', event.target.value)}
                placeholder="Re-enter your password"
                minLength={8}
                required
              />

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" loading={loading}>
                Create Account <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </form>
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

function RegistrationChoice({
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

function EmailField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <Input
      label="Email Address"
      type="email"
      autoComplete="email"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder="you@example.com"
      required
    />
  );
}

function PhoneField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <Input
      label="Phone Number"
      type="tel"
      autoComplete="tel"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder="+91 9876543210"
      required
    />
  );
}
