'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import type { Application } from '@/types';
import { Briefcase, MapPin, Clock, ArrowRight, CheckCircle2, XCircle, Clock4, FileText } from 'lucide-react';

export default function SeekerApplications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const res = await apiFetch<Application[]>('/applications/my');
        if (res) {
          setApplications(res);
        }
      } catch (err) {
        console.error('Error fetching applications:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchApplications();
  }, []);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'shortlisted':
      case 'hired':
        return { icon: <CheckCircle2 className="w-5 h-5" />, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' };
      case 'rejected':
        return { icon: <XCircle className="w-5 h-5" />, color: 'text-rose-600', bg: 'bg-rose-50 border-rose-200' };
      case 'pending':
      default:
        return { icon: <Clock4 className="w-5 h-5" />, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' };
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">My Applications</h1>
          <p className="mt-2 text-lg text-gray-500">Track the status of jobs you've applied for.</p>
        </div>
        <Link 
          href="/jobs" 
          className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          Browse More Jobs
          <ArrowRight className="ml-2 w-4 h-4" />
        </Link>
      </div>

      {applications.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-gray-300 bg-gray-50/50 p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 mb-6">
            <FileText className="h-8 w-8 text-indigo-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No applications yet</h3>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            You haven't applied to any jobs yet. Start exploring opportunities in Bihar and apply today!
          </p>
          <Link 
            href="/jobs" 
            className="inline-flex items-center rounded-xl bg-white px-6 py-3 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-colors"
          >
            Find a Job
          </Link>
        </div>
      ) : (
        <div className="grid gap-6">
          {applications.map((app) => {
            const statusConfig = getStatusConfig(app.status);
            
            return (
              <div 
                key={app.id} 
                className="group relative flex flex-col sm:flex-row gap-6 overflow-hidden rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5 hover:shadow-md transition-all"
              >
                <div className="flex-1 space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                      <Link href={`/jobs/${app.job_id}`} className="focus:outline-none">
                        <span className="absolute inset-0" aria-hidden="true" />
                        {app.job?.title || 'Unknown Job'}
                      </Link>
                    </h3>
                    <p className="text-sm font-medium text-indigo-600 mt-1">
                      {app.job?.employer?.full_name || 'Employer'}
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    {app.job?.district && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        {app.job.district}
                      </div>
                    )}
                    {app.job?.job_type && (
                      <div className="flex items-center gap-1.5">
                        <Briefcase className="w-4 h-4 text-gray-400" />
                        <span className="capitalize">{app.job.job_type.replace('-', ' ')}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-gray-400" />
                      Applied on {new Date(app.applied_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center sm:pl-6 sm:border-l border-gray-100">
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${statusConfig.bg} ${statusConfig.color}`}>
                    {statusConfig.icon}
                    <span className="font-semibold capitalize tracking-wide text-sm">{app.status}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
