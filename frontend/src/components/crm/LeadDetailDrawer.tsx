'use client';
import { X, Phone, MessageCircle, MapPin, IndianRupee, Brain } from 'lucide-react';
import { Lead, LeadStatus } from '@/types';
import { formatINR, getLeadPriorityColor, getScoreColor, timeAgo } from '@/lib/utils';

const STATUS_OPTIONS: LeadStatus[] = [
  'new', 'contacted', 'site_visit_scheduled', 'site_visit_done', 'negotiating', 'deal_closed', 'lost'
];

interface Props {
  lead: Lead;
  onClose: () => void;
  onStatusChange: (status: string) => void;
}

export default function LeadDetailDrawer({ lead, onClose, onStatusChange }: Props) {
  const factors = lead.score_factors as Record<string, { score: number; reason: string; max: number }>;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-5 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Lead Details</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* Buyer Info */}
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="font-bold text-gray-900 text-lg">{lead.buyer?.name}</div>
                <div className="text-gray-500 text-sm">{lead.buyer?.email}</div>
              </div>
              <span className={`badge capitalize ${getLeadPriorityColor(lead.priority)}`}>
                {lead.priority}
              </span>
            </div>
            <div className="flex gap-3">
              <a
                href={`tel:${lead.buyer?.phone}`}
                className="flex-1 flex items-center justify-center gap-2 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <Phone className="w-4 h-4" /> {lead.buyer?.phone}
              </a>
              <a
                href={`https://wa.me/91${lead.buyer?.phone}?text=Hi+${encodeURIComponent(lead.buyer?.name || '')}%2C+following+up+on+your+inquiry`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-2 px-3 text-sm border border-green-200 text-green-600 rounded-lg hover:bg-green-50"
              >
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </a>
            </div>
          </div>

          {/* Property */}
          {lead.property && (
            <div className="card p-4">
              <div className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">Interested In</div>
              <div className="font-semibold text-gray-900">{lead.property.title}</div>
              <div className="flex items-center gap-1 text-gray-500 text-sm mt-1">
                <MapPin className="w-3.5 h-3.5" />
                {lead.property.locality}, {lead.property.city}
              </div>
              <div className="flex items-center gap-1 text-blue-600 font-semibold mt-1">
                <IndianRupee className="w-3.5 h-3.5" />
                {formatINR(lead.property.price)}
              </div>
              {lead.budget && (
                <div className="text-xs text-gray-500 mt-1">
                  Buyer budget: {formatINR(lead.budget)}
                  {lead.budget >= lead.property.price * 0.9 ? (
                    <span className="text-green-600 ml-1">✓ Budget matches</span>
                  ) : (
                    <span className="text-amber-500 ml-1">⚠ Budget is lower</span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* AI Score */}
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-medium text-gray-700">AI Lead Score</span>
              <span className={`text-2xl font-bold ml-auto ${getScoreColor(lead.ai_score)}`}>
                {Math.round(lead.ai_score)}
                <span className="text-sm text-gray-400 font-normal">/100</span>
              </span>
            </div>

            {/* Score bar */}
            <div className="h-2 bg-gray-100 rounded-full mb-4">
              <div
                className={`h-2 rounded-full ${lead.ai_score >= 75 ? 'bg-green-500' : lead.ai_score >= 45 ? 'bg-amber-400' : 'bg-red-400'}`}
                style={{ width: `${lead.ai_score}%` }}
              />
            </div>

            {factors && Object.entries(factors).length > 0 && (
              <div className="space-y-2">
                {Object.entries(factors).map(([key, val]) => (
                  <div key={key} className="flex items-center gap-2 text-xs">
                    <div className="w-20 text-gray-500 capitalize">{key}</div>
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full">
                      <div
                        className="h-1.5 bg-blue-400 rounded-full"
                        style={{ width: `${(val.score / val.max) * 100}%` }}
                      />
                    </div>
                    <div className="text-gray-400">{Math.round(val.score)}/{val.max}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Update Status */}
          <div className="card p-4">
            <div className="text-sm font-medium text-gray-700 mb-3">Update Status</div>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => onStatusChange(s)}
                  className={`px-3 py-1.5 text-xs rounded-full border capitalize transition-colors ${
                    lead.status === s
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300'
                  }`}
                >
                  {s.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Meta */}
          <div className="text-xs text-gray-400 space-y-1 px-1">
            <div>Source: <span className="text-gray-600 capitalize">{lead.source}</span></div>
            <div>Created: <span className="text-gray-600">{timeAgo(lead.created_at)}</span></div>
            {lead.follow_up_date && (
              <div>Follow-up: <span className="text-amber-600 font-medium">
                {new Date(lead.follow_up_date).toLocaleDateString('en-IN')}
              </span></div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
