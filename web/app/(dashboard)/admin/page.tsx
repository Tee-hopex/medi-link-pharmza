'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ShieldCheck, ShieldX, Clock, CheckCircle2, XCircle, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'
import { formatDate, cn } from '@/lib/utils'

interface PendingUser {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  role: string
  profession?: string
  verificationLevel: string
  createdAt: string
  facility?: {
    name: string
    type: string
    address: string
    city: string
    state: string
    licenseNumber?: string
    licenseDoc?: string
    verified: boolean
  }
}

function UserCard({ user, onApprove, onReject, approving, rejecting }: {
  user: PendingUser
  onApprove: () => void
  onReject: (reason: string) => void
  approving: boolean
  rejecting: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectBox, setShowRejectBox] = useState(false)

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-primary-50 border border-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm flex-shrink-0">
            {user.firstName[0]}{user.lastName[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-gray-900">{user.firstName} {user.lastName}</h3>
              <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
                {user.role.replace('_', ' ')}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">{user.email}</p>
            {user.profession && <p className="text-sm text-gray-400">{user.profession}</p>}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-gray-400">{formatDate(user.createdAt)}</span>
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>

        {user.facility && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-700">{user.facility.name}</p>
            <p className="text-xs text-gray-500 mt-0.5">{user.facility.address}, {user.facility.city}, {user.facility.state}</p>
            {user.facility.licenseNumber && (
              <p className="text-xs text-gray-500 mt-0.5">License: <span className="font-medium">{user.facility.licenseNumber}</span></p>
            )}
            {user.facility.licenseDoc && (
              <a
                href={user.facility.licenseDoc}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary-600 hover:text-primary-700 font-medium mt-1 inline-block"
              >
                View License Document →
              </a>
            )}
          </div>
        )}

        {expanded && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <div><dt className="text-gray-400 text-xs">Phone</dt><dd className="text-gray-700">{user.phone || '—'}</dd></div>
              <div><dt className="text-gray-400 text-xs">Joined</dt><dd className="text-gray-700">{formatDate(user.createdAt)}</dd></div>
              <div><dt className="text-gray-400 text-xs">Status</dt><dd className="text-amber-600 font-medium">Pending Review</dd></div>
              {user.facility && <div><dt className="text-gray-400 text-xs">Facility Verified</dt><dd className={user.facility.verified ? 'text-green-600' : 'text-gray-500'}>{user.facility.verified ? 'Yes' : 'No'}</dd></div>}
            </dl>
          </div>
        )}
      </div>

      <div className="px-5 pb-4 flex items-center gap-3">
        {showRejectBox ? (
          <div className="flex-1 flex flex-col gap-2">
            <textarea
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
              rows={2}
              placeholder="Reason for rejection (optional)"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { onReject(rejectReason); setShowRejectBox(false) }}
                disabled={rejecting}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {rejecting ? <Loader2 size={13} className="animate-spin" /> : <XCircle size={13} />}
                Confirm Reject
              </button>
              <button
                type="button"
                onClick={() => setShowRejectBox(false)}
                className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={onApprove}
              disabled={approving || rejecting}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              {approving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              Approve
            </button>
            <button
              type="button"
              onClick={() => setShowRejectBox(true)}
              disabled={approving || rejecting}
              className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-600 border border-red-200 text-sm font-semibold rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors"
            >
              <XCircle size={14} />
              Reject
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default function AdminVerificationsPage() {
  const queryClient = useQueryClient()
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [action, setAction] = useState<'approve' | 'reject' | null>(null)

  const { data: pending = [], isLoading } = useQuery<PendingUser[]>({
    queryKey: ['admin-verifications'],
    queryFn: () => api.get('/admin/verifications').then((r) => r.data.data),
  })

  const approveMutation = useMutation({
    mutationFn: (userId: string) => api.patch(`/admin/verifications/${userId}/approve`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-verifications'] })
      setProcessingId(null)
      setAction(null)
    },
  })

  const rejectMutation = useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason?: string }) =>
      api.patch(`/admin/verifications/${userId}/reject`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-verifications'] })
      setProcessingId(null)
      setAction(null)
    },
  })

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center">
          <ShieldCheck size={20} className="text-primary-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Pending Verifications</h1>
          <p className="text-sm text-gray-500">Review and approve pharmacist account verification requests</p>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: Clock, label: 'Pending', value: pending.length, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
          { icon: CheckCircle2, label: 'Action Needed', value: pending.length, color: 'text-primary-600', bg: 'bg-primary-50', border: 'border-primary-100' },
          { icon: ShieldX, label: 'Queue', value: pending.length === 0 ? 'Clear' : `${pending.length} left`, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-100' },
        ].map((s) => (
          <div key={s.label} className={cn('rounded-xl border p-4 flex items-center gap-3', s.bg, s.border)}>
            <s.icon size={20} className={s.color} />
            <div>
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className={cn('text-lg font-bold', s.color)}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin text-gray-300" />
        </div>
      ) : pending.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <ShieldCheck size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">All clear — no pending verifications</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pending.map((u) => (
            <UserCard
              key={u.id}
              user={u}
              approving={processingId === u.id && action === 'approve'}
              rejecting={processingId === u.id && action === 'reject'}
              onApprove={() => {
                setProcessingId(u.id)
                setAction('approve')
                approveMutation.mutate(u.id)
              }}
              onReject={(reason) => {
                setProcessingId(u.id)
                setAction('reject')
                rejectMutation.mutate({ userId: u.id, reason })
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
