'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { SlidersHorizontal, Map, List } from 'lucide-react';
import { propertiesApi } from '@/lib/api';
import { useSearchStore } from '@/lib/store';
import PropertyCard from '@/components/property/PropertyCard';
import SearchFiltersPanel from '@/components/search/SearchFiltersPanel';

function SearchContent() {
  const searchParams = useSearchParams();
  const { filters, setFilters } = useSearchStore();
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const city = searchParams.get('city');
    if (city) setFilters({ city });
  }, [searchParams]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['properties', filters],
    queryFn: () => propertiesApi.list(filters),
    keepPreviousData: true,
  });

  const properties = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <span className="font-semibold text-gray-900">
              {pagination?.total?.toLocaleString() ?? '—'} Properties
            </span>
            {filters.city && (
              <span className="text-gray-500 ml-2">in {filters.city}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1.5 btn-outline text-sm py-1.5"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
            </button>
            <div className="flex border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 text-sm ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`px-3 py-1.5 text-sm ${viewMode === 'map' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <Map className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Filters Sidebar */}
          {showFilters && (
            <aside className="w-72 flex-shrink-0">
              <SearchFiltersPanel />
            </aside>
          )}

          {/* Results */}
          <div className="flex-1">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="card p-4 animate-pulse">
                    <div className="bg-gray-200 h-48 rounded-lg mb-4" />
                    <div className="bg-gray-200 h-4 rounded w-3/4 mb-2" />
                    <div className="bg-gray-200 h-4 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : properties.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <div className="text-5xl mb-4">🏠</div>
                <p className="text-lg font-medium">No properties found</p>
                <p className="text-sm mt-1">Try adjusting your filters</p>
              </div>
            ) : (
              <>
                <div className={`grid gap-5 ${
                  showFilters
                    ? 'grid-cols-1 md:grid-cols-2'
                    : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
                }`}>
                  {properties.map((property) => (
                    <PropertyCard key={property.id} property={property} />
                  ))}
                </div>

                {/* Pagination */}
                {pagination && pagination.pages > 1 && (
                  <div className="flex justify-center gap-2 mt-8">
                    {Array.from({ length: Math.min(pagination.pages, 7) }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setFilters({ page })}
                        className={`w-9 h-9 rounded-lg text-sm font-medium ${
                          filters.page === page
                            ? 'bg-blue-600 text-white'
                            : 'bg-white border text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchContent />
    </Suspense>
  );
}
