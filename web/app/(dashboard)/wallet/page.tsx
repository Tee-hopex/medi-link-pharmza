'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Loader2, ArrowDownLeft, ArrowUpRight, Lock, Plus, X } from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency, formatRelative, cn } from '@/lib/utils'
import type { WalletTransaction } from '@/types'

const TX_ICONS = {
  CREDIT: { icon: ArrowDownLeft, color: 'text-green-600 bg-green-100' },
  DEBIT: { icon: ArrowUpRight, color: 'text-red-600 bg-red-100' },
  ESCROW: { icon: Lock, color: 'text-amber-600 bg-amber-100' },
  RELEASE: { icon: ArrowDownLeft, color: 'text-blue-600 bg-blue-100' },
  REFUND: { icon: ArrowDownLeft, color: 'text-teal-600 bg-teal-100' },
}

const inputClass = 'w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500'
const labelClass = 'text-sm font-medium text-gray-700 mb-1 block'

function FundModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient()
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: (amt: number) => api.post('/wallet/fund/initialize', { amount: amt }).then((r) => r.data.data),
    onSuccess: (data: { authorization_url: string }) => {
      // Redirect to Paystack checkout; the verify step happens on return
      window.location.href = data.authorization_url
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      setError(err.response?.data?.error || 'Failed to initialize payment')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const amt = parseFloat(amount)
    if (!amt || amt < 100) { setError('Minimum amount is ₦100'); return }
    mutation.mutate(amt)
  }

  // Handle Paystack return — verify if reference present in URL
  if (typeof window !== 'undefined') {
    const ref = new URLSearchParams(window.location.search).get('reference')
    const trxref = new URLSearchParams(window.location.search).get('trxref')
    const reference = ref || trxref
    if (reference) {
      api.post('/wallet/fund/verify', { reference }).then(() => {
        queryClient.invalidateQueries({ queryKey: ['wallet'] })
        window.history.replaceState({}, '', window.location.pathname)
      }).catch(() => {})
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-gray-900">Fund Wallet</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Amount (₦)</label>
            <input
              type="number" min="100" step="50" value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount" className={inputClass} autoFocus
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={mutation.isPending} className="flex-1 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
              {mutation.isPending ? <Loader2 size={16} className="animate-spin" /> : null}
              {mutation.isPending ? 'Redirecting...' : 'Pay with Paystack'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function WithdrawModal({ balance, onClose }: { balance: number; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({ amount: '', bankCode: '', accountNumber: '', accountName: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const mutation = useMutation({
    mutationFn: (data: typeof form) => api.post('/wallet/withdraw', { ...data, amount: parseFloat(data.amount) }),
    onSuccess: () => {
      setSuccess(true)
      queryClient.invalidateQueries({ queryKey: ['wallet'] })
      setTimeout(onClose, 1800)
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      setError(err.response?.data?.error || 'Withdrawal failed')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const amt = parseFloat(form.amount)
    if (!amt || amt < 100) { setError('Minimum withdrawal is ₦100'); return }
    if (amt > balance) { setError('Insufficient balance'); return }
    if (!form.bankCode || !form.accountNumber || !form.accountName) { setError('All bank details are required'); return }
    mutation.mutate(form)
  }

  const field = (key: keyof typeof form, label: string, placeholder: string, type = 'text') => (
    <div>
      <label className={labelClass}>{label}</label>
      <input type={type} value={form[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        placeholder={placeholder} className={inputClass} />
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-gray-900">Withdraw Funds</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        {success ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <ArrowUpRight size={20} className="text-green-600" />
            </div>
            <p className="font-medium text-gray-900">Withdrawal initiated</p>
            <p className="text-sm text-gray-500 mt-1">Funds will arrive in 1–3 business days</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            {field('amount', `Amount (₦) — Balance: ${formatCurrency(balance)}`, '5000', 'number')}
            {field('accountNumber', 'Account Number', '0123456789')}
            {field('bankCode', 'Bank Code', 'e.g. 058 for GTBank')}
            {field('accountName', 'Account Name', 'John Doe')}
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={mutation.isPending} className="flex-1 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-semibold hover:bg-gray-800 disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
                {mutation.isPending ? <Loader2 size={16} className="animate-spin" /> : null}
                {mutation.isPending ? 'Processing...' : 'Withdraw'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default function WalletPage() {
  const [modal, setModal] = useState<'fund' | 'withdraw' | null>(null)

  const { data: wallet, isLoading } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => api.get('/wallet').then((r) => r.data.data as { balance: number; escrow: number; currency: string; transactions: WalletTransaction[] }),
  })

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-primary-600" /></div>

  return (
    <>
      {modal === 'fund' && <FundModal onClose={() => setModal(null)} />}
      {modal === 'withdraw' && <WithdrawModal balance={wallet?.balance ?? 0} onClose={() => setModal(null)} />}

      <div className="space-y-6 max-w-2xl">
        {/* Balance card */}
        <div className="bg-primary-600 rounded-2xl p-6 text-white">
          <p className="text-primary-100 text-sm mb-1">Available Balance</p>
          <p className="text-4xl font-bold mb-4">{formatCurrency(wallet?.balance || 0)}</p>
          {(wallet?.escrow || 0) > 0 && (
            <div className="flex items-center gap-2 bg-primary-500 rounded-xl px-4 py-2.5 text-sm">
              <Lock size={14} className="text-primary-200" />
              <span className="text-primary-100">{formatCurrency(wallet?.escrow || 0)} held in escrow</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setModal('fund')}
            className="flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition-colors text-sm"
          >
            <Plus size={16} className="text-primary-600" /> Fund Wallet
          </button>
          <button
            onClick={() => setModal('withdraw')}
            className="flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition-colors text-sm"
          >
            <ArrowUpRight size={16} className="text-gray-500" /> Withdraw
          </button>
        </div>

        {/* Transaction history */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Transaction History</h2>
          <div className="space-y-3">
            {wallet?.transactions.map((tx) => {
              const config = TX_ICONS[tx.type]
              const isCredit = tx.type === 'CREDIT' || tx.type === 'RELEASE' || tx.type === 'REFUND'
              return (
                <div key={tx.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', config.color)}>
                      <config.icon size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{tx.description}</p>
                      <p className="text-xs text-gray-400">{formatRelative(tx.createdAt)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn('text-sm font-bold', isCredit ? 'text-green-600' : 'text-red-600')}>
                      {isCredit ? '+' : '-'}{formatCurrency(tx.amount)}
                    </p>
                    <span className={cn('text-xs px-2 py-0.5 rounded-full', tx.status === 'COMPLETED' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600')}>
                      {tx.status.toLowerCase()}
                    </span>
                  </div>
                </div>
              )
            })}
            {(!wallet?.transactions || wallet.transactions.length === 0) && (
              <p className="text-center text-sm text-gray-400 py-8">No transactions yet</p>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
