'use client';

import { useState, useEffect } from 'react';
import { Check, X, Users, Briefcase, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { createClient } from '@/lib/supabase';
import { apiFetch } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import type { Job } from '@/types';

export default function AdminDashboard() {
  const [pendingJobs, setPendingJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState({ totalJobs: 0, activeJobs: 0, totalUsers: 0 });
  const [adminId, setAdminId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const authSession = await apiFetch<{
        user: { id: string };
        profile: { role: string };
      }>('/auth/me');

      if (authSession.profile.role !== 'admin') {
        window.location.href = '/';
        return;
      }

      setAdminId(authSession.user.id);
      const supabase = createClient();
      const [jobsRes, profilesRes, approvedJobs] = await Promise.all([
        supabase.from('jobs').select('*').eq('status', 'pending').order('created_at', { ascending: false }),
        supabase.from('profiles').select('id', { count: 'exact' }),
        supabase.from('jobs').select('id', { count: 'exact' }).eq('status', 'approved'),
      ]);

      if (jobsRes.data) setPendingJobs(jobsRes.data);
      setStats({
        totalJobs: approvedJobs.count || 0,
        activeJobs: approvedJobs.count || 0,
        totalUsers: profilesRes.count || 0,
      });
      setLoading(false);
    };

    fetchData();
  }, []);

  const handleApproveJob = async (jobId: string) => {
    if (!adminId) {
      return;
    }

    const supabase = createClient();

    await supabase.from('jobs').update({
      status: 'approved',
      approved_by: adminId,
      approved_at: new Date().toISOString(),
    }).eq('id', jobId);

    setPendingJobs(pendingJobs.filter(j => j.id !== jobId));
  };

  const handleRejectJob = async (jobId: string) => {
    const supabase = createClient();
    await supabase.from('jobs').update({ status: 'rejected' }).eq('id', jobId);
    setPendingJobs(pendingJobs.filter(j => j.id !== jobId));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-bihar-green border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-bihar-green text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-bihar-green-light mt-1">Manage jobs, users & platform</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-bihar-green-bg rounded-full flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-bihar-green" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.totalJobs}</div>
                <div className="text-sm text-gray-500">Active Jobs</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-bihar-yellow-light rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-bihar-yellow-dark" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.totalUsers}</div>
                <div className="text-sm text-gray-500">Total Users</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{pendingJobs.length}</div>
                <div className="text-sm text-gray-500">Pending Approvals</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Pending Job Approvals</h2>

          {pendingJobs.length > 0 ? (
            <div className="space-y-4">
              {pendingJobs.map((job) => (
                <div key={job.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{job.title}</h3>
                      <p className="text-sm text-gray-500">{job.category} • {job.district}</p>
                      <p className="text-sm text-gray-400 mt-1">Posted {formatDate(job.created_at)}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleApproveJob(job.id)}
                        className="bg-green-500 hover:bg-green-600"
                      >
                        <Check className="w-4 h-4 mr-1" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRejectJob(job.id)}
                      >
                        <X className="w-4 h-4 mr-1" /> Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Check className="w-12 h-12 mx-auto text-green-500 mb-4" />
              <p className="text-gray-500">No pending jobs to review</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
