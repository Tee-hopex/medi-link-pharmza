'use client'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import {
  Users, ShoppingBag, ShoppingCart, BadgeDollarSign,
  ShieldCheck, AlertTriangle, TrendingUp, UserPlus,
  ChevronRight, Loader2,
} from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency, cn } from '@/lib/utils'

interface Stats {
  users: { total: number; newThisWeek: number; byRole: Record<string, number> }
  listings: { total: number; byStatus: Record<string, number> }
  orders: { total: number; byStatus: Record<string, number> }
  pendingVerifications: number
  disputedOrders: number
  revenue: number
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  href,
  accent,
  alert,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  sub?: string
  href?: string
  accent?: boolean
  alert?: boolean
}) {
  const content = (
    <div className={cn(
      'bg-white rounded-2xl border p-5 flex flex-col gap-3 transition-all',
      alert ? 'border-amber-200 shadow-amber-50 shadow-sm' : 'border-gray-100 shadow-sm',
      href && 'hover:shadow-md hover:-translate-y-0.5 cursor-pointer',
    )}>
      <div className="flex items-start justify-between">
        <div className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center',
          alert ? 'bg-amber-50' : accent ? 'bg-primary-50' : 'bg-gray-50',
        )}>
          <Icon size={19} className={cn(
            alert ? 'text-amber-500' : accent ? 'text-primary-600' : 'text-gray-500',
          )} />
        </div>
        {href && <ChevronRight size={16} className="text-gray-300 mt-1" />}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 tracking-tight">{value}</p>
        <p className="text-sm text-gray-500 mt-0.5">{label}</p>
        {sub && <p className={cn('text-xs mt-1 font-medium', alert ? 'text-amber-500' : 'text-gray-400')}>{sub}</p>}
      </div>
    </div>
  )

  return href ? <Link href={href}>{content}</Link> : content
}

function RoleBar({ byRole }: { byRole: Record<string, number> }) {
  const total = Object.values(byRole).reduce((a, b) => a + b, 0)
  const roles = [
    { key: 'MEDICAL', label: 'Medical', color: 'bg-primary-500' },
    { key: 'NON_MEDICAL', label: 'Non-Medical', color: 'bg-blue-400' },
    { key: 'PATIENT', label: 'Patient', color: 'bg-purple-400' },
  ]
  return (
    <div className="space-y-3">
      {roles.map((r) => {
        const count = byRole[r.key] ?? 0
        const pct = total ? Math.round((count / total) * 100) : 0
        return (
          <div key={r.key} className="flex items-center gap-3">
            <div className="w-24 text-xs text-gray-500">{r.label}</div>
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all [width:var(--bar-w)]', r.color)}
                style={{ '--bar-w': `${pct}%` } as React.CSSProperties}
              />
            </div>
            <div className="w-10 text-right text-xs font-semibold text-gray-700">{count}</div>
          </div>
        )
      })}
    </div>
  )
}

function OrderStatusPills({ byStatus }: { byStatus: Record<string, number> }) {
  const config: Record<string, { label: string; color: string }> = {
    PENDING:   { label: 'Pending',   color: 'bg-amber-50 text-amber-700 border-amber-200' },
    CONFIRMED: { label: 'Confirmed', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    IN_TRANSIT:{ label: 'Transit',   color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    COMPLETED: { label: 'Completed', color: 'bg-green-50 text-green-700 border-green-200' },
    DISPUTED:  { label: 'Disputed',  color: 'bg-red-50 text-red-700 border-red-200' },
    CANCELLED: { label: 'Cancelled', color: 'bg-gray-50 text-gray-500 border-gray-200' },
  }
  return (
    <div className="flex flex-wrap gap-2">
      {Object.entries(byStatus).map(([status, count]) => {
        const c = config[status] ?? { label: status, color: 'bg-gray-50 text-gray-500 border-gray-200' }
        return (
          <span key={status} className={cn('text-xs font-semibold px-2.5 py-1.5 rounded-lg border', c.color)}>
            {c.label} · {count}
          </span>
        )
      })}
    </div>
  )
}

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery<Stats>({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/admin/stats').then((r) => r.data.data),
    refetchInterval: 60_000,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={28} className="animate-spin text-gray-300" />
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Platform overview — refreshes every minute</p>
      </div>

      {/* Alert row */}
      {((stats?.pendingVerifications ?? 0) > 0 || (stats?.disputedOrders ?? 0) > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(stats?.pendingVerifications ?? 0) > 0 && (
            <StatCard
              icon={ShieldCheck}
              label="Pending Verifications"
              value={stats!.pendingVerifications}
              sub="Needs your review"
              href="/admin/verifications"
              alert
            />
          )}
          {(stats?.disputedOrders ?? 0) > 0 && (
            <StatCard
              icon={AlertTriangle}
              label="Disputed Orders"
              value={stats!.disputedOrders}
              sub="Awaiting resolution"
              href="/admin/disputes"
              alert
            />
          )}
        </div>
      )}

      {/* Main stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users}             label="Total Users"       value={stats?.users.total ?? 0}    sub={`+${stats?.users.newThisWeek ?? 0} this week`} accent href="/admin/users" />
        <StatCard icon={ShoppingBag}       label="Total Listings"    value={stats?.listings.total ?? 0} sub={`${stats?.listings.byStatus?.ACTIVE ?? 0} active`} href="/admin/listings" />
        <StatCard icon={ShoppingCart}      label="Total Orders"      value={stats?.orders.total ?? 0}   sub={`${stats?.orders.byStatus?.COMPLETED ?? 0} completed`} />
        <StatCard icon={BadgeDollarSign}   label="Platform Revenue"  value={formatCurrency(stats?.revenue ?? 0)} sub="Completed orders" accent />
      </div>

      {/* Secondary panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User breakdown */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <UserPlus size={17} className="text-primary-500" />
            <h2 className="font-semibold text-gray-800">Users by Role</h2>
          </div>
          <RoleBar byRole={stats?.users.byRole ?? {}} />
        </div>

        {/* Order status */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp size={17} className="text-primary-500" />
            <h2 className="font-semibold text-gray-800">Orders by Status</h2>
          </div>
          <OrderStatusPills byStatus={stats?.orders.byStatus ?? {}} />
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { href: '/admin/verifications', label: 'Review Verifications', icon: ShieldCheck },
          { href: '/admin/users',         label: 'Manage Users',         icon: Users },
          { href: '/admin/listings',      label: 'Moderate Listings',    icon: ShoppingBag },
          { href: '/admin/disputes',      label: 'Resolve Disputes',     icon: AlertTriangle },
          { href: '/admin/broadcast',     label: 'Send Broadcast',       icon: TrendingUp },
        ].map((l) => (
          <Link key={l.href} href={l.href}
            className="flex items-center gap-2.5 px-4 py-3 bg-white rounded-xl border border-gray-100 shadow-sm text-sm font-medium text-gray-700 hover:shadow-md hover:-translate-y-0.5 transition-all"
          >
            <l.icon size={16} className="text-primary-500 flex-shrink-0" />
            {l.label}
          </Link>
        ))}
      </div>
    </div>
  )
}
