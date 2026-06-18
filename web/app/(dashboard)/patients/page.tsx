'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Loader2, X, User, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { Patient } from '@/types'

const ADHERENCE_CONFIG = {
  ON_TRACK: { label: 'On Track', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  MISSED: { label: 'Missed', color: 'bg-amber-100 text-amber-700', icon: AlertTriangle },
  CRITICAL: { label: 'Critical', color: 'bg-red-100 text-red-700', icon: XCircle },
}

function AddPatientModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient()
  const { register, handleSubmit, formState: { isSubmitting } } = useForm()
  const mutation = useMutation({
    mutationFn: (data: unknown) => api.post('/patients', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['patients'] }); onClose() },
  })
  const inputClass = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500'
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold">Add Patient</h2>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-3">
          <div><label className="text-xs font-medium text-gray-600 mb-1 block">Full name *</label>
            <input {...register('name', { required: true })} placeholder="Chioma Nwosu" className={inputClass} /></div>
          <div><label className="text-xs font-medium text-gray-600 mb-1 block">Phone</label>
            <input {...register('phone')} placeholder="+234 812 345 6789" className={inputClass} /></div>
          <div><label className="text-xs font-medium text-gray-600 mb-1 block">Condition / Diagnosis</label>
            <input {...register('condition')} placeholder="Hypertension" className={inputClass} /></div>
          <div><label className="text-xs font-medium text-gray-600 mb-1 block">Notes</label>
            <textarea {...register('notes')} rows={2} className={inputClass} /></div>
          <button type="submit" disabled={isSubmitting || mutation.isPending}
            className="w-full bg-primary-600 text-white font-semibold py-2.5 rounded-lg hover:bg-primary-700 disabled:opacity-60 flex items-center justify-center gap-2 text-sm">
            {mutation.isPending && <Loader2 size={16} className="animate-spin" />} Add Patient
          </button>
        </form>
      </div>
    </div>
  )
}

export default function PatientsPage() {
  const [showModal, setShowModal] = useState(false)
  const [selected, setSelected] = useState<Patient | null>(null)

  const { data: patients = [], isLoading } = useQuery({
    queryKey: ['patients'],
    queryFn: () => api.get('/patients').then((r) => r.data.data as Patient[]),
  })

  const overallAdherence = (patient: Patient) => {
    if (!patient.medications.length) return 'ON_TRACK' as const
    if (patient.medications.some((m) => m.adherence === 'CRITICAL')) return 'CRITICAL' as const
    if (patient.medications.some((m) => m.adherence === 'MISSED')) return 'MISSED' as const
    return 'ON_TRACK' as const
  }

  return (
    <div className="space-y-5 max-w-5xl">
      {showModal && <AddPatientModal onClose={() => setShowModal(false)} />}
      <div className="flex justify-end">
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-primary-600 text-white font-semibold px-4 py-2.5 rounded-lg hover:bg-primary-700 text-sm">
          <Plus size={16} /> Add Patient
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-primary-600" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {patients.map((patient) => {
            const adherence = overallAdherence(patient)
            const config = ADHERENCE_CONFIG[adherence]
            return (
              <div key={patient.id} onClick={() => setSelected(selected?.id === patient.id ? null : patient)}
                className="bg-white rounded-2xl border border-gray-100 p-5 cursor-pointer hover:border-primary-200 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                      <User size={18} className="text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">{patient.name}</h3>
                      <p className="text-xs text-gray-400">{patient.condition || 'No condition noted'}</p>
                    </div>
                  </div>
                  <span className={cn('text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1', config.color)}>
                    <config.icon size={10} /> {config.label}
                  </span>
                </div>
                <div className="text-xs text-gray-500 space-y-1">
                  <p>{patient.medications.length} medication{patient.medications.length !== 1 ? 's' : ''}</p>
                  {patient.phone && <p>{patient.phone}</p>}
                </div>
                {selected?.id === patient.id && patient.medications.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                    {patient.medications.map((med) => {
                      const mConfig = ADHERENCE_CONFIG[med.adherence]
                      return (
                        <div key={med.id} className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-medium text-gray-900">{med.drugName}</p>
                            <p className="text-xs text-gray-400">{med.dosage} · {med.frequency}</p>
                          </div>
                          <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', mConfig.color)}>{mConfig.label}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
          {patients.length === 0 && (
            <div className="col-span-3 text-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-100">
              <User size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">No patients yet</p>
              <p className="text-sm mt-1">Add patients to track medication adherence</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
