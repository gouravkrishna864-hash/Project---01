'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Mic } from 'lucide-react';
import { aiApi } from '@/lib/api';
import { useSearchStore } from '@/lib/store';
import toast from 'react-hot-toast';

export default function HeroSearch() {
  const router = useRouter();
  const { setFilters, setNlpQuery } = useSearchStore();
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      const res = await aiApi.parseSearch(query);
      const parsed = res.data;

      setNlpQuery(query);
      setFilters({
        city: parsed.city,
        locality: parsed.locality,
        type: parsed.type,
        listing_type: parsed.listing_type,
        max_price: parsed.max_price,
        bedrooms: parsed.bedrooms,
      });

      router.push('/search');
    } catch {
      // Fallback: simple text search
      setNlpQuery(query);
      router.push(`/search?q=${encodeURIComponent(query)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const examples = [
    '2BHK under 50L in Pune',
    '3BHK flat for rent in Banjara Hills',
    'Villa below 1.5Cr near metro Bangalore',
  ];

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSearch} className="relative">
        <div className="flex bg-white rounded-2xl shadow-2xl overflow-hidden border border-white/20">
          <div className="flex items-center pl-4 text-gray-400">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Try "2BHK under 50L near metro in Pune"'
            className="flex-1 px-3 py-4 text-gray-900 placeholder-gray-400 outline-none text-base"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 font-semibold transition-colors disabled:opacity-60"
          >
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      <div className="flex flex-wrap gap-2 mt-4 justify-center">
        {examples.map((ex) => (
          <button
            key={ex}
            onClick={() => setQuery(ex)}
            className="text-xs text-blue-100 bg-blue-800/40 border border-blue-600/30 px-3 py-1.5 rounded-full hover:bg-blue-700/50 transition-colors"
          >
            {ex}
          </button>
        ))}
      </div>
    </div>
  );
}
