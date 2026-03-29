'use client';
import { useQuery } from '@tanstack/react-query';
import { leadsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { formatINR, getLeadPriorityColor, timeAgo } from '@/lib/utils';
import { Users, TrendingUp, Phone, CheckCircle, Flame } from 'lucide-react';
import Link from 'next/link';

const STATUS_STEPS = [
  'new', 'contacted', 'site_visit_scheduled', 'site_visit_done', 'negotiating', 'deal_closed'
];

export default function BrokerDashboard() {
  const { user } = useAuthStore();

  const { data: leadsData, isLoading } = useQuery({
    queryKey: ['broker-leads'],
    queryFn: () => leadsApi.getBrokerLeads({ page: 1 }),
    enabled: !!user && user.role === 'broker',
  });

  const { data: statsData } = useQuery({
    queryKey: ['lead-stats'],
    queryFn: leadsApi.getStats,
    enabled: !!user && user.role === 'broker',
  });

  const leads = leadsData?.data || [];
  const hotLeads = leads.filter((l: any) => l.priority === 'hot');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1>Broker Dashboard</h1>
            <p className="text-gray-500 mt-1">Manage leads, track deals, close faster.</p>
          </div>
          <Link href="/broker/properties/new" className="btn-primary">
            + Add Property
          </Link>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="card p-5">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              <Users className="w-4 h-4" /> Total Leads
            </div>
            <div className="text-3xl font-bold">{leads.length}</div>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-2 text-red-500 text-sm mb-1">
              <Flame className="w-4 h-4" /> Hot Leads
            </div>
            <div className="text-3xl font-bold text-red-600">{hotLeads.length}</div>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-2 text-green-500 text-sm mb-1">
              <CheckCircle className="w-4 h-4" /> Deals Closed
            </div>
            <div className="text-3xl font-bold text-green-600">
              {leads.filter((l: any) => l.status === 'deal_closed').length}
            </div>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-2 text-blue-500 text-sm mb-1">
              <TrendingUp className="w-4 h-4" /> Avg AI Score
            </div>
            <div className="text-3xl font-bold text-blue-600">
              {leads.length > 0
                ? Math.round(leads.reduce((s: number, l: any) => s + l.ai_score, 0) / leads.length)
                : '—'}
            </div>
          </div>
        </div>

        {/* Lead Pipeline Table */}
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Lead Pipeline</h2>
            <div className="flex gap-2">
              {['hot', 'warm', 'cold'].map((p) => (
                <span key={p} className={`badge capitalize ${getLeadPriorityColor(p)}`}>{p}</span>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : leads.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>No leads yet. Add properties to start getting leads.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {leads.map((lead: any) => (
                <div key={lead.id} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50">
                  {/* Priority */}
                  <span className={`badge capitalize w-14 justify-center ${getLeadPriorityColor(lead.priority)}`}>
                    {lead.priority}
                  </span>

                  {/* Buyer Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900">{lead.buyer?.name || 'Unknown'}</div>
                    <div className="text-xs text-gray-500 truncate">
                      {lead.property?.title} · {lead.property?.city}
                    </div>
                  </div>

                  {/* Budget */}
                  <div className="text-right hidden sm:block">
                    <div className="text-sm font-semibold text-gray-900">
                      {lead.budget ? formatINR(lead.budget) : '—'}
                    </div>
                    <div className="text-xs text-gray-400">Budget</div>
                  </div>

                  {/* AI Score */}
                  <div className={`text-center w-14 hidden md:block`}>
                    <div className={`text-lg font-bold ${
                      lead.ai_score >= 75 ? 'text-green-600' :
                      lead.ai_score >= 45 ? 'text-amber-500' : 'text-gray-400'
                    }`}>
                      {Math.round(lead.ai_score)}
                    </div>
                    <div className="text-xs text-gray-400">Score</div>
                  </div>

                  {/* Status */}
                  <div className="text-xs text-gray-500 hidden lg:block w-32 text-right">
                    {lead.status.replace(/_/g, ' ')}
                    <br />
                    <span className="text-gray-300">{timeAgo(lead.created_at)}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <a
                      href={`tel:${lead.buyer?.phone}`}
                      className="btn-outline py-1.5 px-2 text-xs flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3" /> Call
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
