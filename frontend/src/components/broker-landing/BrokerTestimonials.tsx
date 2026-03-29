const testimonials = [
  {
    name: 'Suresh Patil',
    city: 'Pune',
    role: 'Independent Broker',
    avatar: 'SP',
    deals: 12,
    quote:
      'Earlier I was getting 50 random inquiries a week and closing maybe 1. With REOS I get 15 AI-scored leads and close 3–4. Quality > quantity.',
  },
  {
    name: 'Meena Iyer',
    city: 'Bangalore',
    role: 'Senior Property Consultant',
    avatar: 'MI',
    deals: 8,
    quote:
      'The CRM follow-up reminders alone saved me 2 deals I would have forgotten. The WhatsApp one-click is a game-changer.',
  },
  {
    name: 'Arjun Mehta',
    city: 'Mumbai',
    role: 'Broker, RE/MAX Partner',
    avatar: 'AM',
    deals: 21,
    quote:
      'I listed 40 properties in one week. Within 10 days I had my first REOS deal. The Verified badge makes buyers trust my listings immediately.',
  },
];

export default function BrokerTestimonials() {
  return (
    <section className="py-20 px-4 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Brokers Love REOS</h2>
          <p className="text-gray-500">Real results from brokers across India.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div key={t.name} className="card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {t.avatar}
                </div>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">{t.name}</div>
                  <div className="text-xs text-gray-400">{t.role} · {t.city}</div>
                </div>
                <div className="ml-auto text-right">
                  <div className="text-lg font-bold text-green-600">{t.deals}</div>
                  <div className="text-xs text-gray-400">deals closed</div>
                </div>
              </div>
              <blockquote className="text-gray-600 text-sm leading-relaxed italic">
                "{t.quote}"
              </blockquote>
              <div className="flex gap-0.5 mt-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className="text-amber-400 text-sm">★</span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Social proof numbers */}
        <div className="mt-12 grid grid-cols-3 gap-4 text-center">
          {[
            { value: '500+', label: 'Active Brokers' },
            { value: '₹120Cr+', label: 'GMV Facilitated' },
            { value: '4.8/5', label: 'Broker Rating' },
          ].map((stat) => (
            <div key={stat.label} className="card p-5">
              <div className="text-2xl font-bold text-blue-700">{stat.value}</div>
              <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
