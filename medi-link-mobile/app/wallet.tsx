import { useEffect, useRef, useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Animated, Modal, TextInput,
  KeyboardAvoidingView, Platform,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import * as Haptics from 'expo-haptics'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Linking } from 'react-native'
import { useTheme } from '../constants/theme'
import { api } from '../lib/api'

const WALLET_GRADIENT: [string, string] = ['#14532D', '#052E16']

type TxType = 'credit' | 'debit' | 'escrow' | 'fund'

interface Transaction {
  id: string
  type: TxType
  amount: number
  description: string
  date: string
  status: 'completed' | 'pending'
}

function mapTxType(apiType: string): TxType {
  if (apiType === 'CREDIT') return 'credit'
  if (apiType === 'DEBIT')  return 'debit'
  return 'fund'
}

function mapTx(t: any): Transaction {
  return {
    id: t.id,
    type: mapTxType(t.type),
    amount: t.amount,
    description: t.description,
    date: new Date(t.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' }),
    status: t.status === 'COMPLETED' ? 'completed' : 'pending',
  }
}

function txColor(type: TxType, colors: any): string {
  switch (type) {
    case 'credit': return colors.sage
    case 'fund':   return colors.teal
    case 'escrow': return colors.warning
    case 'debit':  return colors.error
  }
}

function txIcon(type: TxType): React.ComponentProps<typeof Ionicons>['name'] {
  switch (type) {
    case 'credit': return 'arrow-down-circle-outline'
    case 'fund':   return 'add-circle-outline'
    case 'escrow': return 'shield-outline'
    case 'debit':  return 'arrow-up-circle-outline'
  }
}

function txPrefix(type: TxType): string {
  return type === 'credit' || type === 'fund' ? '+' : '-'
}

// ─── Count-up hook ────────────────────────────────────────────────────────────

function useCountUp(target: number, duration = 1400, enabled = false) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!enabled) { setValue(0); return }
    let startTime: number | null = null
    let frameId: number
    const step = (ts: number) => {
      if (!startTime) startTime = ts
      const t = Math.min((ts - startTime) / duration, 1)
      setValue(Math.round((1 - Math.pow(1 - t, 3)) * target))
      if (t < 1) frameId = requestAnimationFrame(step)
    }
    frameId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frameId)
  }, [target, enabled])
  return value
}

// ─── Fund / Withdraw sheet ────────────────────────────────────────────────────

type SheetMode = 'fund' | 'withdraw' | null

function ActionSheet({ mode, onClose, colors, insets, onFunded }: {
  mode: SheetMode
  onClose: () => void
  colors: any
  insets: any
  onFunded?: () => void
}) {
  const [amount, setAmount]           = useState('')
  const [accountNumber, setAcctNum]   = useState('')
  const [accountName, setAcctName]    = useState('')
  const [bankCode, setBankCode]       = useState('')
  const [loading, setLoading]         = useState(false)
  const [done, setDone]               = useState(false)
  const [error, setError]             = useState('')

  const sheetY = useRef(new Animated.Value(400)).current
  const bgOp   = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (mode) {
      setAmount(''); setAcctNum(''); setAcctName(''); setBankCode('')
      setLoading(false); setDone(false); setError('')
      Animated.parallel([
        Animated.spring(sheetY, { toValue: 0, tension: 55, friction: 14, useNativeDriver: true }),
        Animated.timing(bgOp,   { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start()
    }
  }, [mode])

  const close = () => {
    Animated.parallel([
      Animated.timing(sheetY, { toValue: 400, duration: 240, useNativeDriver: true }),
      Animated.timing(bgOp,   { toValue: 0,   duration: 200, useNativeDriver: true }),
    ]).start(() => onClose())
  }

  const handleConfirm = async () => {
    if (!amount.trim()) return
    if (mode === 'withdraw' && (!accountNumber.trim() || !accountName.trim() || !bankCode.trim())) {
      setError('All bank fields are required'); return
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    setLoading(true)
    setError('')
    try {
      if (mode === 'fund') {
        const { data } = await api.post('/wallet/fund/initialize', { amount: Number(amount) })
        const url = data.data?.authorization_url
        if (url) await Linking.openURL(url)
        setDone(true)
        setTimeout(() => { close(); onFunded?.() }, 1400)
      } else {
        await api.post('/wallet/withdraw', {
          amount: Number(amount),
          accountNumber: accountNumber.trim(),
          accountName: accountName.trim(),
          bankCode: bankCode.trim(),
        })
        setDone(true)
        setTimeout(() => { close(); onFunded?.() }, 1400)
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (!mode) return null

  const isFund = mode === 'fund'

  return (
    <Modal transparent visible={!!mode} animationType="none" onRequestClose={close}>
      {/* Backdrop overlay — covers full screen including keyboard area */}
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, sh.backdropOverlay, { opacity: bgOp }]}
      />
      {/* Tap outside sheet to close */}
      <TouchableOpacity style={StyleSheet.absoluteFill} onPress={close} activeOpacity={1} />
      {/* Sheet lifts above keyboard */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={sh.kav}
        pointerEvents="box-none"
      >
        <Animated.View style={[
          sh.sheet,
          { backgroundColor: colors.background, paddingBottom: insets.bottom + 20 },
          { transform: [{ translateY: sheetY }] },
        ]}>
          <View style={[sh.handle, { backgroundColor: colors.border }]} />

          {done ? (
            <View style={sh.doneWrap}>
              <View style={[sh.doneIcon, { backgroundColor: `${colors.sage}18` }]}>
                <Ionicons name="checkmark-circle" size={52} color={colors.sage} />
              </View>
              <Text style={[sh.doneTitle, { color: colors.textPrimary }]}>
                {isFund ? 'Funds incoming!' : 'Withdrawal requested!'}
              </Text>
              <Text style={[sh.doneSub, { color: colors.textMuted }]}>
                ₦{Number(amount).toLocaleString()} · Processing 1–3 minutes
              </Text>
            </View>
          ) : (
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={sh.sheetScroll}
            >
              <Text style={[sh.sheetTitle, { color: colors.textPrimary }]}>
                {isFund ? 'Add Funds' : 'Withdraw Funds'}
              </Text>
              <Text style={[sh.sheetSub, { color: colors.textMuted }]}>
                {isFund
                  ? 'Funds reflect in your wallet within 1–3 minutes'
                  : 'Withdrawn to your registered bank account'}
              </Text>

              {/* Amount input */}
              <View style={[sh.amountWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[sh.naira, { color: colors.textMuted }]}>₦</Text>
                <TextInput
                  style={[sh.amountInput, { color: colors.textPrimary }]}
                  placeholder="0.00"
                  placeholderTextColor={colors.textMuted}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                  autoFocus
                />
              </View>

              {/* Quick amounts */}
              <View style={sh.quickRow}>
                {['5,000', '10,000', '20,000', '50,000'].map(q => (
                  <TouchableOpacity
                    key={q}
                    style={[sh.quickChip, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setAmount(q.replace(',', '')) }}
                  >
                    <Text style={[sh.quickText, { color: colors.textSecondary }]}>₦{q}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {!isFund && (
                <View style={{ gap: 12 }}>
                  <View style={[sh.amountWrap, { backgroundColor: colors.surface, borderColor: colors.border, height: 52 }]}>
                    <TextInput
                      style={[sh.amountInput, { color: colors.textPrimary, fontSize: 16 }]}
                      placeholder="Account number"
                      placeholderTextColor={colors.textMuted}
                      value={accountNumber}
                      onChangeText={setAcctNum}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={[sh.amountWrap, { backgroundColor: colors.surface, borderColor: colors.border, height: 52 }]}>
                    <TextInput
                      style={[sh.amountInput, { color: colors.textPrimary, fontSize: 16 }]}
                      placeholder="Account name"
                      placeholderTextColor={colors.textMuted}
                      value={accountName}
                      onChangeText={setAcctName}
                      autoCapitalize="words"
                    />
                  </View>
                  <View style={[sh.amountWrap, { backgroundColor: colors.surface, borderColor: colors.border, height: 52 }]}>
                    <TextInput
                      style={[sh.amountInput, { color: colors.textPrimary, fontSize: 16 }]}
                      placeholder="Bank code (e.g. 058 for GTBank)"
                      placeholderTextColor={colors.textMuted}
                      value={bankCode}
                      onChangeText={setBankCode}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              )}

              {!!error && (
                <Text style={{ fontSize: 14, color: colors.error, textAlign: 'center' }}>{error}</Text>
              )}

              <TouchableOpacity
                style={[sh.confirmBtn, { backgroundColor: amount.trim() ? colors.sage : colors.border }]}
                onPress={handleConfirm}
                disabled={!amount.trim() || loading}
              >
                <Text style={[sh.confirmText, { color: amount.trim() ? '#FFFFFF' : colors.textMuted }]}>
                  {loading ? 'Processing…' : isFund ? 'Pay via Paystack' : 'Withdraw ₦' + (amount ? Number(amount).toLocaleString() : '0')}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const sh = StyleSheet.create({
  backdropOverlay: { backgroundColor: 'rgba(0,0,0,0.45)' },
  kav:       { flex: 1, justifyContent: 'flex-end' },
  sheet:     { borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 16, paddingHorizontal: 24, maxHeight: '90%' },
  sheetScroll: { gap: 16, paddingBottom: 8 },
  handle:    { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 8 },
  sheetTitle:{ fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
  sheetSub:  { fontSize: 15, marginTop: -8 },
  amountWrap:{ flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: 1.5, paddingHorizontal: 18, height: 64 },
  naira:     { fontSize: 28, fontWeight: '400', marginRight: 4 },
  amountInput:{ flex: 1, fontSize: 36, fontWeight: '700', letterSpacing: -0.5 },
  quickRow:  { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  quickChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, borderWidth: 1 },
  quickText: { fontSize: 14, fontWeight: '600' },
  bankBox:   { borderRadius: 14, borderWidth: 1, padding: 14, gap: 6 },
  bankLabel: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5 },
  bankName:  { fontSize: 16, fontWeight: '700' },
  bankAcc:   { fontSize: 17, fontWeight: '800', letterSpacing: 1 },
  copyBtn:   { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1, marginTop: 2 },
  copyText:  { fontSize: 13, fontWeight: '600' },
  confirmBtn:{ height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  confirmText:{ fontSize: 17, fontWeight: '700' },
  doneWrap:  { alignItems: 'center', paddingVertical: 24, gap: 12 },
  doneIcon:  { width: 96, height: 96, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  doneTitle: { fontSize: 22, fontWeight: '800' },
  doneSub:   { fontSize: 16, textAlign: 'center' },
})

// ─── Transaction row ──────────────────────────────────────────────────────────

function TxRow({ tx, index, colors }: { tx: Transaction; index: number; colors: any }) {
  const ty = useRef(new Animated.Value(16)).current
  const op = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.sequence([
      Animated.delay(index * 55),
      Animated.parallel([
        Animated.spring(ty, { toValue: 0, tension: 180, friction: 18, useNativeDriver: true }),
        Animated.timing(op, { toValue: 1, duration: 180, useNativeDriver: true }),
      ]),
    ]).start()
  }, [])

  const color = txColor(tx.type, colors)

  return (
    <Animated.View style={[tx_s.row, { borderBottomColor: colors.border }, { transform: [{ translateY: ty }], opacity: op }]}>
      <View style={[tx_s.icon, { backgroundColor: `${color}14` }]}>
        <Ionicons name={txIcon(tx.type)} size={20} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[tx_s.desc, { color: colors.textPrimary }]} numberOfLines={1}>{tx.description}</Text>
        <View style={tx_s.meta}>
          <Text style={[tx_s.date, { color: colors.textMuted }]}>{tx.date}</Text>
          {tx.status === 'pending' && (
            <View style={[tx_s.pendingPill, { backgroundColor: `${colors.warning}18`, borderColor: `${colors.warning}40` }]}>
              <Text style={[tx_s.pendingText, { color: colors.warning }]}>Pending</Text>
            </View>
          )}
        </View>
      </View>
      <Text style={[tx_s.amount, { color }]}>
        {txPrefix(tx.type)}₦{tx.amount.toLocaleString()}
      </Text>
    </Animated.View>
  )
}

const tx_s = StyleSheet.create({
  row:     { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  icon:    { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  desc:    { fontSize: 15, fontWeight: '600' },
  meta:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3 },
  date:    { fontSize: 13 },
  pendingPill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  pendingText: { fontSize: 11, fontWeight: '600' },
  amount:  { fontSize: 15, fontWeight: '800' },
})

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function WalletScreen() {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const router = useRouter()

  const [ready, setReady]         = useState(false)
  const [sheet, setSheet]         = useState<SheetMode>(null)
  const [showBal, setShowBal]     = useState(true)
  const [walletBalance, setWalletBalance] = useState(0)
  const [walletEscrow, setWalletEscrow]   = useState(0)
  const [transactions, setTransactions]   = useState<Transaction[]>([])

  const headerY  = useRef(new Animated.Value(-16)).current
  const headerOp = useRef(new Animated.Value(0)).current
  const cardScale = useRef(new Animated.Value(0.94)).current
  const cardOp    = useRef(new Animated.Value(0)).current

  const balance = useCountUp(walletBalance, 1200, ready)
  const escrow  = useCountUp(walletEscrow,  900,  ready)

  const fetchWallet = async () => {
    try {
      const { data } = await api.get('/wallet')
      const w = data.data
      setWalletBalance(w.balance || 0)
      setWalletEscrow(w.escrow || 0)
      setTransactions((w.transactions as any[] || []).map(mapTx))
    } catch {}
  }

  useEffect(() => {
    Animated.parallel([
      Animated.spring(headerY,  { toValue: 0, tension: 60, friction: 14, useNativeDriver: true }),
      Animated.timing(headerOp, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.spring(cardScale,{ toValue: 1, tension: 60, friction: 12, useNativeDriver: true }),
      Animated.timing(cardOp,   { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start()
    fetchWallet().then(() => {
      const t = setTimeout(() => setReady(true), 200)
      return () => clearTimeout(t)
    })
  }, [])

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Header */}
      <Animated.View style={[
        styles.header,
        { paddingTop: insets.top + 16, borderBottomColor: colors.border },
        { transform: [{ translateY: headerY }], opacity: headerOp },
      ]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>My Wallet</Text>
        <TouchableOpacity
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowBal(v => !v) }}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name={showBal ? 'eye-outline' : 'eye-off-outline'} size={22} color={colors.textMuted} />
        </TouchableOpacity>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
      >
        {/* Balance card */}
        <Animated.View style={{ transform: [{ scale: cardScale }], opacity: cardOp }}>
          <LinearGradient
            colors={WALLET_GRADIENT}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.balanceCard}
          >
            {/* Top label row */}
            <View style={styles.cardTopRow}>
              <View style={styles.cardBrand}>
                <Ionicons name="wallet-outline" size={16} color="rgba(255,255,255,0.5)" />
                <Text style={styles.cardBrandText}>Medi_LinK Wallet</Text>
              </View>
              <View style={[styles.livePill, { backgroundColor: `${colors.sage}22`, borderColor: `${colors.sage}40` }]}>
                <View style={[styles.liveDot, { backgroundColor: colors.sage }]} />
                <Text style={[styles.liveText, { color: colors.sage }]}>Live</Text>
              </View>
            </View>

            {/* Balance amount */}
            <View style={styles.balanceRow}>
              <Text style={styles.balanceLabel}>Available Balance</Text>
              <Text style={styles.balanceAmount}>
                {showBal ? `₦${balance.toLocaleString()}` : '₦ ••••••'}
              </Text>
            </View>

            {/* Divider */}
            <View style={[styles.cardDivider, { backgroundColor: 'rgba(255,255,255,0.1)' }]} />

            {/* Escrow sub-balance */}
            <View style={styles.escrowRow}>
              <View>
                <Text style={styles.escrowLabel}>In Escrow (SabePay)</Text>
                <Text style={styles.escrowAmount}>
                  {showBal ? `₦${escrow.toLocaleString()}` : '₦ ••••'}
                </Text>
              </View>
              {walletEscrow > 0 && (
                <View style={[styles.escrowBadge, { backgroundColor: `${colors.warning}22`, borderColor: `${colors.warning}40` }]}>
                  <Ionicons name="shield-checkmark" size={13} color={colors.warning} />
                  <Text style={[styles.escrowBadgeText, { color: colors.warning }]}>Held</Text>
                </View>
              )}
            </View>

            {/* Action buttons */}
            <View style={styles.cardActions}>
              <TouchableOpacity
                style={[styles.cardBtn, styles.cardBtnSolid, { backgroundColor: colors.sagePale }]}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setSheet('fund') }}
              >
                <Ionicons name="add-circle-outline" size={18} color={colors.textPrimary} />
                <Text style={[styles.cardBtnText, { color: colors.textPrimary }]}>Fund</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.cardBtn, styles.cardBtnOutline]}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setSheet('withdraw') }}
              >
                <Ionicons name="arrow-up-outline" size={18} color="rgba(255,255,255,0.85)" />
                <Text style={[styles.cardBtnText, { color: 'rgba(255,255,255,0.85)' }]}>Withdraw</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Stats strip */}
        {(() => {
          const totalIn  = transactions.filter(t => t.type === 'credit' || t.type === 'fund').reduce((s, t) => s + t.amount, 0)
          const totalOut = transactions.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0)
          const stats = [
            { label: 'Total In',  value: `₦${totalIn.toLocaleString()}`,        color: colors.sage  },
            { label: 'Total Out', value: `₦${totalOut.toLocaleString()}`,       color: colors.error },
            { label: 'Balance',   value: `₦${walletBalance.toLocaleString()}`,  color: colors.teal  },
          ]
          return (
            <View style={[styles.statsRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {stats.map((s, i) => (
                <View key={s.label} style={[styles.statCell, i < 2 && { borderRightWidth: 1, borderRightColor: colors.border }]}>
                  <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                  <Text style={[styles.statLabel, { color: colors.textMuted }]}>{s.label}</Text>
                </View>
              ))}
            </View>
          )
        })()}

        {/* Transactions */}
        <View style={styles.txSection}>
          <View style={styles.txHeader}>
            <Text style={[styles.txTitle, { color: colors.textPrimary }]}>Transactions</Text>
            <View style={[styles.txFilterRow]}>
              {(['All', 'Credits', 'Debits'] as const).map(f => (
                <TouchableOpacity key={f} style={[styles.txChip, { backgroundColor: f === 'All' ? colors.sage : colors.surface, borderColor: f === 'All' ? colors.sage : colors.border }]}>
                  <Text style={[styles.txChipText, { color: f === 'All' ? '#FFFFFF' : colors.textMuted }]}>{f}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={[styles.txList, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {transactions.map((tx, i) => (
              <TxRow key={tx.id} tx={tx} index={i} colors={colors} />
            ))}
          </View>
        </View>
      </ScrollView>

      <ActionSheet mode={sheet} onClose={() => setSheet(null)} colors={colors} insets={insets} onFunded={fetchWallet} />
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1,
  },
  title: { fontSize: 18, fontWeight: '700' },

  scroll: { paddingHorizontal: 20, paddingTop: 20, gap: 16 },

  balanceCard: {
    borderRadius: 24, padding: 22, gap: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.28, shadowRadius: 24, elevation: 16,
  },
  cardTopRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardBrand:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardBrandText:{ fontSize: 13, fontWeight: '500', color: 'rgba(255,255,255,0.5)', letterSpacing: 0.5 },
  livePill:     { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 10, borderWidth: 1 },
  liveDot:      { width: 6, height: 6, borderRadius: 3 },
  liveText:     { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },

  balanceRow:   { gap: 6 },
  balanceLabel: { fontSize: 13, fontWeight: '500', color: 'rgba(255,255,255,0.5)', letterSpacing: 0.4 },
  balanceAmount:{ fontSize: 38, fontWeight: '800', color: '#fff', letterSpacing: -1 },

  cardDivider:  { height: 1 },

  escrowRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  escrowLabel: { fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: '500' },
  escrowAmount:{ fontSize: 18, fontWeight: '700', color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  escrowBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, borderWidth: 1 },
  escrowBadgeText:{ fontSize: 12, fontWeight: '600' },

  cardActions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  cardBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 7, height: 48, borderRadius: 14,
  },
  cardBtnSolid:   {},
  cardBtnOutline: { borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.25)' },
  cardBtnText:    { fontSize: 16, fontWeight: '700' },

  statsRow: { flexDirection: 'row', borderWidth: 1, borderRadius: 18, overflow: 'hidden' },
  statCell: { flex: 1, alignItems: 'center', paddingVertical: 14, gap: 3 },
  statValue:{ fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },
  statLabel:{ fontSize: 12, fontWeight: '500' },

  txSection: { gap: 14 },
  txHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  txTitle:   { fontSize: 18, fontWeight: '700' },
  txFilterRow: { flexDirection: 'row', gap: 6 },
  txChip:    { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, borderWidth: 1 },
  txChipText:{ fontSize: 13, fontWeight: '600' },

  txList: { borderRadius: 18, borderWidth: 1, paddingHorizontal: 16, overflow: 'hidden' },
})
