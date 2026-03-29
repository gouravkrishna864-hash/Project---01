'use client';
import { useQuery } from '@tanstack/react-query';
import { propertiesApi } from '@/lib/api';
import PropertyCard from './PropertyCard';
import { useAuthStore } from '@/lib/store';

export default function RecommendedProperties() {
  const { user } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ['recommendations', user?.id],
    queryFn: () => propertiesApi.getRecommendations(),
    enabled: !!user,
  });

  if (!user) {
    return (
      <div className="text-center py-10 text-gray-500">
        <p className="mb-3">Sign in to see AI-powered recommendations tailored for you.</p>
        <a href="/login" className="btn-primary inline-block">Sign In</a>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
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
      {data?.data?.map((property: any) => (
        <PropertyCard key={property.id} property={property} />
      ))}
    </div>
  );
}
