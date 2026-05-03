'use client';

import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { BIHAR_DISTRICTS } from '@/constants/districts';
import { JOB_CATEGORIES, JOB_TYPES } from '@/constants/categories';

interface JobFiltersProps {
  onFilterChange: (filters: FilterState) => void;
  initialFilters?: FilterState;
}

export interface FilterState {
  search: string;
  district: string;
  category: string;
  jobType: string;
  salaryMin: string;
  salaryMax: string;
  fresher: boolean;
}

const initialState: FilterState = {
  search: '',
  district: '',
  category: '',
  jobType: '',
  salaryMin: '',
  salaryMax: '',
  fresher: false,
};

export function JobFilters({ onFilterChange, initialFilters }: JobFiltersProps) {
  const [filters, setFilters] = useState<FilterState>(initialFilters || initialState);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleChange = (key: keyof FilterState, value: string | boolean) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    setFilters(initialState);
    onFilterChange(initialState);
  };

  const hasActiveFilters = Object.values(filters).some(
    (v) => v !== '' && v !== false
  );

  const districtOptions = BIHAR_DISTRICTS.map((d) => ({
    value: d.slug,
    label: d.name,
  }));

  const categoryOptions = JOB_CATEGORIES.map((c) => ({
    value: c.slug,
    label: c.name_en,
  }));

  const jobTypeOptions = JOB_TYPES.map((t) => ({
    value: t.value,
    label: t.label_en,
  }));

  const salaryRanges = [
    { value: '', label: 'Any Salary' },
    { value: '0-5000', label: 'Under ₹5,000' },
    { value: '5000-10000', label: '₹5,000 - ₹10,000' },
    { value: '10000-20000', label: '₹10,000 - ₹20,000' },
    { value: '20000-50000', label: '₹20,000 - ₹50,000' },
    { value: '50000-', label: '₹50,000+' },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Search className="w-5 h-5 text-bihar-green" />
        <h3 className="font-semibold text-gray-900">Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="ml-auto text-sm text-bihar-green hover:underline flex items-center gap-1"
          >
            <X className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      <div className="space-y-4">
        <Input
          placeholder="Search jobs, skills..."
          value={filters.search}
          onChange={(e) => handleChange('search', e.target.value)}
        />

        <Select
          options={[{ value: '', label: 'All Districts' }, ...districtOptions]}
          value={filters.district}
          onChange={(e) => handleChange('district', e.target.value)}
          placeholder="Select District"
        />

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm text-bihar-green font-medium flex items-center gap-1"
        >
          {isExpanded ? 'Less' : 'More'} filters
        </button>

        {isExpanded && (
          <div className="space-y-4 pt-2 border-t">
            <Select
              options={[{ value: '', label: 'All Categories' }, ...categoryOptions]}
              value={filters.category}
              onChange={(e) => handleChange('category', e.target.value)}
              placeholder="Job Category"
            />

            <Select
              options={[{ value: '', label: 'All Types' }, ...jobTypeOptions]}
              value={filters.jobType}
              onChange={(e) => handleChange('jobType', e.target.value)}
              placeholder="Job Type"
            />

            <Select
              options={salaryRanges}
              value={filters.salaryMin}
              onChange={(e) => handleChange('salaryMin', e.target.value)}
              placeholder="Salary Range"
            />

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.fresher}
                onChange={(e) => handleChange('fresher', e.target.checked)}
                className="w-4 h-4 text-bihar-green rounded border-gray-300 focus:ring-bihar-green"
              />
              <span className="text-sm text-gray-700">Fresher Friendly Only</span>
            </label>
          </div>
        )}
      </div>
    </div>
  );
}