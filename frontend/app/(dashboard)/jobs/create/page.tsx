'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { apiFetch } from '@/lib/api';
import { JOB_CATEGORIES, JOB_TYPES } from '@/constants/categories';
import { BIHAR_DISTRICTS } from '@/constants/districts';

export default function CreateJobPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
// ... existing state ...
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await apiFetch('/jobs', {
        method: 'POST',
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          requirements: formData.requirements || null,
          category: formData.category,
          job_type: formData.job_type,
          district: formData.district,
          city: formData.city || null,
          salary_min: formData.salary_min ? parseInt(formData.salary_min) : null,
          salary_max: formData.salary_max ? parseInt(formData.salary_max) : null,
          salary_type: formData.salary_type,
          is_fresher_friendly: formData.is_fresher_friendly,
          application_method: formData.application_method,
          whatsapp_number: formData.whatsapp_number || null,
          application_link: formData.application_link || null,
          apply_instructions: formData.apply_instructions || null,
        }),
      });

      router.push('/dashboard/employer?success=job-created');
    } catch (err: any) {
      alert('Error creating job: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Post a New Job</h1>
          <p className="text-gray-600 mt-1">Fill in the details to post your job listing</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
            
            <div className="space-y-4">
              <Input
                label="Job Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Hindi Teacher, Sales Executive"
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the job role, responsibilities..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bihar-green focus:border-transparent outline-none min-h-[120px]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Requirements (Optional)</label>
                <textarea
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  placeholder="Skills, experience needed..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bihar-green focus:border-transparent outline-none min-h-[80px]"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <Select
                  label="Category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  options={[
                    { value: '', label: 'Select Category' },
                    ...JOB_CATEGORIES.map((c) => ({ value: c.slug, label: c.name_en })),
                  ]}
                  required
                />

                <Select
                  label="Job Type"
                  value={formData.job_type}
                  onChange={(e) => setFormData({ ...formData, job_type: e.target.value })}
                  options={JOB_TYPES.map((t) => ({ value: t.value, label: t.label_en }))}
                  required
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Location & Salary</h2>
            
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Select
                  label="District"
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  options={[
                    { value: '', label: 'Select District' },
                    ...BIHAR_DISTRICTS.map((d) => ({ value: d.slug, label: d.name })),
                  ]}
                  required
                />

                <Input
                  label="City/Area (Optional)"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="e.g. Kankarbagh, Patna"
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <Input
                  label="Min Salary (₹)"
                  type="number"
                  value={formData.salary_min}
                  onChange={(e) => setFormData({ ...formData, salary_min: e.target.value })}
                  placeholder="10000"
                />

                <Input
                  label="Max Salary (₹)"
                  type="number"
                  value={formData.salary_max}
                  onChange={(e) => setFormData({ ...formData, salary_max: e.target.value })}
                  placeholder="20000"
                />

                <Select
                  label="Salary Type"
                  value={formData.salary_type}
                  onChange={(e) => setFormData({ ...formData, salary_type: e.target.value })}
                  options={[
                    { value: 'monthly', label: 'Monthly' },
                    { value: 'daily', label: 'Daily' },
                    { value: 'hourly', label: 'Hourly' },
                  ]}
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_fresher_friendly}
                  onChange={(e) => setFormData({ ...formData, is_fresher_friendly: e.target.checked })}
                  className="w-4 h-4 text-bihar-green rounded"
                />
                <span className="text-sm text-gray-700">Fresher Friendly (No experience required)</span>
              </label>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Application Details</h2>
            
            <div className="space-y-4">
              <Select
                label="Application Method"
                value={formData.application_method}
                onChange={(e) => setFormData({ ...formData, application_method: e.target.value })}
                options={[
                  { value: 'whatsapp', label: 'WhatsApp' },
                  { value: 'form', label: 'Application Form/Link' },
                  { value: 'email', label: 'Email' },
                ]}
              />

              {formData.application_method === 'whatsapp' && (
                <Input
                  label="WhatsApp Number"
                  value={formData.whatsapp_number}
                  onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                  placeholder="+91 9876543210"
                  hint="Candidates will message you directly on WhatsApp"
                />
              )}

              {formData.application_method === 'form' && (
                <Input
                  label="Application Link"
                  value={formData.application_link}
                  onChange={(e) => setFormData({ ...formData, application_link: e.target.value })}
                  placeholder="https://..."
                  hint="Link to Google Form or career page"
                />
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Additional Instructions (Optional)</label>
                <textarea
                  value={formData.apply_instructions}
                  onChange={(e) => setFormData({ ...formData, apply_instructions: e.target.value })}
                  placeholder="Any specific instructions for applicants..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bihar-green focus:border-transparent outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <Button type="submit" size="lg" loading={loading}>
              Submit for Review
            </Button>
            <Button type="button" variant="outline" size="lg" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>

          <p className="text-sm text-gray-500">
            Your job will be reviewed by our team and published within 24 hours.
          </p>
        </form>
      </div>
    </div>
  );
}