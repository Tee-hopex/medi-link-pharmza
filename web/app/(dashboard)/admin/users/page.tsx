'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Users, Search, Loader2, ShieldCheck, ShieldOff, Clock } from 'lucide-react'
import { api } from '@/lib/api'
import { formatDate, cn } from '@/lib/utils'

interface UserRow {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
  profession?: string
  verificationLevel: string
  createdAt: string
  facility?: { name: string; city: string; state: string; verified: boolean }
}

const LEVEL_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  UNVERIFIED: { label: 'Unverified',    color: 'text-gray-500',   bg: 'bg-gray-50 border-gray-200' },
  PENDING:    { label: 'Pending',       color: 'text-amber-600',  bg: 'bg-amber-50 border-amber-200' },
  LEVEL_1:    { label: 'Level 1',       color: 'text-green-600',  bg: 'bg-green-50 border-green-200' },
  LEVEL_2:    { label: 'Level 2',       color: 'text-blue-600',   bg: 'bg-blue-50 border-blue-200' },
  LEVEL_3:    { label: 'Level 3',       color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200' },
}

export default function AdminUsersPage() {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [levelFilter, setLevelFilter] = useState('')

  const { data: users = [], isLoading } = useQuery<UserRow[]>({
    queryKey: ['admin-users', roleFilter, levelFilter],
    queryFn: () => {
      const params = new URLSearchParams()
      if (roleFilter) params.set('role', roleFilter)
      if (levelFilter) params.set('verificationLevel', levelFilter)
      return api.get(`/admin/users?${params}`).then((r) => r.data.data)
    },
  })

  const filtered = users.filter((u) => {
    const q = search.toLowerCase()
    return !q || `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(q)
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center">
          <Users size={20} className="text-primary-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">All Users</h1>
          <p className="text-sm text-gray-500">{users.length} total users</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 bg-white"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="">All Roles</option>
          <option value="MEDICAL">Medical</option>
          <option value="NON_MEDICAL">Non-Medical</option>
          <option value="PATIENT">Patient</option>
        </select>
        <select
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 bg-white"
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
        >
          <option value="">All Levels</option>
          <option value="UNVERIFIED">Unverified</option>
          <option value="PENDING">Pending</option>
          <option value="LEVEL_1">Level 1</option>
          <option value="LEVEL_2">Level 2</option>
          <option value="LEVEL_3">Level 3</option>
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin text-gray-300" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">User</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Facility</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Verification</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-gray-400">No users found</td>
                </tr>
              ) : filtered.map((u) => {
                const lvl = LEVEL_CONFIG[u.verificationLevel] ?? LEVEL_CONFIG.UNVERIFIED
                return (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center text-primary-700 font-bold text-xs flex-shrink-0">
                          {u.firstName[0]}{u.lastName[0]}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{u.firstName} {u.lastName}</p>
                          <p className="text-xs text-gray-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{u.role.replace('_', ' ')}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {u.facility
                        ? <><p className="font-medium">{u.facility.name}</p><p className="text-xs text-gray-400">{u.facility.city}, {u.facility.state}</p></>
                        : <span className="text-gray-300">—</span>
                      }
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('text-xs font-semibold px-2 py-1 rounded-full border', lvl.bg, lvl.color)}>
                        {lvl.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(u.createdAt)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
