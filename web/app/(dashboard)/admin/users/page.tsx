'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Users, Search, Loader2, ShieldCheck, ChevronDown } from 'lucide-react'
import { api } from '@/lib/api'
import { formatDate, cn } from '@/lib/utils'

interface UserRow {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  role: string
  profession?: string
  verificationLevel: string
  isActive: boolean
  createdAt: string
  facility?: { name: string; city: string; state: string; verified: boolean }
}

const LEVEL_META: Record<string, { label: string; color: string }> = {
  UNVERIFIED: { label: 'Unverified', color: 'text-gray-400 bg-gray-50 border-gray-200' },
  PENDING:    { label: 'Pending',    color: 'text-amber-600 bg-amber-50 border-amber-200' },
  LEVEL_1:    { label: 'Level 1',    color: 'text-green-600 bg-green-50 border-green-200' },
  LEVEL_2:    { label: 'Level 2',    color: 'text-blue-600 bg-blue-50 border-blue-200' },
  LEVEL_3:    { label: 'Level 3',    color: 'text-purple-600 bg-purple-50 border-purple-200' },
}

function LevelDropdown({ userId, current }: { userId: string; current: string }) {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)

  const mutation = useMutation({
    mutationFn: (level: string) => api.patch(`/admin/verifications/${userId}/level`, { level }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-users'] }); setOpen(false) },
  })

  const levels = ['UNVERIFIED', 'LEVEL_1', 'LEVEL_2', 'LEVEL_3']
  const meta = LEVEL_META[current] ?? LEVEL_META.UNVERIFIED

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-colors',
          meta.color,
        )}
      >
        {meta.label}
        <ChevronDown size={11} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 z-20 bg-white rounded-xl border border-gray-200 shadow-lg py-1 min-w-[130px]">
            {levels.map((l) => {
              const m = LEVEL_META[l]
              return (
                <button
                  key={l}
                  type="button"
                  disabled={l === current || mutation.isPending}
                  onClick={() => mutation.mutate(l)}
                  className={cn(
                    'w-full text-left px-3 py-2 text-xs font-medium hover:bg-gray-50 transition-colors',
                    l === current ? 'opacity-40 cursor-default' : '',
                    m.color.split(' ')[0],
                  )}
                >
                  {m.label}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

function ActiveToggle({ userId, isActive }: { userId: string; isActive: boolean }) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: () => api.patch(`/admin/users/${userId}/toggle-active`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  })

  return (
    <button
      type="button"
      onClick={() => mutation.mutate()}
      disabled={mutation.isPending}
      className={cn(
        'relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200',
        'focus:outline-none disabled:opacity-50',
        isActive ? 'bg-primary-500 border-primary-500' : 'bg-gray-200 border-gray-200',
      )}
    >
      <span className={cn(
        'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200',
        isActive ? 'translate-x-4' : 'translate-x-0',
      )} />
    </button>
  )
}

export default function AdminUsersPage() {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [levelFilter, setLevelFilter] = useState('')

  const { data: users = [], isLoading } = useQuery<UserRow[]>({
    queryKey: ['admin-users', roleFilter, levelFilter],
    queryFn: () => {
      const p = new URLSearchParams()
      if (roleFilter) p.set('role', roleFilter)
      if (levelFilter) p.set('verificationLevel', levelFilter)
      return api.get(`/admin/users?${p}`).then((r) => r.data.data)
    },
  })

  const filtered = users.filter((u) => {
    const q = search.toLowerCase()
    return !q || `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(q)
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center">
          <Users size={20} className="text-primary-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">All Users</h1>
          <p className="text-sm text-gray-500">{users.length} registered users</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
            placeholder="Search name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          aria-label="Filter by role"
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
          aria-label="Filter by verification level"
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

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin text-gray-300" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">User</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Facility</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Level</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Active</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400 text-sm">No users found</td></tr>
              ) : filtered.map((u) => (
                <tr key={u.id} className={cn('hover:bg-gray-50 transition-colors', !u.isActive && 'opacity-50')}>
                  <td className="px-5 py-3.5">
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
                  <td className="px-4 py-3.5 text-gray-500 text-xs">{u.role.replace('_', ' ')}</td>
                  <td className="px-4 py-3.5 text-gray-600 text-xs">
                    {u.facility
                      ? <><p className="font-medium">{u.facility.name}</p><p className="text-gray-400">{u.facility.city}</p></>
                      : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3.5">
                    <LevelDropdown userId={u.id} current={u.verificationLevel} />
                  </td>
                  <td className="px-4 py-3.5">
                    <ActiveToggle userId={u.id} isActive={u.isActive} />
                  </td>
                  <td className="px-4 py-3.5 text-gray-400 text-xs">{formatDate(u.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
