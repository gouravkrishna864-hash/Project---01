'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadsApi } from '@/lib/api';
import { Lead, LeadStatus } from '@/types';
import { formatINR, getLeadPriorityColor, timeAgo } from '@/lib/utils';
import { Phone, MessageCircle, Calendar, ChevronRight, Filter } from 'lucide-react';
import LeadDetailDrawer from '@/components/crm/LeadDetailDrawer';
import FollowUpModal from '@/components/crm/FollowUpModal';
import toast from 'react-hot-toast';

const PIPELINE_COLS: { key: LeadStatus; label: string; color: string }[] = [
  { key: 'new',                   label: 'New',           color: 'border-gray-300 bg-gray-50' },
  { key: 'contacted',             label: 'Contacted',     color: 'border-blue-300 bg-blue-50' },
  { key: 'site_visit_scheduled',  label: 'Visit Sched.', color: 'border-purple-300 bg-purple-50' },
  { key: 'site_visit_done',       label: 'Visit Done',   color: 'border-amber-300 bg-amber-50' },
  { key: 'negotiating',           label: 'Negotiating',  color: 'border-orange-300 bg-orange-50' },
  { key: 'deal_closed',           label: 'Closed 🎉',     color: 'border-green-300 bg-green-50' },
];

export default function CRMPage() {
  const qc = useQueryClient();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [followUpLead, setFollowUpLead] = useState<Lead | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  const { data, isLoading } = useQuery({
    queryKey: ['broker-leads-crm', priorityFilter],
    queryFn: () => leadsApi.getBrokerLeads({
      priority: priorityFilter !== 'all' ? priorityFilter : undefined,
      limit: 100,
    } as any),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      leadsApi.updateStatus(id, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['broker-leads-crm'] });
      toast.success('Lead status updated');
    },
  });

  const leads: Lead[] = data?.data || [];

  const leadsBy = (status: LeadStatus) =>
    leads.filter((l) => l.status === status)
         .sort((a, b) => b.ai_score - a.ai_score);

  const NEXT_STATUS: Partial<Record<LeadStatus, LeadStatus>> = {
    new: 'contacted',
    contacted: 'site_visit_scheduled',
    site_visit_scheduled: 'site_visit_done',
    site_visit_done: 'negotiating',
    negotiating: 'deal_closed',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10 px-4 py-3">
        <div className="max-w-full mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">CRM Pipeline</h1>
            <p className="text-sm text-gray-500">{leads.length} active leads</p>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <div className="flex gap-1">
              {['all', 'hot', 'warm', 'cold'].map((p) => (
                <button
                  key={p}
                  onClick={() => setPriorityFilter(p)}
                  className={`px-3 py-1 text-xs rounded-full border capitalize transition-colors ${
                    priorityFilter === p
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="p-4 overflow-x-auto">
        <div className="flex gap-4 min-w-max pb-4">
          {PIPELINE_COLS.map((col) => {
            const colLeads = leadsBy(col.key);
            return (
              <div key={col.key} className="w-72 flex-shrink-0">
                {/* Column Header */}
                <div className={`rounded-t-xl border-t-4 ${col.color} px-4 py-3 border-l border-r border-t bg-white`}>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-gray-900">{col.label}</span>
                    <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-full">
                      {colLeads.length}
                    </span>
                  </div>
                </div>

                {/* Cards */}
                <div className="space-y-2 bg-gray-100/60 min-h-48 p-2 rounded-b-xl border border-gray-200 border-t-0">
                  {isLoading ? (
                    Array.from({ length: 2 }).map((_, i) => (
                      <div key={i} className="h-28 bg-white rounded-xl animate-pulse" />
                    ))
                  ) : colLeads.length === 0 ? (
                    <div className="text-center py-8 text-gray-300 text-sm">No leads here</div>
                  ) : (
                    colLeads.map((lead) => (
                      <LeadCard
                        key={lead.id}
                        lead={lead}
                        nextStatus={NEXT_STATUS[lead.status]}
                        onOpen={() => setSelectedLead(lead)}
                        onAdvance={() => {
                          const next = NEXT_STATUS[lead.status];
                          if (next) statusMutation.mutate({ id: lead.id, status: next });
                        }}
                        onFollowUp={() => setFollowUpLead(lead)}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedLead && (
        <LeadDetailDrawer
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onStatusChange={(status) => {
            statusMutation.mutate({ id: selectedLead.id, status });
            setSelectedLead(null);
          }}
        />
      )}

      {followUpLead && (
        <FollowUpModal
          lead={followUpLead}
          onClose={() => setFollowUpLead(null)}
        />
      )}
    </div>
  );
}

function LeadCard({
  lead, nextStatus, onOpen, onAdvance, onFollowUp,
}: {
  lead: Lead;
  nextStatus?: LeadStatus;
  onOpen: () => void;
  onAdvance: () => void;
  onFollowUp: () => void;
}) {
  return (
    <div
      className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
      onClick={onOpen}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="font-semibold text-sm text-gray-900">{lead.buyer?.name}</div>
          <div className="text-xs text-gray-400">{timeAgo(lead.created_at)}</div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`badge text-xs capitalize ${getLeadPriorityColor(lead.priority)}`}>
            {lead.priority}
          </span>
          <div className={`text-xs font-bold w-8 h-8 rounded-full flex items-center justify-center ${
            lead.ai_score >= 75 ? 'bg-green-50 text-green-600' :
            lead.ai_score >= 45 ? 'bg-amber-50 text-amber-600' :
            'bg-gray-50 text-gray-400'
          }`}>
            {Math.round(lead.ai_score)}
          </div>
        </div>
      </div>

      {lead.property && (
        <div className="text-xs text-gray-500 mb-2 truncate">
          📍 {lead.property.locality}, {lead.property.city}
        </div>
      )}

      {lead.budget && (
        <div className="text-xs text-blue-600 font-medium mb-3">
          Budget: {formatINR(lead.budget)}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-1.5 mt-1" onClick={(e) => e.stopPropagation()}>
        <a
          href={`tel:${lead.buyer?.phone}`}
          className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600"
        >
          <Phone className="w-3 h-3" /> Call
        </a>
        <a
          href={`https://wa.me/91${lead.buyer?.phone}?text=Hi+${encodeURIComponent(lead.buyer?.name || '')}%2C+I%27m+following+up+on+your+property+inquiry`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs border border-green-200 rounded-lg hover:bg-green-50 text-green-600"
          onClick={(e) => e.stopPropagation()}
        >
          <MessageCircle className="w-3 h-3" /> WA
        </a>
        <button
          onClick={(e) => { e.stopPropagation(); onFollowUp(); }}
          className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs border border-blue-200 rounded-lg hover:bg-blue-50 text-blue-600"
        >
          <Calendar className="w-3 h-3" /> Follow
        </button>
        {nextStatus && (
          <button
            onClick={(e) => { e.stopPropagation(); onAdvance(); }}
            className="flex items-center justify-center py-1.5 px-2 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            title={`Move to ${nextStatus}`}
          >
            <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}
