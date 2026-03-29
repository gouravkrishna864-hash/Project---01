'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, ArrowRight, Phone } from 'lucide-react';

export default function BrokerHero() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.match(/^[6-9]\d{9}$/)) {
      setSubmitted(true);
      // In production: POST to /api/broker-leads
      setTimeout(() => router.push('/register?role=broker'), 1500);
    }
  };

  const proof = [
    '✅ Free forever — no upfront cost',
    '✅ Verified buyers only, no junk leads',
    '✅ AI CRM to track & close deals',
    '✅ Used by 500+ brokers across India',
  ];

  return (
    <section className="bg-gradient-to-br from-slate-900 via-blue-950 to-blue-900 text-white py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left */}
          <div>
            <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 rounded-full px-4 py-1.5 text-sm text-blue-200 mb-6">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Now onboarding brokers in Pune, Mumbai &amp; Bangalore
            </div>

            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
              Get Verified Buyers.
              <br />
              <span className="text-amber-400">Close More Deals.</span>
            </h1>

            <p className="text-blue-200 text-lg mb-6 leading-relaxed">
              Stop chasing unqualified leads. REOS sends you AI-scored buyers
              who are actively looking for properties in your area.
              <strong className="text-white"> Free CRM included.</strong>
            </p>

            <ul className="space-y-2 mb-8">
              {proof.map((p) => (
                <li key={p} className="text-blue-100 text-sm">{p}</li>
              ))}
            </ul>
          </div>

          {/* Right — Lead Capture */}
          <div className="bg-white rounded-2xl p-8 text-gray-900 shadow-2xl">
            {submitted ? (
              <div className="text-center py-6">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <h3 className="text-xl font-bold text-gray-900">You're in!</h3>
                <p className="text-gray-500 mt-1">Taking you to complete your profile…</p>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-bold mb-1">Join as a Broker</h2>
                <p className="text-gray-500 text-sm mb-6">
                  Start getting leads in under 5 minutes.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">
                      Your Mobile Number
                    </label>
                    <div className="flex gap-2">
                      <span className="flex items-center px-3 bg-gray-100 border border-gray-200 rounded-lg text-gray-500 text-sm">
                        🇮🇳 +91
                      </span>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="9876543210"
                        maxLength={10}
                        className="input flex-1"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-base"
                  >
                    Get Started Free <ArrowRight className="w-4 h-4" />
                  </button>
                </form>

                <div className="flex items-center gap-2 mt-4 text-xs text-gray-400">
                  <Phone className="w-3 h-3" />
                  Or WhatsApp us:{' '}
                  <a
                    href="https://wa.me/919999999999?text=Hi%2C+I+want+to+join+REOS+as+a+broker"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-600 font-medium hover:underline"
                  >
                    +91 9999 999 999
                  </a>
                </div>

                <p className="text-xs text-gray-400 mt-3 text-center">
                  No credit card required. Cancel anytime.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
