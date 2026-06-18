'use client'
import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Loader2, TrendingDown, TrendingUp, AlertTriangle, Package } from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'

export default function AnalyticsPage() {
  const { data: profit, isLoading: profitLoading } = useQuery({
    queryKey: ['analytics', 'profit'],
    queryFn: () => api.get('/analytics/profit').then((r) => r.data.data),
  })

  const { data: timeline, isLoading: timelineLoading } = useQuery({
    queryKey: ['analytics', 'expiry-timeline'],
    queryFn: () => api.get('/analytics/expiry-timeline').then((r) => r.data.data as { label: string; count: number }[]),
  })

  const { data: deadStock } = useQuery({
    queryKey: ['inventory', 'dead-stock'],
    queryFn: () => api.get('/inventory/dead-stock').then((r) => r.data.data),
  })

  const PIE_COLORS = ['#1E8A6E', '#F59E0B', '#EF4444']

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Profit summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Stock Value (Cost)', value: profit?.totalCostValue, icon: Package, color: 'text-gray-700' },
          { label: 'Potential Revenue', value: profit?.totalSellingValue, icon: TrendingUp, color: 'text-green-600' },
          { label: 'Potential Profit', value: profit?.potentialProfit, icon: TrendingUp, color: 'text-primary-600' },
          { label: 'Expiry Loss to Date', value: profit?.expiryLoss, icon: TrendingDown, color: 'text-red-600' },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-xs text-gray-400 font-medium mb-2">{card.label}</p>
            {profitLoading ? (
              <div className="h-7 w-24 bg-gray-100 animate-pulse rounded" />
            ) : (
              <p className={`text-xl font-bold ${card.color}`}>{formatCurrency(card.value || 0)}</p>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expiry timeline chart */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Items Expiring by Threshold</h2>
          {timelineLoading ? (
            <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-primary-600" /></div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={timeline} margin={{ top: 0, right: 0, bottom: 0, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                <YAxis tick={{ fontSize: 12, fill: '#9CA3AF' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #F3F4F6', fontSize: 12 }}
                  formatter={(value) => [value, 'Items']}
                />
                <Bar dataKey="count" fill="#1E8A6E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Stock health donut */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Stock Health Overview</h2>
          {profit && timeline ? (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Healthy', value: Math.max(0, (profit.totalCostValue || 0) - (profit.expiryLoss || 0)) },
                      { name: 'Near Expiry', value: timeline?.reduce((s: number, t: { count: number }) => s + t.count, 0) * 1000 || 0 },
                      { name: 'Loss', value: profit.expiryLoss || 0 },
                    ]}
                    cx="50%" cy="50%" innerRadius={60} outerRadius={90}
                    paddingAngle={3} dataKey="value"
                  >
                    {PIE_COLORS.map((color, index) => <Cell key={index} fill={color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #F3F4F6', fontSize: 12 }}
                    formatter={(value) => [formatCurrency(value as number)]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-2">
                {['Healthy', 'Near Expiry', 'Loss'].map((label, i) => (
                  <div key={label} className="flex items-center gap-1.5 text-xs text-gray-600">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i] }} />
                    {label}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-primary-600" /></div>
          )}
        </div>
      </div>

      {/* Dead stock table */}
      {deadStock && deadStock.length > 0 && (
        <div className="bg-white rounded-2xl border border-amber-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={18} className="text-amber-500" />
            <h2 className="font-semibold text-gray-900">Dead Stock ({deadStock.length} items)</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Drug', 'Quantity', 'Value', 'Last Updated'].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-400 pb-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {deadStock.slice(0, 10).map((item: { id: string; name: string; quantity: number; unit: string; costPrice: number; updatedAt: string }) => (
                  <tr key={item.id}>
                    <td className="py-2.5 font-medium text-gray-900">{item.name}</td>
                    <td className="py-2.5 text-gray-500">{item.quantity} {item.unit}</td>
                    <td className="py-2.5 text-amber-600 font-medium">{formatCurrency(item.costPrice * item.quantity)}</td>
                    <td className="py-2.5 text-gray-400">{formatCurrency(item.costPrice)} · {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
