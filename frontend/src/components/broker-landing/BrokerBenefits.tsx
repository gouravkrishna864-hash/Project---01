import { Zap, Brain, BarChart3, Shield, MessageSquare, IndianRupee } from 'lucide-react';

const benefits = [
  {
    icon: Zap,
    color: 'text-amber-500 bg-amber-50',
    title: 'Instant Lead Alerts',
    desc: 'Get notified the moment a serious buyer shows interest in your listing. SMS + WhatsApp + in-app.',
  },
  {
    icon: Brain,
    color: 'text-purple-500 bg-purple-50',
    title: 'AI Lead Scoring',
    desc: 'Every lead is scored 0–100 by AI. Focus only on Hot leads. Stop wasting time on tire-kickers.',
  },
  {
    icon: BarChart3,
    color: 'text-blue-500 bg-blue-50',
    title: 'Free CRM Dashboard',
    desc: 'Track every lead from first contact to deal close. Follow-up reminders, visit scheduling, notes.',
  },
  {
    icon: Shield,
    color: 'text-green-500 bg-green-50',
    title: 'Verified Listings Badge',
    desc: 'Get your properties verified by REOS. Verified listings get 3x more buyer inquiries.',
  },
  {
    icon: MessageSquare,
    color: 'text-rose-500 bg-rose-50',
    title: 'WhatsApp Integration',
    desc: 'One-click WhatsApp to every lead. All conversations tracked automatically in CRM.',
  },
  {
    icon: IndianRupee,
    color: 'text-teal-500 bg-teal-50',
    title: 'Zero Upfront Cost',
    desc: 'List unlimited properties for free. We only earn when you close a deal. Pure win-win.',
  },
];

export default function BrokerBenefits() {
  return (
    <section className="py-20 px-4 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Everything You Need to Close More Deals
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            REOS is your complete operating system — from lead generation to deal closure.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map(({ icon: Icon, color, title, desc }) => (
            <div key={title} className="card p-6 hover:shadow-lg transition-shadow">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
