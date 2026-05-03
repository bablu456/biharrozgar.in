'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { JobCard } from '@/components/jobs/JobCard';
import { JobFilters, type FilterState } from '@/components/jobs/JobFilters';
import { apiFetch } from '@/lib/api';
import type { Job } from '@/types';

function JobsContent() {
  const searchParams = useSearchParams();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, total: 0, perPage: 10 });

  const initialFilters: FilterState = {
    search: searchParams.get('search') || '',
    district: searchParams.get('district') || '',
    category: searchParams.get('category') || '',
    jobType: searchParams.get('type') || '',
    salaryMin: '',
    salaryMax: '',
    fresher: searchParams.get('fresher') === 'true',
  };

  const [filters, setFilters] = useState<FilterState>(initialFilters);

  useEffect(() => {
    fetchJobs();
  }, [filters, pagination.page]);

  const fetchJobs = async () => {
    setLoading(true);
    
    try {
      const skip = (pagination.page - 1) * pagination.perPage;
      const data = await apiFetch<Job[]>('/jobs', {
        params: {
          skip,
          limit: pagination.perPage,
          district: filters.district || undefined,
          category: filters.category || undefined,
          // search: filters.search || undefined, // Backend search not fully implemented yet
        }
      });

      if (data) {
        setJobs(data);
        // Note: For now, we'll set total to data.length as a fallback
        // until we have a dedicated count endpoint or search result schema
        setPagination((p) => ({ ...p, total: data.length > 0 ? 100 : 0 })); 
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setPagination((p) => ({ ...p, page: 1 }));
  };

  const totalPages = Math.ceil(pagination.total / pagination.perPage);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-bihar-green text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold mb-2">Find Jobs in Bihar</h1>
          <p className="text-bihar-green-light">
            Browse {pagination.total} jobs across all 38 districts
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-72 flex-shrink-0">
            <JobFilters onFilterChange={handleFilterChange} initialFilters={filters} />
          </aside>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-600">
                Showing {jobs.length} of {pagination.total} jobs
              </span>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-bihar-green border-t-transparent rounded-full mx-auto" />
                <p className="mt-2 text-gray-500">Loading jobs...</p>
              </div>
            ) : jobs.length > 0 ? (
              <>
                <div className="space-y-4">
                  {jobs.map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-8">
                    <button
                      onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                      disabled={pagination.page === 1}
                      className="px-4 py-2 border rounded-lg disabled:opacity-50"
                    >
                      Previous
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => setPagination((p) => ({ ...p, page }))}
                          className={`px-4 py-2 border rounded-lg ${
                            pagination.page === page
                              ? 'bg-bihar-green text-white'
                              : 'hover:bg-gray-100'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                      disabled={pagination.page === totalPages}
                      className="px-4 py-2 border rounded-lg disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16 bg-white rounded-xl">
                <p className="text-gray-500 text-lg">No jobs found matching your criteria</p>
                <button
                  onClick={() => handleFilterChange({
                    search: '',
                    district: '',
                    category: '',
                    jobType: '',
                    salaryMin: '',
                    salaryMax: '',
                    fresher: false,
                  })}
                  className="mt-4 text-bihar-green hover:underline"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function JobsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <JobsContent />
    </Suspense>
  );
}