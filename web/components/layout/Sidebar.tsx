'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Package, ShoppingBag, ShoppingCart, Users, Wallet,
  Briefcase, BarChart3, Settings, MessageSquare, Zap, LogOut, X, MapPin,
  ShieldCheck, AlertTriangle, Send,
} from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { cn } from '@/lib/utils'

type Role = 'MEDICAL' | 'NON_MEDICAL' | 'PATIENT' | 'ADMIN'

const NAV_GROUPS = [
  {
    label: 'Operations',
    roles: ['MEDICAL', 'NON_MEDICAL'] as Role[],
    items: [
      { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { href: '/inventory', icon: Package, label: 'Inventory' },
      { href: '/marketplace', icon: ShoppingBag, label: 'Marketplace' },
      { href: '/orders', icon: ShoppingCart, label: 'Orders' },
    ],
  },
  {
    label: 'Operations',
    roles: ['PATIENT'] as Role[],
    items: [
      { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { href: '/marketplace', icon: ShoppingBag, label: 'Marketplace' },
      { href: '/orders', icon: ShoppingCart, label: 'Orders' },
    ],
  },
  {
    label: 'Care',
    roles: ['MEDICAL'] as Role[],
    items: [
      { href: '/patients', icon: Users, label: 'Patients' },
      { href: '/emergency-rx', icon: Zap, label: 'EmergencyRx', urgent: true },
      { href: '/pharmacies', icon: MapPin, label: 'Find Pharmacy' },
    ],
  },
  {
    label: 'Care',
    roles: ['NON_MEDICAL', 'PATIENT'] as Role[],
    items: [
      { href: '/emergency-rx', icon: Zap, label: 'EmergencyRx', urgent: true },
      { href: '/pharmacies', icon: MapPin, label: 'Find Pharmacy' },
    ],
  },
  {
    label: 'Business',
    roles: ['MEDICAL', 'NON_MEDICAL'] as Role[],
    items: [
      { href: '/network', icon: MessageSquare, label: 'Network' },
      { href: '/wallet', icon: Wallet, label: 'Wallet' },
      { href: '/jobs', icon: Briefcase, label: 'MediCareer' },
      { href: '/analytics', icon: BarChart3, label: 'Analytics' },
    ],
  },
  {
    label: 'Business',
    roles: ['PATIENT'] as Role[],
    items: [
      { href: '/network', icon: MessageSquare, label: 'Network' },
      { href: '/wallet', icon: Wallet, label: 'Wallet' },
      { href: '/jobs', icon: Briefcase, label: 'MediCareer' },
    ],
  },
  {
    label: 'Account',
    roles: ['MEDICAL', 'NON_MEDICAL', 'PATIENT'] as Role[],
    items: [
      { href: '/settings', icon: Settings, label: 'Settings' },
    ],
  },
  {
    label: 'Administration',
    roles: ['ADMIN'] as Role[],
    items: [
      { href: '/admin',               icon: LayoutDashboard, label: 'Overview' },
      { href: '/admin/verifications', icon: ShieldCheck,     label: 'Verifications' },
      { href: '/admin/users',         icon: Users,           label: 'Users' },
      { href: '/admin/listings',      icon: ShoppingBag,     label: 'Listings' },
      { href: '/admin/disputes',      icon: AlertTriangle,   label: 'Disputes' },
      { href: '/admin/broadcast',     icon: Send,            label: 'Broadcast' },
    ],
  },
]

interface Props {
  open?: boolean
  onClose?: () => void
}

export function Sidebar({ open, onClose }: Props) {
  const pathname = usePathname()
  const { user, logout } = useAuthStore()

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/60 z-20 lg:hidden" onClick={onClose} />
      )}

      <aside className={cn(
        'fixed inset-y-0 left-0 z-30 w-64 flex flex-col transition-transform duration-200 bg-[#0F1A13]',
        'lg:translate-x-0 lg:static lg:z-auto',
        open ? 'translate-x-0' : '-translate-x-full',
      )}>
        {/* Logo */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-dark.png" alt="PHARVA" width={34} height={34} className="object-contain mix-blend-screen" />
            <span className="font-display font-bold text-white text-lg tracking-tight">PHARVA</span>
          </div>
          <button type="button" aria-label="Close sidebar" onClick={onClose} className="lg:hidden text-[#3A5A48] hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Brand accent line — mirrors the two-color leaves */}
        <div className="pharva-accent-line mx-5 mb-5" />

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 pb-4 scrollbar-hide">
          {NAV_GROUPS.filter((g) => !user?.role || g.roles.includes(user.role as Role)).map((group, idx) => (
            <div key={`${group.label}-${idx}`} className="mb-5">
              <p className="text-[10px] font-semibold text-[#2D4A3A] uppercase tracking-widest px-3 mb-1.5">
                {group.label}
              </p>
              {group.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all mb-0.5',
                      active
                        ? 'bg-primary-500/10 text-white shadow-[inset_3px_0_0_#1E8A6E]'
                        : 'text-[#7A9E8A] hover:bg-white/5 hover:text-[#C0D5C6]',
                    )}
                  >
                    <item.icon
                      size={17}
                      className={cn(
                        'flex-shrink-0 transition-colors',
                        active ? 'text-primary-400' : 'text-[#3A5A48]',
                      )}
                    />
                    <span>{item.label}</span>
                    {item.urgent && (
                      <span className="ml-auto text-[10px] bg-red-500/15 text-red-400 font-bold px-1.5 py-0.5 rounded tracking-wide">
                        LIVE
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        {/* User */}
        <div className="border-t border-[#1E3A2E] p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-primary-700/40 border border-primary-600/30 flex items-center justify-center text-primary-300 text-xs font-bold flex-shrink-0">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-[#C0D5C6] truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-[#3A5A48] truncate">
                {user?.facility?.name || user?.role}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-2 text-xs text-[#3A5A48] hover:text-red-400 transition-colors w-full py-1"
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </aside>
    </>
  )
}
