'use client';

import Link from 'next/link';
import { MapPin, Clock, IndianRupee, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatSalary, formatDate, generateWhatsAppLink, truncate } from '@/lib/utils';
import type { Job } from '@/types';

interface JobCardProps {
  job: Job;
  variant?: 'default' | 'compact' | 'featured';
}

export function JobCard({ job, variant = 'default' }: JobCardProps) {
  const handleWhatsAppApply = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!job.whatsapp_number) return;
    
    const message = `Hi, I'm interested in the ${job.title} job. My name is [Your Name]. Please share more details.`;
    window.open(generateWhatsAppLink(job.whatsapp_number, message), '_blank');
  };

  const isCompact = variant === 'compact';
  const isFeatured = variant === 'featured' || job.is_featured;

  return (
    <div
      className={`group bg-white rounded-3xl border transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${
        isFeatured ? 'border-bihar-yellow/50 bg-gradient-to-br from-white to-bihar-yellow-light/20' : 'border-gray-100'
      } ${isCompact ? 'p-4' : 'p-6'}`}
    >
      <div className="flex flex-col md:flex-row items-start justify-between gap-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-3">
            {job.is_featured && (
              <Badge variant="featured" className="shadow-sm">Featured</Badge>
            )}
            {job.is_urgent && (
              <Badge variant="urgent" className="shadow-sm">Urgent</Badge>
            )}
            {job.is_fresher_friendly && (
              <Badge className="bg-blue-50 text-blue-600 border border-blue-100 shadow-sm">Fresher Friendly</Badge>
            )}
          </div>
          
          <Link href={`/jobs/${job.id}`}>
            <h3 className="text-xl font-bold text-gray-900 group-hover:text-bihar-green transition-colors leading-tight mb-1 truncate">
              {job.title}
            </h3>
          </Link>
          
          <p className="text-base font-semibold text-bihar-green-dark/70 mb-4">
            {job.employer?.full_name || 'Verified Employer'}
          </p>

          <div className={`grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5 text-sm font-medium text-gray-600 ${isCompact ? 'gap-2' : ''}`}>
            <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl">
              <MapPin className="w-4 h-4 text-bihar-green" />
              <span className="truncate">{job.district}{job.city && `, ${job.city}`}</span>
            </div>
            
            <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl">
              <IndianRupee className="w-4 h-4 text-bihar-green" />
              <span>{formatSalary(job.salary_min, job.salary_max, job.salary_type)}</span>
            </div>
            
            <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl">
              <Clock className="w-4 h-4 text-bihar-green" />
              <span className="capitalize">{job.job_type.replace('-', ' ')}</span>
            </div>
          </div>

          {!isCompact && job.description && (
            <p className="text-gray-500 line-clamp-2 leading-relaxed mb-2">
              {truncate(job.description, 150)}
            </p>
          )}
        </div>

        <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-start w-full md:w-auto gap-4 md:border-l md:border-gray-100 md:pl-6">
          <div className="flex flex-col items-end">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
              Posted {formatDate(job.created_at)}
            </span>
            
            {job.application_method === 'whatsapp' && job.whatsapp_number ? (
              <button
                onClick={handleWhatsAppApply}
                className="btn-secondary w-full md:w-auto px-8 py-3 shadow-lg hover:shadow-bihar-yellow/40 group/btn"
              >
                <svg className="w-5 h-5 transition-transform group-hover/btn:scale-125" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.195.194 1.654.108.6-.115 1.878-.695 2.147-1.669.265-.973.265-1.803.189-1.961-.076-.159-.274-.536-.537-.766-.262-.229-.537-.262-.737-.262-.201 0-.4.012-.59.046-.189.034-.395.075-.568.149-.174.074-.348.149-.497.273z"/>
                </svg>
                Apply Direct
              </button>
            ) : (
              <Link href={`/jobs/${job.id}`}>
                <button className="btn-primary w-full md:w-auto px-8 py-3 shadow-lg hover:shadow-bihar-green/40 group/btn">
                  View Details <ArrowRight className="w-5 h-5 transition-transform group-hover/btn:translate-x-1" />
                </button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}