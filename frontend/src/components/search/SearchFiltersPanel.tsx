'use client';
import { useSearchStore } from '@/lib/store';

const PROPERTY_TYPES = ['apartment', 'villa', 'house', 'plot', 'commercial', 'pg'];
const BHK_OPTIONS = [1, 2, 3, 4, 5];

export default function SearchFiltersPanel() {
  const { filters, setFilters, resetFilters } = useSearchStore();

  return (
    <div className="card p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Filters</h3>
        <button onClick={resetFilters} className="text-sm text-blue-600 hover:underline">
          Reset
        </button>
      </div>

      {/* Listing Type */}
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-2">Looking to</label>
        <div className="flex gap-2">
          {['sale', 'rent'].map((type) => (
            <button
              key={type}
              onClick={() => setFilters({ listing_type: type as any })}
              className={`flex-1 py-2 text-sm rounded-lg border font-medium transition-colors ${
                filters.listing_type === type
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
              }`}
            >
              {type === 'sale' ? 'Buy' : 'Rent'}
            </button>
          ))}
        </div>
      </div>

      {/* Budget */}
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-2">Max Budget</label>
        <select
          className="input"
          value={filters.max_price || ''}
          onChange={(e) => setFilters({ max_price: e.target.value ? Number(e.target.value) : undefined })}
        >
          <option value="">Any Budget</option>
          <option value="2500000">Under ₹25L</option>
          <option value="5000000">Under ₹50L</option>
          <option value="10000000">Under ₹1Cr</option>
          <option value="15000000">Under ₹1.5Cr</option>
          <option value="25000000">Under ₹2.5Cr</option>
          <option value="50000000">Under ₹5Cr</option>
        </select>
      </div>

      {/* Property Type */}
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-2">Property Type</label>
        <div className="flex flex-wrap gap-2">
          {PROPERTY_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => setFilters({ type: filters.type === type ? undefined : type as any })}
              className={`px-3 py-1.5 text-xs rounded-full border capitalize transition-colors ${
                filters.type === type
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* BHK */}
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-2">BHK</label>
        <div className="flex gap-2">
          {BHK_OPTIONS.map((bhk) => (
            <button
              key={bhk}
              onClick={() => setFilters({ bedrooms: filters.bedrooms === bhk ? undefined : bhk })}
              className={`flex-1 py-1.5 text-sm rounded-lg border font-medium transition-colors ${
                filters.bedrooms === bhk
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
              }`}
            >
              {bhk}
            </button>
          ))}
        </div>
      </div>

      {/* Verified */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="verified"
          checked={filters.is_verified ?? false}
          onChange={(e) => setFilters({ is_verified: e.target.checked || undefined })}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="verified" className="text-sm text-gray-700">
          Verified listings only
        </label>
      </div>
    </div>
  );
}
