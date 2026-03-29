'use client';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Maximize2, BedDouble, BadgeCheck, Star } from 'lucide-react';
import { Property } from '@/types';
import { formatINR, formatArea, bhkLabel } from '@/lib/utils';

interface PropertyCardProps {
  property: Property;
  showScore?: boolean;
  aiScore?: number;
}

export default function PropertyCard({ property, showScore, aiScore }: PropertyCardProps) {
  const thumbnail = property.images?.[0] || '/placeholder-property.jpg';

  return (
    <Link href={`/property/${property.id}`} className="block">
      <article className="card overflow-hidden group cursor-pointer">
        {/* Image */}
        <div className="relative h-52 overflow-hidden bg-gray-100">
          <img
            src={thumbnail}
            alt={property.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-3 left-3 flex gap-1.5">
            {property.is_featured && (
              <span className="badge badge-featured flex items-center gap-1">
                <Star className="w-3 h-3" /> Featured
              </span>
            )}
            {property.is_verified && (
              <span className="badge badge-verified flex items-center gap-1">
                <BadgeCheck className="w-3 h-3" /> Verified
              </span>
            )}
          </div>
          <div className="absolute top-3 right-3">
            <span className="bg-black/60 text-white text-xs px-2 py-1 rounded-full">
              {property.listing_type === 'rent' ? 'RENT' : 'SALE'}
            </span>
          </div>
          {showScore && aiScore !== undefined && (
            <div className="absolute bottom-3 right-3">
              <div className={`text-xs font-bold px-2 py-1 rounded-full ${
                aiScore >= 75 ? 'bg-red-500 text-white' :
                aiScore >= 45 ? 'bg-amber-500 text-white' :
                'bg-blue-500 text-white'
              }`}>
                AI: {Math.round(aiScore)}
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start justify-between mb-1.5">
            <h3 className="text-base font-semibold text-gray-900 leading-tight line-clamp-1">
              {property.title}
            </h3>
          </div>

          <div className="flex items-center gap-1 text-gray-500 text-sm mb-3">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="line-clamp-1">{property.locality}, {property.city}</span>
          </div>

          <div className="flex items-center gap-4 text-gray-600 text-sm mb-3">
            {property.bedrooms && (
              <span className="flex items-center gap-1">
                <BedDouble className="w-4 h-4" />
                {bhkLabel(property.bedrooms)}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Maximize2 className="w-4 h-4" />
              {formatArea(property.area_sqft)}
            </span>
            {property.price_per_sqft && (
              <span className="text-xs text-gray-400">
                ₹{property.price_per_sqft.toLocaleString('en-IN')}/sqft
              </span>
            )}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div>
              <span className="text-lg font-bold text-blue-700">
                {formatINR(property.price)}
              </span>
              {property.listing_type === 'rent' && (
                <span className="text-gray-400 text-sm">/month</span>
              )}
            </div>
            <button
              className="text-xs btn-primary py-1.5 px-3"
              onClick={(e) => {
                e.preventDefault();
                window.location.href = `/property/${property.id}`;
              }}
            >
              View Details
            </button>
          </div>
        </div>
      </article>
    </Link>
  );
}
