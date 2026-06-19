'use client'
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Send, Loader2, CheckCircle2, Users } from 'lucide-react'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

const ROLE_OPTIONS = [
  { value: 'MEDICAL',     label: 'Medical Pharmacists',    desc: 'Licensed pharmacists and dispensers' },
  { value: 'NON_MEDICAL', label: 'Non-Medical Sellers',    desc: 'Distributors and wholesalers' },
  { value: 'PATIENT',     label: 'Patients',               desc: 'Individual buyers and patients' },
]

export default function AdminBroadcastPage() {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [roles, setRoles] = useState<string[]>([])
  const [sent, setSent] = useState<{ count: number; title: string } | null>(null)

  const mutation = useMutation({
    mutationFn: () => api.post('/admin/broadcast', {
      title,
      body,
      roles: roles.length ? roles : undefined,
    }),
    onSuccess: (res) => {
      setSent({ count: res.data.data.count, title })
      setTitle('')
      setBody('')
      setRoles([])
    },
  })

  const toggleRole = (role: string) => {
    setRoles((prev) => prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role])
  }

  const targetLabel = roles.length === 0
    ? 'All users'
    : roles.map((r) => ROLE_OPTIONS.find((o) => o.value === r)?.label).join(', ')

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center">
          <Send size={20} className="text-primary-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Broadcast Notification</h1>
          <p className="text-sm text-gray-500">Send a system message to users on the platform</p>
        </div>
      </div>

      {sent && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
          <CheckCircle2 size={18} className="text-green-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-green-800">Sent successfully</p>
            <p className="text-xs text-green-600">"{sent.title}" delivered to {sent.count} users</p>
          </div>
          <button type="button" onClick={() => setSent(null)} className="ml-auto text-green-400 hover:text-green-600 text-xs">Dismiss</button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        {/* Target audience */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Target Audience
            <span className="ml-2 text-xs font-normal text-gray-400">(leave empty to send to everyone)</span>
          </label>
          <div className="space-y-2">
            {ROLE_OPTIONS.map((o) => (
              <label key={o.value}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all',
                  roles.includes(o.value)
                    ? 'border-primary-400 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50',
                )}
              >
                <input
                  type="checkbox"
                  className="mt-0.5 rounded text-primary-500 focus:ring-primary-500"
                  checked={roles.includes(o.value)}
                  onChange={() => toggleRole(o.value)}
                />
                <div>
                  <p className="text-sm font-medium text-gray-800">{o.label}</p>
                  <p className="text-xs text-gray-400">{o.desc}</p>
                </div>
              </label>
            ))}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-400">
            <Users size={12} />
            Sending to: <span className="font-medium text-gray-600">{targetLabel}</span>
          </div>
        </div>

        <div className="border-t border-gray-100" />

        {/* Notification title */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Notification Title</label>
          <input
            className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
            placeholder="e.g. Platform Maintenance Notice"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={80}
          />
          <p className="text-xs text-gray-400 mt-1 text-right">{title.length}/80</p>
        </div>

        {/* Body */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Message</label>
          <textarea
            className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
            rows={4}
            placeholder="Write your message here…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={500}
          />
          <p className="text-xs text-gray-400 mt-1 text-right">{body.length}/500</p>
        </div>

        {/* Preview */}
        {(title || body) && (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Preview</p>
            <div className="bg-white rounded-lg border border-gray-100 p-3 shadow-sm">
              <p className="text-sm font-semibold text-gray-900">{title || 'Notification title'}</p>
              <p className="text-xs text-gray-500 mt-1">{body || 'Message body will appear here.'}</p>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => mutation.mutate()}
          disabled={!title.trim() || !body.trim() || mutation.isPending}
          className="w-full flex items-center justify-center gap-2 py-3 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {mutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          {mutation.isPending ? 'Sending…' : `Send to ${targetLabel}`}
        </button>
      </div>
    </div>
  )
}
