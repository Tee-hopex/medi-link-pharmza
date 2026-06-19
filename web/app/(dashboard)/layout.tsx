'use client'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'

const TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/inventory': 'Inventory',
  '/marketplace': 'Marketplace',
  '/orders': 'Orders',
  '/network': 'Network',
  '/patients': 'Patients',
  '/emergency-rx': 'Emergency Rx',
  '/wallet': 'Wallet',
  '/jobs': 'MediCareer',
  '/analytics': 'Analytics',
  '/pharmacies': 'Find a Pharmacy',
  '/settings': 'Settings',
  '/admin': 'Admin — Verifications',
  '/admin/users': 'Admin — All Users',
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  const title = Object.entries(TITLES).find(([key]) => pathname.startsWith(key))?.[1] || 'PHARVA'

  return (
    <div className="flex h-screen overflow-hidden bg-[#F7F8F5]">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header title={title} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
