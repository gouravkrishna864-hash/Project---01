import BrokerHero from '@/components/broker-landing/BrokerHero';
import BrokerBenefits from '@/components/broker-landing/BrokerBenefits';
import BrokerHowItWorks from '@/components/broker-landing/BrokerHowItWorks';
import BrokerTestimonials from '@/components/broker-landing/BrokerTestimonials';
import BrokerCTA from '@/components/broker-landing/BrokerCTA';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Join REOS as a Broker — Get Verified Buyers, Free CRM, More Deals',
  description: 'Partner with REOS and get access to serious, AI-verified buyers. Free CRM, real-time lead alerts, and zero upfront cost. Trusted by 500+ brokers across India.',
};

export default function BrokerLandingPage() {
  return (
    <main className="min-h-screen bg-white">
      <BrokerHero />
      <BrokerBenefits />
      <BrokerHowItWorks />
      <BrokerTestimonials />
      <BrokerCTA />
    </main>
  );
}
