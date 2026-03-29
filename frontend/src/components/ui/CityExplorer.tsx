'use client';
import Link from 'next/link';

const CITIES = [
  { name: 'Mumbai', count: '2,400+', emoji: '🏙️' },
  { name: 'Pune', count: '1,800+', emoji: '🌆' },
  { name: 'Bangalore', count: '2,100+', emoji: '🏢' },
  { name: 'Hyderabad', count: '1,600+', emoji: '🏗️' },
  { name: 'Delhi NCR', count: '2,800+', emoji: '🌃' },
  { name: 'Chennai', count: '1,200+', emoji: '🌇' },
];

export default function CityExplorer() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
      {CITIES.map((city) => (
        <Link
          key={city.name}
          href={`/search?city=${encodeURIComponent(city.name)}`}
          className="card p-4 text-center hover:border-blue-300 hover:bg-blue-50 transition-all group"
        >
          <div className="text-3xl mb-2">{city.emoji}</div>
          <div className="font-semibold text-gray-900 group-hover:text-blue-700 text-sm">
            {city.name}
          </div>
          <div className="text-xs text-gray-400 mt-0.5">{city.count} listings</div>
        </Link>
      ))}
    </div>
  );
}
