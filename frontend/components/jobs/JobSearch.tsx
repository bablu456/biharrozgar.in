'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface JobSearchProps {
  onSearch: (query: string) => void;
}

export function JobSearch({ onSearch }: JobSearchProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Search jobs by title, skill, or company..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-12 py-4 text-lg"
          />
        </div>
        <Button type="submit" size="lg">
          Search
        </Button>
      </div>
    </form>
  );
}