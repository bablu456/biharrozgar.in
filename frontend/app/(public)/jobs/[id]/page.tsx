'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Clock, IndianRupee, Building2, Eye, Users, ArrowLeft, Share2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { apiFetch } from '@/lib/api';
import { formatSalary, formatDate, generateWhatsAppLink } from '@/lib/utils';
import type { Job } from '@/types';

export default function JobDetailPage() {
  const params = useParams();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const data = await apiFetch<Job>(`/jobs/${params.id}`);
        setJob(data);
        
        // await apiFetch(`/jobs/${params.id}/view`, { method: 'POST' });
      } catch (err) {
        setError('Job not found');
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-bihar-green border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Job Not Found</h1>
          <p className="text-gray-500 mb-4">This job may have been removed or is no longer available.</p>
          <Link href="/jobs">
            <Button>Browse Jobs</Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleWhatsAppApply = () => {
    if (!job.whatsapp_number) return;
    const message = `Hi, I'm interested in the ${job.title} job at ${job.employer?.full_name || 'your company'}. My name is [Your Name]. Please share more details.`;
    window.open(generateWhatsAppLink(job.whatsapp_number, message), '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-bihar-green text-white py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/jobs" className="inline-flex items-center text-bihar-green-light hover:text-white mb-4">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Jobs
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6 md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div>
              <div className="flex flex-wrap gap-2 mb-2">
                {job.is_featured && <Badge variant="featured">Featured</Badge>}
                {job.is_urgent && <Badge variant="urgent">Urgent</Badge>}
                {job.is_fresher_friendly && <Badge>Fresher Friendly</Badge>}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{job.title}</h1>
              <p className="text-lg text-gray-600 mt-1">{job.employer?.full_name || 'Company'}</p>
            </div>
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <Share2 className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y border-gray-100">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-bihar-green" />
              <div>
                <p className="text-xs text-gray-500">Location</p>
                <p className="font-medium">{job.district}{job.city && `, ${job.city}`}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <IndianRupee className="w-5 h-5 text-bihar-green" />
              <div>
                <p className="text-xs text-gray-500">Salary</p>
                <p className="font-medium">{formatSalary(job.salary_min, job.salary_max, job.salary_type)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-bihar-green" />
              <div>
                <p className="text-xs text-gray-500">Job Type</p>
                <p className="font-medium capitalize">{job.job_type.replace('-', ' ')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-bihar-green" />
              <div>
                <p className="text-xs text-gray-500">Category</p>
                <p className="font-medium capitalize">{job.category}</p>
              </div>
            </div>
          </div>

          <div className="py-6 border-b border-gray-100">
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1"><Eye className="w-4 h-4" /> {job.views_count} views</span>
              <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {job.applicants_count} applicants</span>
              <span>Posted {formatDate(job.created_at)}</span>
            </div>
          </div>

          <div className="py-6">
            <h2 className="text-lg font-semibold mb-4">Job Description</h2>
            <div className="prose prose-gray max-w-none">
              <p className="whitespace-pre-wrap">{job.description}</p>
            </div>
          </div>

          {job.requirements && (
            <div className="py-6 border-t border-gray-100">
              <h2 className="text-lg font-semibold mb-4">Requirements</h2>
              <div className="prose prose-gray max-w-none">
                <p className="whitespace-pre-wrap">{job.requirements}</p>
              </div>
            </div>
          )}

          {job.apply_instructions && (
            <div className="py-6 border-t border-gray-100">
              <h2 className="text-lg font-semibold mb-4">How to Apply</h2>
              <p className="text-gray-600">{job.apply_instructions}</p>
            </div>
          )}

          <div className="py-6 border-t border-gray-100">
            <h2 className="text-lg font-semibold mb-4">Apply for this Job</h2>
            
            {job.application_method === 'whatsapp' && job.whatsapp_number ? (
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" onClick={handleWhatsAppApply} className="whatsapp-btn">
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.195.194 1.654.108.6-.115 1.878-.695 2.147-1.669.265-.973.265-1.803.189-1.961-.076-.159-.274-.536-.537-.766-.262-.229-.537-.262-.737-.262-.201 0-.4.012-.59.046-.189.034-.395.075-.568.149-.174.074-.348.149-.497.273z"/>
                  </svg>
                  Apply via WhatsApp
                </Button>
                <p className="text-sm text-gray-500 self-center">
                  Click to directly message employer on WhatsApp
                </p>
              </div>
            ) : job.application_link ? (
              <a href={job.application_link} target="_blank" rel="noopener noreferrer">
                <Button size="lg">Apply Now</Button>
              </a>
            ) : (
              <p className="text-gray-500">Contact employer through other means mentioned above.</p>
            )}
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Safety Tips: Never share personal information or pay any fees to apply for jobs.</p>
        </div>
      </div>
    </div>
  );
}