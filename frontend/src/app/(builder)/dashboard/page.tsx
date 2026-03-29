'use client';
import { useQuery } from '@tanstack/react-query';
import { propertiesApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { formatINR } from '@/lib/utils';
import { Building2, Eye, Users, TrendingUp, Plus } from 'lucide-react';
import Link from 'next/link';

export default function BuilderDashboard() {
  const { user } = useAuthStore();

  const { data: propertiesData, isLoading } = useQuery({
    queryKey: ['builder-inventory'],
    queryFn: () => propertiesApi.list({ page: 1, limit: 50 } as any),
    enabled: !!user && user.role === 'builder',
  });

  const properties = propertiesData?.data || [];
  const totalViews = properties.reduce((s, p) => s + (p.views_count || 0), 0);
  const totalLeads = properties.reduce((s, p) => s + (p.leads_count || 0), 0);
  const activeListings = properties.filter(p => p.status === 'active').length;
  const soldCount = properties.filter(p => p.status === 'sold').length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1>Builder Portal</h1>
            <p className="text-gray-500 mt-1">Manage your inventory, pricing, and sales analytics.</p>
          </div>
          <Link href="/builder/inventory/new" className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Inventory
          </Link>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Building2, label: 'Active Listings', value: activeListings, color: 'text-blue-600', bg: 'bg-blue-50' },
            { icon: TrendingUp, label: 'Units Sold', value: soldCount, color: 'text-green-600', bg: 'bg-green-50' },
            { icon: Eye, label: 'Total Views', value: totalViews.toLocaleString(), color: 'text-purple-600', bg: 'bg-purple-50' },
            { icon: Users, label: 'Total Leads', value: totalLeads.toLocaleString(), color: 'text-amber-600', bg: 'bg-amber-50' },
          ].map(({ icon: Icon, label, value, color, bg }) => (
            <div key={label} className="card p-5">
              <div className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div className="text-2xl font-bold">{value}</div>
              <div className="text-sm text-gray-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Inventory Table */}
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold">Inventory Management</h2>
          </div>

          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Property</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Price</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Views</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Leads</th>
                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {properties.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900 text-sm">{p.title}</div>
                        <div className="text-xs text-gray-500">{p.locality}, {p.city}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-sm">{formatINR(p.price)}</div>
                        {p.price_per_sqft && (
                          <div className="text-xs text-gray-400">₹{p.price_per_sqft}/sqft</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`badge text-xs capitalize ${
                          p.status === 'active' ? 'badge-verified' :
                          p.status === 'sold' ? 'bg-gray-100 text-gray-600 border-gray-200' :
                          p.status === 'pending_review' ? 'badge-warm' :
                          'bg-gray-50 text-gray-400 border-gray-100'
                        }`}>
                          {p.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{p.views_count}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{p.leads_count}</td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/property/${p.id}`}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
