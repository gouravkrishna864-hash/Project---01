'use client';
import { useState } from 'react';
import { X, Calendar } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { leadsApi } from '@/lib/api';
import { Lead } from '@/types';
import toast from 'react-hot-toast';

interface Props {
  lead: Lead;
  onClose: () => void;
}

const QUICK_PRESETS = [
  { label: 'Tomorrow', days: 1 },
  { label: 'In 3 days', days: 3 },
  { label: 'Next week', days: 7 },
  { label: 'In 2 weeks', days: 14 },
];

export default function FollowUpModal({ lead, onClose }: Props) {
  const qc = useQueryClient();
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState(lead.notes || '');

  const mutation = useMutation({
    mutationFn: () => leadsApi.updateStatus(lead.id, {
      status: lead.status,
      notes,
      follow_up_date: date ? new Date(date).toISOString() : undefined,
    }),
    onSuccess: () => {
      toast.success('Follow-up scheduled!');
      qc.invalidateQueries({ queryKey: ['broker-leads-crm'] });
      onClose();
    },
    onError: () => toast.error('Failed to save follow-up'),
  });

  const setPreset = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setDate(d.toISOString().slice(0, 16));
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold">Schedule Follow-Up</h2>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          <div className="text-sm text-gray-500 mb-4">
            Lead: <span className="text-gray-900 font-medium">{lead.buyer?.name}</span>
          </div>

          {/* Quick presets */}
          <div className="flex gap-2 flex-wrap mb-4">
            {QUICK_PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => setPreset(p.days)}
                className="px-3 py-1.5 text-xs border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Date & Time</label>
              <input
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="input"
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="input resize-none"
                placeholder="What to discuss, buyer requirements, concerns..."
              />
            </div>
          </div>

          <div className="flex gap-3 mt-5">
            <button onClick={onClose} className="btn-outline flex-1">Cancel</button>
            <button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
              className="btn-primary flex-1"
            >
              {mutation.isPending ? 'Saving...' : 'Save Follow-Up'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
