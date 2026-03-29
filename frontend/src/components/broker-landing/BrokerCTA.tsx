import Link from 'next/link';
import { ArrowRight, MessageCircle } from 'lucide-react';

export default function BrokerCTA() {
  return (
    <section className="py-20 px-4 bg-blue-900 text-white">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Ready to 3x Your Deals?
        </h2>
        <p className="text-blue-200 text-lg mb-10 max-w-xl mx-auto">
          Join 500+ brokers already growing their business with REOS.
          Free to start. No contracts. Cancel anytime.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Link
            href="/register?role=broker"
            className="inline-flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300 text-gray-900 font-bold px-8 py-4 rounded-xl text-base transition-colors"
          >
            Start Free — Join REOS <ArrowRight className="w-5 h-5" />
          </Link>
          <a
            href="https://wa.me/919999999999?text=Hi%2C+I+want+to+know+more+about+REOS+for+brokers"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-400 text-white font-bold px-8 py-4 rounded-xl text-base transition-colors"
          >
            <MessageCircle className="w-5 h-5" /> WhatsApp Us
          </a>
        </div>

        <p className="text-blue-400 text-sm">
          Questions? Call us: <span className="text-white font-medium">+91 9999 999 999</span>
          &nbsp;·&nbsp; Mon–Sat, 9AM–7PM
        </p>
      </div>
    </section>
  );
}
