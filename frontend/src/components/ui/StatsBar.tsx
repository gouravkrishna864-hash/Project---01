export default function StatsBar() {
  const stats = [
    { label: 'Verified Listings', value: '10,000+' },
    { label: 'Cities', value: '25+' },
    { label: 'Successful Deals', value: '2,500+' },
    { label: 'Active Brokers', value: '500+' },
  ];

  return (
    <div className="bg-white border-b border-gray-100 py-5 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl font-bold text-blue-700">{stat.value}</div>
              <div className="text-sm text-gray-500 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
