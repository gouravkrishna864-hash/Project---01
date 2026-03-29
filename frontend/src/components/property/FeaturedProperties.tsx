'use client';
import { useQuery } from '@tanstack/react-query';
import { propertiesApi } from '@/lib/api';
import PropertyCard from './PropertyCard';

export default function FeaturedProperties() {
  const { data, isLoading } = useQuery({
    queryKey: ['featured-properties'],
    queryFn: () => propertiesApi.list({ is_featured: true, limit: 6 } as any),
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card p-4 animate-pulse">
            <div className="bg-gray-200 h-52 rounded-lg mb-4" />
            <div className="bg-gray-200 h-4 rounded w-3/4 mb-2" />
            <div className="bg-gray-200 h-4 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {data?.data?.map((property) => (
        <PropertyCard key={property.id} property={property} />
      ))}
    </div>
  );
}
