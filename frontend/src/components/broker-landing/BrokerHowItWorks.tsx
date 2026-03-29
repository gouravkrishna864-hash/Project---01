const steps = [
  {
    number: '01',
    title: 'Register in 2 minutes',
    desc: 'Sign up with your mobile number. Add your RERA number and city. No documents needed to start.',
    color: 'bg-blue-600',
  },
  {
    number: '02',
    title: 'Upload your properties',
    desc: 'Add property details, photos, and price. Our team verifies within 24 hours and gives you the Verified badge.',
    color: 'bg-purple-600',
  },
  {
    number: '03',
    title: 'Get AI-scored leads',
    desc: 'Buyers find your listings. Every inquiry is scored by AI. You see the score, budget, and intent before calling.',
    color: 'bg-amber-600',
  },
  {
    number: '04',
    title: 'Close deals, earn more',
    desc: 'Use the built-in CRM to follow up, schedule visits, and close. Track every deal from offer to registration.',
    color: 'bg-green-600',
  },
];

export default function BrokerHowItWorks() {
  return (
    <section className="py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">How It Works</h2>
          <p className="text-gray-500">From sign-up to your first deal in under a week.</p>
        </div>

        <div className="relative">
          {/* Connector line */}
          <div className="hidden md:block absolute top-8 left-[calc(12.5%-1px)] right-[calc(12.5%-1px)] h-0.5 bg-gradient-to-r from-blue-600 via-purple-500 via-amber-500 to-green-600" />

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {steps.map((step) => (
              <div key={step.number} className="relative text-center">
                <div className={`w-16 h-16 ${step.color} rounded-2xl flex items-center justify-center text-white text-xl font-bold mx-auto mb-5 shadow-lg`}>
                  {step.number}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Funnel visual */}
        <div className="mt-14 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 border border-blue-100">
          <div className="text-center mb-6">
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
              Broker Growth Funnel
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 flex-wrap text-sm font-medium">
            {[
              { label: 'Click Link', bg: 'bg-blue-100 text-blue-700' },
              { label: '→' , bg: 'bg-transparent text-gray-400'},
              { label: 'Register', bg: 'bg-purple-100 text-purple-700' },
              { label: '→', bg: 'bg-transparent text-gray-400' },
              { label: 'Upload Properties', bg: 'bg-amber-100 text-amber-700' },
              { label: '→', bg: 'bg-transparent text-gray-400' },
              { label: 'Get Leads', bg: 'bg-green-100 text-green-700' },
              { label: '→', bg: 'bg-transparent text-gray-400' },
              { label: 'Close Deals 💰', bg: 'bg-rose-100 text-rose-700' },
            ].map((item, i) => (
              <span key={i} className={`px-3 py-1.5 rounded-full ${item.bg}`}>
                {item.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
