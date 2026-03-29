import { Suspense } from 'react';
import HeroSearch from '@/components/search/HeroSearch';
import FeaturedProperties from '@/components/property/FeaturedProperties';
import RecommendedProperties from '@/components/property/RecommendedProperties';
import StatsBar from '@/components/ui/StatsBar';
import CityExplorer from '@/components/ui/CityExplorer';

export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-700/50 border border-blue-500/30 rounded-full px-4 py-1.5 text-sm text-blue-100 mb-6">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            AI-Powered Real Estate Platform
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">
            Find Your Perfect
            <br />
            <span className="text-amber-400">Property</span> in India
          </h1>
          <p className="text-blue-200 text-lg mb-10 max-w-2xl mx-auto">
            Verified listings. AI pricing. Faster deals. Trusted by buyers, brokers, and builders.
          </p>
          <HeroSearch />
        </div>
      </section>

      {/* Stats */}
      <StatsBar />

      {/* Featured Properties */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2>Featured Properties</h2>
          <a href="/search" className="text-blue-600 text-sm font-medium hover:underline">
            View all →
          </a>
        </div>
        <Suspense fallback={<PropertyGridSkeleton />}>
          <FeaturedProperties />
        </Suspense>
      </section>

      {/* City Explorer */}
      <section className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="mb-6">Explore by City</h2>
          <CityExplorer />
        </div>
      </section>

      {/* Recommended */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="mb-6">Recommended for You</h2>
        <Suspense fallback={<PropertyGridSkeleton />}>
          <RecommendedProperties />
        </Suspense>
      </section>
    </main>
  );
}

function PropertyGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="card p-4 animate-pulse">
          <div className="bg-gray-200 h-48 rounded-lg mb-4" />
          <div className="bg-gray-200 h-4 rounded w-3/4 mb-2" />
          <div className="bg-gray-200 h-4 rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}
