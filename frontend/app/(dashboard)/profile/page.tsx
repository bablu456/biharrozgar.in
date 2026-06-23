'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { 
  User, 
  Briefcase, 
  Mail, 
  Phone, 
  MapPin, 
  Loader2, 
  Save, 
  GraduationCap, 
  CreditCard, 
  Shield, 
  Settings, 
  Camera, 
  ChevronRight, 
  CheckCircle,
  ExternalLink,
  DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ProfileResponse {
  name: string | null;
  email: string;
  phone: string | null;
  district: string | null;
  city: string | null;
  gender: string | null;
  education: string | null;
  bio: string | null;
  skills: string[] | null;
  experience_years: number | null;
  resume_url: string | null;
}

import { Suspense } from 'react';

export default function ProfilePage() {
  return (
    // Next.js requires any component using 'useSearchParams' to be wrapped in a Suspense boundary 
    // to ensure client-side rendering doesn't break static generation.
    <Suspense fallback={<div className="flex h-[70vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>}>
      <ProfileContent />
    </Suspense>
  );
}

function ProfileContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Get active tab from URL search param, default to 'profile'
  const activeTab = searchParams.get('tab') || 'profile';
  
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    district: '',
    gender: '',
    education: '',
    bio: '',
    skills: '', 
    experience_years: '',
  });

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await apiFetch<ProfileResponse>('/profile/me');
        setProfile(data);
        setFormData({
          name: data.name || '',
          city: data.city || '',
          district: data.district || '',
          gender: data.gender || '',
          education: data.education || '',
          bio: data.bio || '',
          skills: data.skills ? data.skills.join(', ') : '',
          experience_years: data.experience_years?.toString() || '',
        });
      } catch (err) {
        setMessage({ type: 'error', text: 'Failed to load profile data.' });
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const setTab = (tabName: string) => {
    const params = new URLSearchParams(window.location.search);
    params.set('tab', tabName);
    router.push(`${window.location.pathname}?${params.toString()}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const payload = {
      full_name: formData.name || null,
      city: formData.city || null,
      district: formData.district || null,
      gender: formData.gender || null,
      education: formData.education || null,
      bio: formData.bio || null,
      skills: formData.skills ? formData.skills.split(',').map((s) => s.trim()).filter(Boolean) : null,
      experience_years: formData.experience_years ? parseInt(formData.experience_years, 10) : null,
    };

    try {
      const data = await apiFetch<ProfileResponse>('/profile/me', {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      setProfile(data);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const displayName = profile?.name || 'User';

  return (
    <div className="min-h-screen bg-gray-50/50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        
        {/* Cover / Profile Banner Card */}
        <div className="relative overflow-hidden rounded-3xl border border-gray-200/80 bg-white shadow-sm mb-8">
          <div className="h-44 w-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-400 relative">
            {/* Simple organic background shapes for premium look */}
            <div className="absolute right-10 top-5 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
            <div className="absolute left-1/3 bottom-2 w-64 h-32 bg-indigo-300/20 rounded-full blur-xl"></div>
          </div>
          
          <div className="px-6 pb-6 pt-0 relative flex flex-col sm:flex-row items-center sm:items-end gap-6 -mt-16 sm:-mt-10">
            {/* Avatar block */}
            <div className="relative group">
              <div className="w-28 h-28 rounded-2xl bg-indigo-750 text-white flex items-center justify-center font-bold text-3xl shadow-lg border-4 border-white">
                {profile?.name ? getInitials(profile.name) : 'U'}
              </div>
              <button className="absolute bottom-1 right-1 p-1.5 rounded-lg bg-gray-900 text-white hover:bg-indigo-600 transition-colors shadow-md">
                <Camera className="w-4 h-4" />
              </button>
            </div>
            
            {/* Profile Brief Info */}
            <div className="text-center sm:text-left flex-1 pb-2">
              <h1 className="text-2xl font-extrabold text-gray-950 flex items-center justify-center sm:justify-start gap-2">
                {displayName}
                <CheckCircle className="w-5 h-5 text-indigo-500 fill-indigo-100" />
              </h1>
              <p className="text-sm text-gray-500 font-medium mt-0.5">{profile?.email}</p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-3 text-xs text-gray-500 font-semibold">
                {profile?.phone && (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100/80">
                    <Phone className="w-3.5 h-3.5" /> {profile.phone}
                  </span>
                )}
                {profile?.city && (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100/80">
                    <MapPin className="w-3.5 h-3.5" /> {profile.city}, {profile.district || 'Bihar'}
                  </span>
                )}
              </div>
            </div>

            {/* Premium Logo inside Profile Header */}
            <div className="hidden lg:flex items-center gap-2 px-4 py-2 border border-indigo-100 bg-indigo-50/30 rounded-2xl">
              <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">बी</span>
              </div>
              <div>
                <span className="text-xs font-bold text-gray-900 block leading-none">बिहारोज़गार</span>
                <span className="text-[8px] font-semibold text-indigo-600 uppercase block tracking-wider mt-0.5">Verified</span>
              </div>
            </div>
          </div>
        </div>

        {/* Global Action Message */}
        {message && (
          <div
            className={`rounded-2xl border p-4 mb-6 backdrop-blur-sm transition-all animate-in fade-in slide-in-from-top-2 duration-300 ${
              message.type === 'success'
                ? 'border-emerald-100 bg-emerald-50/50 text-emerald-850'
                : 'border-red-100 bg-red-50/50 text-red-850'
            }`}
          >
            <p className="text-sm font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-current animate-pulse"></span>
              {message.text}
            </p>
          </div>
        )}

        {/* Grid Layout: Sidebar Navigation + Tab Contents */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Sidebar Menu */}
          <div className="lg:col-span-3 space-y-2">
            <button
              onClick={() => setTab('profile')}
              className={`flex w-full items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                activeTab === 'profile'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                  : 'bg-white text-gray-650 hover:bg-gray-100/85 hover:text-gray-900 border border-gray-200/50'
              }`}
            >
              <span className="flex items-center gap-3">
                <User className="w-4.5 h-4.5" />
                My Profile
              </span>
              <ChevronRight className="w-4 h-4 opacity-70" />
            </button>

            <button
              onClick={() => setTab('payment')}
              className={`flex w-full items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                activeTab === 'payment'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                  : 'bg-white text-gray-650 hover:bg-gray-100/85 hover:text-gray-900 border border-gray-200/50'
              }`}
            >
              <span className="flex items-center gap-3">
                <CreditCard className="w-4.5 h-4.5" />
                Payments & Billing
              </span>
              <ChevronRight className="w-4 h-4 opacity-70" />
            </button>

            <button
              onClick={() => setTab('security')}
              className={`flex w-full items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                activeTab === 'security'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                  : 'bg-white text-gray-650 hover:bg-gray-100/85 hover:text-gray-900 border border-gray-200/50'
              }`}
            >
              <span className="flex items-center gap-3">
                <Shield className="w-4.5 h-4.5" />
                Security Settings
              </span>
              <ChevronRight className="w-4 h-4 opacity-70" />
            </button>

            <button
              onClick={() => setTab('preferences')}
              className={`flex w-full items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                activeTab === 'preferences'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                  : 'bg-white text-gray-650 hover:bg-gray-100/85 hover:text-gray-900 border border-gray-200/50'
              }`}
            >
              <span className="flex items-center gap-3">
                <Settings className="w-4.5 h-4.5" />
                System Preferences
              </span>
              <ChevronRight className="w-4 h-4 opacity-70" />
            </button>
          </div>

          {/* Active Tab Content Area */}
          <div className="lg:col-span-9">
            
            {/* TAB 1: PROFILE FORM */}
            {activeTab === 'profile' && (
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Personal Information */}
                <div className="bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-8 shadow-sm">
                  <div className="flex items-center gap-3 border-b border-gray-100 pb-5 mb-6">
                    <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900">Personal Information</h3>
                      <p className="text-xs text-gray-400 font-medium">Update your core personal details.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Full Name</label>
                      <input
                        type="text"
                        name="name"
                        id="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="mt-2 block w-full rounded-xl border-gray-200 py-3 px-4 text-gray-900 shadow-sm focus:border-indigo-600 focus:ring-indigo-600 text-sm transition-all"
                        placeholder="e.g. Rahul Kumar"
                      />
                    </div>

                    <div>
                      <label htmlFor="gender" className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Gender</label>
                      <select
                        name="gender"
                        id="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        className="mt-2 block w-full rounded-xl border-gray-200 py-3 px-4 text-gray-950 shadow-sm focus:border-indigo-600 focus:ring-indigo-600 text-sm transition-all bg-white"
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="city" className="block text-xs font-bold text-gray-700 uppercase tracking-wider">City</label>
                      <input
                        type="text"
                        name="city"
                        id="city"
                        value={formData.city}
                        onChange={handleChange}
                        className="mt-2 block w-full rounded-xl border-gray-200 py-3 px-4 text-gray-900 shadow-sm focus:border-indigo-600 focus:ring-indigo-600 text-sm transition-all"
                        placeholder="e.g. Patna"
                      />
                    </div>

                    <div>
                      <label htmlFor="district" className="block text-xs font-bold text-gray-700 uppercase tracking-wider">District</label>
                      <input
                        type="text"
                        name="district"
                        id="district"
                        value={formData.district}
                        onChange={handleChange}
                        className="mt-2 block w-full rounded-xl border-gray-200 py-3 px-4 text-gray-900 shadow-sm focus:border-indigo-600 focus:ring-indigo-600 text-sm transition-all"
                        placeholder="e.g. Patna District"
                      />
                    </div>
                  </div>
                </div>

                {/* Professional Details */}
                <div className="bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-8 shadow-sm">
                  <div className="flex items-center gap-3 border-b border-gray-100 pb-5 mb-6">
                    <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900">Professional Details</h3>
                      <p className="text-xs text-gray-400 font-medium">Add details that make you stand out to employers.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label htmlFor="education" className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Highest Education</label>
                      <input
                        type="text"
                        name="education"
                        id="education"
                        value={formData.education}
                        onChange={handleChange}
                        className="mt-2 block w-full rounded-xl border-gray-200 py-3 px-4 text-gray-900 shadow-sm focus:border-indigo-600 focus:ring-indigo-600 text-sm transition-all"
                        placeholder="e.g. B.Tech in Computer Science, 12th Pass"
                      />
                    </div>

                    <div>
                      <label htmlFor="experience_years" className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Years of Experience</label>
                      <input
                        type="number"
                        name="experience_years"
                        id="experience_years"
                        min="0"
                        max="60"
                        value={formData.experience_years}
                        onChange={handleChange}
                        className="mt-2 block w-full rounded-xl border-gray-200 py-3 px-4 text-gray-950 shadow-sm focus:border-indigo-600 focus:ring-indigo-600 text-sm transition-all"
                        placeholder="e.g. 2 (leave blank or 0 if fresher)"
                      />
                    </div>

                    <div>
                      <label htmlFor="skills" className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Skills (Comma separated)</label>
                      <input
                        type="text"
                        name="skills"
                        id="skills"
                        value={formData.skills}
                        onChange={handleChange}
                        className="mt-2 block w-full rounded-xl border-gray-200 py-3 px-4 text-gray-900 shadow-sm focus:border-indigo-600 focus:ring-indigo-600 text-sm transition-all"
                        placeholder="e.g. Sales, Python, Data Entry, Management"
                      />
                    </div>

                    <div>
                      <label htmlFor="bio" className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Professional Bio</label>
                      <textarea
                        name="bio"
                        id="bio"
                        rows={4}
                        value={formData.bio}
                        onChange={handleChange}
                        className="mt-2 block w-full rounded-xl border-gray-200 py-3 px-4 text-gray-900 shadow-sm focus:border-indigo-600 focus:ring-indigo-600 text-sm transition-all"
                        placeholder="Introduce yourself, your key achievements, and what you are looking for..."
                      />
                    </div>
                  </div>
                </div>

                {/* Save CTA */}
                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    disabled={saving}
                    className="rounded-2xl bg-indigo-650 hover:bg-indigo-700 text-white font-bold py-3 px-8 shadow-md transition-all duration-200 flex items-center gap-2 hover:-translate-y-0.5"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving Profile...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}

            {/* TAB 2: PAYMENTS & BILLING */}
            {activeTab === 'payment' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* Active Plan Overview */}
                <div className="bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-8 shadow-sm">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-5 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-gray-900">Payments & Subscriptions</h3>
                        <p className="text-xs text-gray-400 font-medium">Manage your subscription packages and invoices.</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-755">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Active Account
                    </span>
                  </div>

                  <div className="bg-gradient-to-br from-indigo-950 to-slate-900 text-white rounded-2xl p-6 relative overflow-hidden shadow-md">
                    {/* Background decorations */}
                    <div className="absolute right-0 bottom-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl"></div>
                    <div className="absolute left-1/4 top-0 w-24 h-24 bg-white/5 rounded-full blur-xl"></div>
                    
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                      <div>
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block">Current Package</span>
                        <h4 className="text-xl font-black mt-1">BiharRozgar Seeker Premium</h4>
                        <p className="text-xs text-gray-300 mt-1 max-w-md">Unlimited applications, high-priority recruiter flags, and advanced AI matching filters.</p>
                      </div>
                      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-center md:text-right min-w-[140px]">
                        <span className="text-[10px] font-bold text-indigo-350 block uppercase">Billing Cycle</span>
                        <span className="text-lg font-black block mt-0.5">₹0 / Free</span>
                        <span className="text-[10px] text-gray-300 block mt-0.5">Lifetime Beta Plan</span>
                      </div>
                    </div>

                    <div className="border-t border-white/10 mt-6 pt-5 flex flex-wrap gap-4 items-center justify-between">
                      <p className="text-xs text-indigo-200">Your account will transition to premium status during open public rounds.</p>
                      <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-colors shadow-sm shadow-indigo-900/30 flex items-center gap-1">
                        Upgrade Plans <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Available Plans Selection */}
                <div className="bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-8 shadow-sm">
                  <h4 className="text-sm font-bold text-gray-900 mb-5">Premium Plans Available</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Seeker Basic (Current) */}
                    <div className="border-2 border-indigo-600 rounded-2xl p-5 relative bg-indigo-50/10">
                      <div className="absolute right-4 top-4 text-xs font-bold text-indigo-650 bg-indigo-150/40 px-2 py-0.5 rounded-md">Current</div>
                      <h5 className="font-extrabold text-gray-900 text-sm">Basic Seeker (Beta)</h5>
                      <p className="text-xs text-gray-400 mt-1">Apply to standard jobs, receive alerts, custom profile.</p>
                      <div className="mt-4 flex items-baseline gap-1">
                        <span className="text-lg font-black text-gray-950">₹0</span>
                        <span className="text-xs text-gray-400">/ lifetime</span>
                      </div>
                    </div>

                    {/* Recruiter Gold (Upgrade) */}
                    <div className="border border-gray-200 rounded-2xl p-5 hover:border-indigo-400 transition-colors cursor-pointer group">
                      <h5 className="font-extrabold text-gray-950 text-sm flex items-center justify-between">
                        Employer Pro 
                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                      </h5>
                      <p className="text-xs text-gray-400 mt-1">Post unlimited job ads, direct candidate chat, verified badge.</p>
                      <div className="mt-4 flex items-baseline gap-1">
                        <span className="text-lg font-black text-gray-950">₹999</span>
                        <span className="text-xs text-gray-400">/ month</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Billing History (Invoices Mock) */}
                <div className="bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-8 shadow-sm">
                  <h4 className="text-sm font-bold text-gray-900 mb-4">Billing History</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-gray-100 text-gray-400 uppercase font-bold tracking-wider">
                          <th className="pb-3 font-bold">Invoice ID</th>
                          <th className="pb-3 font-bold">Date</th>
                          <th className="pb-3 font-bold">Package</th>
                          <th className="pb-3 font-bold">Amount</th>
                          <th className="pb-3 font-bold">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-gray-50 text-gray-700">
                          <td className="py-3.5 font-semibold">#BR-88912</td>
                          <td className="py-3.5">Jun 10, 2026</td>
                          <td className="py-3.5 font-medium">Free Beta Seeker Plan</td>
                          <td className="py-3.5 font-bold">₹0</td>
                          <td className="py-3.5">
                            <span className="inline-flex px-2 py-0.5 rounded-md font-bold text-[10px] bg-emerald-50 text-emerald-700">Paid</span>
                          </td>
                        </tr>
                        <tr className="text-gray-700">
                          <td className="py-3.5 font-semibold">#BR-81233</td>
                          <td className="py-3.5">Jun 05, 2026</td>
                          <td className="py-3.5 font-medium">Account Activation</td>
                          <td className="py-3.5 font-bold">₹0</td>
                          <td className="py-3.5">
                            <span className="inline-flex px-2 py-0.5 rounded-md font-bold text-[10px] bg-emerald-50 text-emerald-700">Paid</span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 3: SECURITY SETTINGS */}
            {activeTab === 'security' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-8 shadow-sm">
                  <div className="flex items-center gap-3 border-b border-gray-100 pb-5 mb-6">
                    <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900">Security Settings</h3>
                      <p className="text-xs text-gray-400 font-medium">Manage passwords, sessions, and multi-factor safety.</p>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <h4 className="text-sm font-bold text-gray-950">Change Password</h4>
                      <p className="text-xs text-gray-500 mt-0.5">We send an OTP code for secure verification before enabling password changes.</p>
                      
                      <div className="mt-4 p-4 rounded-2xl bg-indigo-50/40 border border-indigo-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div>
                          <p className="text-xs font-bold text-indigo-950">Reset Password using Email Verification</p>
                          <p className="text-[11px] text-indigo-600 mt-0.5">Securely trigger a password reset through a one-time verification link.</p>
                        </div>
                        <Button 
                          onClick={() => router.push('/forgot-password')}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl px-5 py-2.5 text-xs transition-all flex items-center gap-1 shadow-sm"
                        >
                          Request Reset Code <ExternalLink className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>

                    <div className="border-t border-gray-100 pt-5">
                      <h4 className="text-sm font-bold text-gray-950">Two-Factor Authentication</h4>
                      <p className="text-xs text-gray-500 mt-0.5">Get safety verification prompts sent to your registered email or phone.</p>
                      <div className="mt-4 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold text-gray-800">OTP-based Login (MFA)</p>
                          <p className="text-[11px] text-gray-400">Always enforce standard 6-digit OTP delivery for logins.</p>
                        </div>
                        <span className="inline-flex px-3 py-1 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700">Enabled</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: SYSTEM PREFERENCES */}
            {activeTab === 'preferences' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-8 shadow-sm">
                  <div className="flex items-center gap-3 border-b border-gray-100 pb-5 mb-6">
                    <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                      <Settings className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900">System Preferences</h3>
                      <p className="text-xs text-gray-400 font-medium">Control notifications, job suggestions, and platform configuration.</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-bold text-gray-950">Email Notifications</h4>
                      <div className="mt-4 space-y-3">
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input type="checkbox" defaultChecked className="mt-1 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600" />
                          <div>
                            <span className="text-xs font-semibold text-gray-900 block">Weekly Job Recommendations</span>
                            <span className="text-[11px] text-gray-400">Curated alerts matched specifically to your target skills.</span>
                          </div>
                        </label>
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input type="checkbox" defaultChecked className="mt-1 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600" />
                          <div>
                            <span className="text-xs font-semibold text-gray-900 block">Application Updates</span>
                            <span className="text-[11px] text-gray-400">Receive alerts when an employer views or changes the status of your application.</span>
                          </div>
                        </label>
                      </div>
                    </div>

                    <div className="border-t border-gray-100 pt-6">
                      <h4 className="text-sm font-bold text-gray-950">Search Visibility</h4>
                      <p className="text-xs text-gray-400 mt-0.5">Control whether verified recruiters in Bihar can discover your profile.</p>
                      <div className="mt-4 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold text-gray-900">Discoverable Profile</p>
                          <p className="text-[11px] text-gray-400">Allow hiring managers to view your education and skills in candidate queries.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" defaultChecked className="sr-only peer" />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
