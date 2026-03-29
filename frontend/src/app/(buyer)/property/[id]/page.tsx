'use client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { propertiesApi, leadsApi, transactionsApi, aiApi } from '@/lib/api';
import { formatINR, formatArea, bhkLabel, timeAgo } from '@/lib/utils';
import { MapPin, BedDouble, Maximize2, BadgeCheck, Phone, Calendar, TrendingUp, Star } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/lib/store';

export default function PropertyPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const [activeImage, setActiveImage] = useState(0);
  const [offerPrice, setOfferPrice] = useState('');
  const [showOfferModal, setShowOfferModal] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['property', id],
    queryFn: () => propertiesApi.get(id),
    enabled: !!id,
  });

  const { data: priceTrend } = useQuery({
    queryKey: ['price-trend', data?.data?.city, data?.data?.type],
    queryFn: () => propertiesApi.getPriceTrend({
      city: data!.data.city,
      type: data!.data.type,
      bedrooms: data!.data.bedrooms,
    }),
    enabled: !!data?.data,
  });

  const expressMutation = useMutation({
    mutationFn: () => leadsApi.create({ property_id: id, budget: user?.preferences?.budget_max }),
    onSuccess: () => toast.success('Interest registered! Broker will contact you soon.'),
    onError: () => toast.error('Failed to register interest'),
  });

  const offerMutation = useMutation({
    mutationFn: () => transactionsApi.makeOffer({
      property_id: id,
      offer_price: Number(offerPrice),
    }),
    onSuccess: () => {
      toast.success('Offer submitted successfully!');
      setShowOfferModal(false);
      setOfferPrice('');
    },
    onError: () => toast.error('Failed to submit offer'),
  });

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 animate-pulse">
        <div className="bg-gray-200 h-96 rounded-2xl mb-6" />
        <div className="bg-gray-200 h-8 rounded w-1/2 mb-4" />
        <div className="bg-gray-200 h-4 rounded w-1/3" />
      </div>
    );
  }

  const property = data?.data;
  if (!property) return <div className="text-center py-20 text-gray-400">Property not found.</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Image Gallery */}
        <div className="mb-6">
          <div className="relative h-80 md:h-[450px] rounded-2xl overflow-hidden bg-gray-100 mb-3">
            {property.images?.[activeImage] ? (
              <img
                src={property.images[activeImage]}
                alt={property.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-6xl">🏠</div>
            )}
            {property.is_verified && (
              <div className="absolute top-4 left-4 badge badge-verified flex items-center gap-1 px-3 py-1.5">
                <BadgeCheck className="w-4 h-4" /> Verified
              </div>
            )}
            {property.is_featured && (
              <div className="absolute top-4 right-4 badge badge-featured flex items-center gap-1 px-3 py-1.5">
                <Star className="w-4 h-4" /> Featured
              </div>
            )}
          </div>
          {property.images?.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {property.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-colors ${
                    activeImage === i ? 'border-blue-500' : 'border-transparent'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card p-6">
              <div className="flex items-start justify-between mb-2">
                <h1 className="text-2xl font-bold text-gray-900 flex-1 mr-4">{property.title}</h1>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-700">{formatINR(property.price)}</div>
                  {property.listing_type === 'rent' && <div className="text-gray-400 text-sm">/month</div>}
                  {property.price_per_sqft && (
                    <div className="text-sm text-gray-400">₹{property.price_per_sqft.toLocaleString('en-IN')}/sqft</div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 text-gray-500 mb-4">
                <MapPin className="w-4 h-4" />
                <span>{property.address}, {property.locality}, {property.city}</span>
              </div>

              <div className="flex flex-wrap gap-4 text-gray-700 text-sm border-t border-b border-gray-100 py-4">
                {property.bedrooms && (
                  <div className="flex items-center gap-1.5">
                    <BedDouble className="w-4 h-4 text-gray-400" />
                    {bhkLabel(property.bedrooms)}
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Maximize2 className="w-4 h-4 text-gray-400" />
                  {formatArea(property.area_sqft)}
                </div>
                {property.furnishing && (
                  <span className="capitalize text-gray-600">{property.furnishing}</span>
                )}
                {property.floor && (
                  <span>Floor {property.floor}/{property.total_floors}</span>
                )}
              </div>

              {property.description && (
                <div className="mt-4">
                  <h3 className="font-semibold mb-2">About this property</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{property.description}</p>
                </div>
              )}

              {property.amenities?.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-semibold mb-2">Amenities</h3>
                  <div className="flex flex-wrap gap-2">
                    {property.amenities.map((a) => (
                      <span key={a} className="badge bg-gray-100 text-gray-600 border-gray-200 capitalize">{a}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Price Trend */}
            {priceTrend?.data?.trend?.length > 0 && (
              <div className="card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold">Price Trend — {property.city}</h3>
                  {priceTrend.data.growth_rate_3m != null && (
                    <span className={`badge ml-auto ${priceTrend.data.growth_rate_3m >= 0 ? 'badge-verified' : 'bg-red-50 text-red-600 border-red-200'}`}>
                      {priceTrend.data.growth_rate_3m >= 0 ? '+' : ''}{priceTrend.data.growth_rate_3m}% (3M)
                    </span>
                  )}
                </div>
                <div className="flex items-end gap-1 h-24">
                  {priceTrend.data.trend.map((d: any) => {
                    const max = Math.max(...priceTrend.data.trend.map((x: any) => x.avg_price_per_sqft));
                    const pct = max > 0 ? (d.avg_price_per_sqft / max) * 100 : 0;
                    return (
                      <div key={d.month} className="flex-1 flex flex-col items-center gap-1 group">
                        <div
                          className="w-full bg-blue-200 group-hover:bg-blue-400 transition-colors rounded-t"
                          style={{ height: `${pct}%` }}
                          title={`₹${d.avg_price_per_sqft}/sqft`}
                        />
                        <span className="text-gray-400 text-xs hidden md:block">{d.month.slice(5)}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="text-xs text-gray-400 mt-2">
                  Current avg: ₹{priceTrend.data.current_avg_psf?.toLocaleString('en-IN')}/sqft
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Actions */}
          <div className="space-y-4">
            <div className="card p-5 space-y-3">
              <h3 className="font-semibold">Interested?</h3>
              <button
                onClick={() => expressMutation.mutate()}
                disabled={expressMutation.isPending}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4" />
                {expressMutation.isPending ? 'Registering...' : 'Express Interest'}
              </button>
              <button
                onClick={() => setShowOfferModal(true)}
                className="btn-outline w-full"
              >
                Make an Offer
              </button>
              <button className="w-full flex items-center justify-center gap-2 border border-gray-200 text-gray-600 py-2 rounded-lg hover:bg-gray-50 text-sm">
                <Calendar className="w-4 h-4" />
                Schedule a Visit
              </button>
            </div>

            <div className="card p-5">
              <div className="text-xs text-gray-400 space-y-1.5">
                <div className="flex justify-between">
                  <span>Views</span><span className="font-medium text-gray-700">{property.views_count}</span>
                </div>
                <div className="flex justify-between">
                  <span>Leads</span><span className="font-medium text-gray-700">{property.leads_count}</span>
                </div>
                <div className="flex justify-between">
                  <span>Listed</span><span className="font-medium text-gray-700">{timeAgo(property.created_at)}</span>
                </div>
                {property.rera_number && (
                  <div className="flex justify-between">
                    <span>RERA</span><span className="font-medium text-gray-700">{property.rera_number}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Offer Modal */}
      {showOfferModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-1">Make an Offer</h2>
            <p className="text-gray-500 text-sm mb-4">Listed at {formatINR(property.price)}</p>
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 block mb-1">Your Offer Price (₹)</label>
              <input
                type="number"
                value={offerPrice}
                onChange={(e) => setOfferPrice(e.target.value)}
                placeholder={String(property.price)}
                className="input"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowOfferModal(false)} className="btn-outline flex-1">
                Cancel
              </button>
              <button
                onClick={() => offerMutation.mutate()}
                disabled={!offerPrice || offerMutation.isPending}
                className="btn-primary flex-1"
              >
                {offerMutation.isPending ? 'Submitting...' : 'Submit Offer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
