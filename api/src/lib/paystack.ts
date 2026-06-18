import axios from 'axios'
import { env } from '../config/env'

const paystackClient = axios.create({
  baseURL: 'https://api.paystack.co',
  headers: {
    Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json',
  },
})

export const paystack = {
  initializeTransaction: async (email: string, amount: number, reference: string) => {
    const { data } = await paystackClient.post('/transaction/initialize', {
      email,
      amount: Math.round(amount * 100), // kobo
      reference,
    })
    return data.data as { authorization_url: string; access_code: string; reference: string }
  },

  verifyTransaction: async (reference: string) => {
    const { data } = await paystackClient.get(`/transaction/verify/${reference}`)
    return data.data as { status: string; amount: number; reference: string }
  },

  createTransferRecipient: async (params: {
    name: string
    accountNumber: string
    bankCode: string
  }) => {
    const { data } = await paystackClient.post('/transferrecipient', {
      type: 'nuban',
      name: params.name,
      account_number: params.accountNumber,
      bank_code: params.bankCode,
      currency: 'NGN',
    })
    return data.data as { recipient_code: string; id: number }
  },

  initiateTransfer: async (params: {
    amount: number
    recipientCode: string
    reference: string
    reason: string
  }) => {
    const { data } = await paystackClient.post('/transfer', {
      source: 'balance',
      amount: Math.round(params.amount * 100), // kobo
      recipient: params.recipientCode,
      reference: params.reference,
      reason: params.reason,
    })
    return data.data as { transfer_code: string; status: string; reference: string }
  },
}
