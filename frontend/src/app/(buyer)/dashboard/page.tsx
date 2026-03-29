'use client';
import { useQuery } from '@tanstack/react-query';
import { transactionsApi, propertiesApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { formatINR, timeAgo } from '@/lib/utils';
import { Heart, Calendar, TrendingUp, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function BuyerDashboard() {
  const { user } = useAuthStore();

  const { data: transactions } = useQuery({
    queryKey: ['my-transactions'],
    queryFn: transactionsApi.getMyTransactions,
    enabled: !!user,
  });

  const { data: recommendations } = useQuery({
    queryKey: ['recommendations'],
    queryFn: propertiesApi.getRecommendations,
    enabled: !!user,
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Please sign in to view your dashboard.</p>
          <Link href="/login" className="btn-primary">Sign In</Link>
        </div>
      </div>
    );
  }

  const txList = transactions?.data || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1>Welcome back, {user.name.split(' ')[0]}</h1>
          <p className="text-gray-500 mt-1">Here's what's happening with your property journey.</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="card p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Heart className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{txList.filter(t => t.status === 'offer_made').length}</div>
                <div className="text-sm text-gray-500">Active Offers</div>
              </div>
            </div>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{txList.filter(t => t.status === 'agreement_signed').length}</div>
                <div className="text-sm text-gray-500">Agreements</div>
              </div>
            </div>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{txList.filter(t => t.status === 'completed').length}</div>
                <div className="text-sm text-gray-500">Completed Deals</div>
              </div>
            </div>
          </div>
        </div>

        {/* Active Deals */}
        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">My Transactions</h2>
            <Link href="/search" className="text-sm text-blue-600 flex items-center gap-1 hover:underline">
              Find Properties <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {txList.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p>No transactions yet.</p>
              <Link href="/search" className="btn-primary mt-3 inline-block text-sm">
                Browse Properties
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {txList.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-sm">{tx.property?.title || 'Property'}</div>
                    <div className="text-xs text-gray-500">
                      {tx.property?.locality}, {tx.property?.city} · {timeAgo(tx.created_at)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-blue-700">{formatINR(tx.offer_price)}</div>
                    <span className={`badge text-xs ${
                      tx.status === 'completed' ? 'badge-verified' :
                      tx.status === 'cancelled' ? 'bg-red-50 text-red-600 border-red-200' :
                      'badge-warm'
                    }`}>
                      {tx.status.replace(/_/g, ' ')}
                    </span>
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
