'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { User, Briefcase, Mail, Phone, MapPin, Loader2, Save, GraduationCap } from 'lucide-react';

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

export default function ProfilePage() {
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
    skills: '', // will be parsed into an array on save
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
      
      // Auto-hide success message
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50/50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-8">
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Your Profile</h1>
          <p className="text-gray-500">Manage your personal and professional details.</p>
        </div>

        {message && (
          <div
            className={`rounded-xl border p-4 backdrop-blur-sm transition-all ${
              message.type === 'success'
                ? 'border-emerald-200 bg-emerald-50/50 text-emerald-800'
                : 'border-red-200 bg-red-50/50 text-red-800'
            }`}
          >
            <p className="text-sm font-medium">{message.text}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Card 1: Personal Information */}
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm ring-1 ring-gray-900/5 transition-all hover:shadow-md">
            <div className="border-b border-gray-100 bg-gray-50/50 px-8 py-5">
              <h3 className="flex items-center text-lg font-semibold leading-6 text-gray-900">
                <User className="mr-2 h-5 w-5 text-indigo-500" />
                Personal Information
              </h3>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-8">
                
                {/* Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
                  <div className="mt-2">
                    <input
                      type="text"
                      name="name"
                      id="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="block w-full rounded-xl border-0 py-2.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 transition-all"
                      placeholder="e.g. Rahul Kumar"
                    />
                  </div>
                </div>

                {/* Gender */}
                <div>
                  <label htmlFor="gender" className="block text-sm font-medium text-gray-700">Gender</label>
                  <div className="mt-2">
                    <select
                      name="gender"
                      id="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="block w-full rounded-xl border-0 py-2.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 transition-all bg-white"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Email (Read Only) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email Address</label>
                  <div className="mt-2 flex rounded-xl shadow-sm ring-1 ring-inset ring-gray-300 bg-gray-50">
                    <span className="flex select-none items-center pl-3 text-gray-400">
                      <Mail className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      disabled
                      value={profile?.email || ''}
                      className="block flex-1 border-0 bg-transparent py-2.5 pl-3 text-gray-500 focus:ring-0 sm:text-sm sm:leading-6"
                    />
                  </div>
                </div>

                {/* Phone (Read Only) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                  <div className="mt-2 flex rounded-xl shadow-sm ring-1 ring-inset ring-gray-300 bg-gray-50">
                    <span className="flex select-none items-center pl-3 text-gray-400">
                      <Phone className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      disabled
                      value={profile?.phone || ''}
                      className="block flex-1 border-0 bg-transparent py-2.5 pl-3 text-gray-500 focus:ring-0 sm:text-sm sm:leading-6"
                    />
                  </div>
                </div>

                {/* City */}
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700">City</label>
                  <div className="mt-2 flex rounded-xl shadow-sm ring-1 ring-inset ring-gray-300 bg-white focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-600">
                    <span className="flex select-none items-center pl-3 text-gray-400">
                      <MapPin className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      name="city"
                      id="city"
                      value={formData.city}
                      onChange={handleChange}
                      className="block flex-1 border-0 bg-transparent py-2.5 pl-3 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
                      placeholder="e.g. Patna"
                    />
                  </div>
                </div>

                {/* District */}
                <div>
                  <label htmlFor="district" className="block text-sm font-medium text-gray-700">District</label>
                  <div className="mt-2 flex rounded-xl shadow-sm ring-1 ring-inset ring-gray-300 bg-white focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-600">
                    <span className="flex select-none items-center pl-3 text-gray-400">
                      <MapPin className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      name="district"
                      id="district"
                      value={formData.district}
                      onChange={handleChange}
                      className="block flex-1 border-0 bg-transparent py-2.5 pl-3 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
                      placeholder="e.g. Patna District"
                    />
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Card 2: Professional Details */}
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm ring-1 ring-gray-900/5 transition-all hover:shadow-md">
            <div className="border-b border-gray-100 bg-gray-50/50 px-8 py-5">
              <h3 className="flex items-center text-lg font-semibold leading-6 text-gray-900">
                <Briefcase className="mr-2 h-5 w-5 text-indigo-500" />
                Professional Details
              </h3>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-8">
                
                {/* Education */}
                <div className="sm:col-span-2">
                  <label htmlFor="education" className="block text-sm font-medium text-gray-700">Highest Education</label>
                  <div className="mt-2 flex rounded-xl shadow-sm ring-1 ring-inset ring-gray-300 bg-white focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-600">
                    <span className="flex select-none items-center pl-3 text-gray-400">
                      <GraduationCap className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      name="education"
                      id="education"
                      value={formData.education}
                      onChange={handleChange}
                      className="block flex-1 border-0 bg-transparent py-2.5 pl-3 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
                      placeholder="e.g. B.Tech in Computer Science, 12th Pass"
                    />
                  </div>
                </div>

                {/* Experience Years */}
                <div>
                  <label htmlFor="experience_years" className="block text-sm font-medium text-gray-700">Years of Experience</label>
                  <div className="mt-2">
                    <input
                      type="number"
                      name="experience_years"
                      id="experience_years"
                      min="0"
                      max="60"
                      value={formData.experience_years}
                      onChange={handleChange}
                      className="block w-full rounded-xl border-0 py-2.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 transition-all"
                      placeholder="0 for fresher"
                    />
                  </div>
                </div>

                {/* Skills */}
                <div className="sm:col-span-2">
                  <label htmlFor="skills" className="block text-sm font-medium text-gray-700">Skills <span className="text-gray-400 font-normal">(Comma separated)</span></label>
                  <div className="mt-2">
                    <input
                      type="text"
                      name="skills"
                      id="skills"
                      value={formData.skills}
                      onChange={handleChange}
                      className="block w-full rounded-xl border-0 py-2.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 transition-all"
                      placeholder="e.g. Sales, Python, Data Entry, Management"
                    />
                  </div>
                </div>

                {/* Bio */}
                <div className="sm:col-span-2">
                  <label htmlFor="bio" className="block text-sm font-medium text-gray-700">Professional Bio</label>
                  <div className="mt-2">
                    <textarea
                      name="bio"
                      id="bio"
                      rows={4}
                      value={formData.bio}
                      onChange={handleChange}
                      className="block w-full rounded-xl border-0 py-2.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 transition-all"
                      placeholder="Tell employers about yourself, your background, and your career goals..."
                    />
                  </div>
                </div>

              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center rounded-xl bg-indigo-600 px-8 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-500 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
