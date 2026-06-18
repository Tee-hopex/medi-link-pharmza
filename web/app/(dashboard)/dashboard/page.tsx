'use client'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, Package, TrendingUp, ShoppingCart, Zap, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { DashboardStats, InventoryItem } from '@/types'

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color = 'primary',
  href,
  featured = false,
}: {
  label: string
  value: string | number
  sub?: string
  icon: React.ElementType
  color?: 'primary' | 'accent' | 'warning' | 'danger'
  href?: string
  featured?: boolean
}) {
  const colors = {
    primary: { icon: 'bg-primary-50 text-primary-600', dot: 'bg-primary-500' },
    accent:  { icon: 'bg-accent-light text-accent', dot: 'bg-accent' },
    warning: { icon: 'bg-amber-50 text-amber-600', dot: 'bg-amber-500' },
    danger:  { icon: 'bg-red-50 text-red-600', dot: 'bg-red-500' },
  }
  const c = colors[color]

  const card = (
    <div className={[
      'relative rounded-xl p-5 border transition-shadow hover:shadow-sm overflow-hidden',
      featured
        ? 'bg-[linear-gradient(135deg,#115546_0%,#0C3E34_100%)] border-primary-700'
        : 'bg-white border-[#E3E6E1]',
    ].join(' ')}>
      {/* Gradient accent top-line for featured card */}
      {featured && <div className="absolute top-0 left-0 right-0 pharva-accent-line rounded-none" />}

      <div className="flex items-start justify-between mb-4">
        <p className={`text-xs font-semibold uppercase tracking-widest ${featured ? 'text-primary-300' : 'text-gray-400'}`}>
          {label}
        </p>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${featured ? 'bg-primary-700/60 text-primary-200' : c.icon}`}>
          <Icon size={17} />
        </div>
      </div>

      <p className={`font-display text-2xl font-bold mb-1 ${featured ? 'text-white' : 'text-gray-900'}`}>
        {value}
      </p>
      {sub && (
        <p className={`text-xs ${featured ? 'text-primary-300' : 'text-gray-400'}`}>{sub}</p>
      )}
    </div>
  )

  return href ? <Link href={href} className="block">{card}</Link> : card
}

export default function DashboardPage() {
  const { data: stats } = useQuery({
    queryKey: ['analytics', 'dashboard'],
    queryFn: () => api.get('/analytics/dashboard').then((r) => r.data.data as DashboardStats),
  })

  const { data: expiryData } = useQuery({
    queryKey: ['inventory', 'expiry-alerts'],
    queryFn: () =>
      api.get('/inventory/expiry-alerts').then(
        (r) => r.data.data as (InventoryItem & { daysLeft: number; urgency: string })[],
      ),
  })

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Wallet Balance"
          value={formatCurrency(stats?.wallet.balance || 0)}
          sub={stats?.wallet.escrow ? `${formatCurrency(stats.wallet.escrow)} in escrow` : 'No escrow held'}
          icon={TrendingUp}
          color="primary"
          featured
          href="/wallet"
        />
        <StatCard
          label="Total Inventory"
          value={stats?.inventory.total || 0}
          sub="items in stock"
          icon={Package}
          href="/inventory"
        />
        <StatCard
          label="Expiring Soon"
          value={stats?.inventory.expiringSoon || 0}
          sub="within 90 days"
          icon={AlertTriangle}
          color="warning"
          href="/inventory?expiringInDays=90"
        />
        <StatCard
          label="Active Orders"
          value={stats?.orders.pending || 0}
          sub={`${stats?.orders.completed || 0} completed`}
          icon={ShoppingCart}
          color="accent"
          href="/orders"
        />
      </div>

      {/* Alerts + Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Expiry alerts */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#E3E6E1] p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-semibold text-gray-900 text-sm">Expiry Alerts</h2>
              <p className="text-xs text-gray-400 mt-0.5">Items expiring within 90 days</p>
            </div>
            <Link
              href="/inventory?expiringInDays=90"
              className="text-xs text-primary-600 font-semibold flex items-center gap-1 hover:text-primary-700 transition-colors"
            >
              View all <ArrowRight size={12} />
            </Link>
          </div>

          <div className="space-y-1">
            {expiryData?.slice(0, 6).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-[#F7F8F5] transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {item.batchNumber || 'No batch'} · Expires {formatDate(item.expiryDate)}
                  </p>
                </div>
                <span className={[
                  'text-xs font-semibold px-2.5 py-1 rounded-full ml-4 flex-shrink-0',
                  item.urgency === 'critical'
                    ? 'bg-red-50 text-red-700'
                    : item.urgency === 'warning'
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-blue-50 text-blue-700',
                ].join(' ')}>
                  {item.daysLeft}d left
                </span>
              </div>
            ))}

            {(!expiryData || expiryData.length === 0) && (
              <div className="py-10 text-center">
                <Package size={28} className="text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No items expiring within 90 days</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="space-y-3">
          <div className="mb-1">
            <h2 className="font-semibold text-gray-900 text-sm">Quick Actions</h2>
            <p className="text-xs text-gray-400 mt-0.5">Common tasks</p>
          </div>

          {[
            {
              href: '/inventory',
              label: 'Add to inventory',
              desc: 'Log new drug stock',
              icon: Package,
              iconStyle: 'bg-primary-50 text-primary-600',
            },
            {
              href: '/marketplace',
              label: 'List on Marketplace',
              desc: 'Sell near-expiry stock',
              icon: TrendingUp,
              iconStyle: 'bg-accent-light text-accent',
            },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="flex items-center gap-3 p-4 rounded-xl border border-[#E3E6E1] bg-white hover:border-gray-300 hover:shadow-sm transition-all"
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${action.iconStyle}`}>
                <action.icon size={17} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900">{action.label}</p>
                <p className="text-xs text-gray-400">{action.desc}</p>
              </div>
            </Link>
          ))}

          {/* Emergency Rx — styled as urgent */}
          <Link
            href="/emergency-rx"
            className="flex items-center gap-3 p-4 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 transition-colors"
          >
            <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
              <Zap size={17} className="text-red-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-red-700">Emergency Rx Request</p>
              <p className="text-xs text-red-500">Blast to nearby pharmacies</p>
            </div>
            <span className="ml-auto text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded tracking-wide flex-shrink-0">
              LIVE
            </span>
          </Link>

          {/* Dead stock alert */}
          {(stats?.inventory.deadStock || 0) > 0 && (
            <Link
              href="/inventory?deadStockOnly=true"
              className="flex items-center gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 transition-colors"
            >
              <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={17} className="text-amber-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-amber-800">
                  {stats?.inventory.deadStock} dead stock items
                </p>
                <p className="text-xs text-amber-600">Review and list on marketplace</p>
              </div>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
