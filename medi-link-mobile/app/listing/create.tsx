import { useState, useRef, useEffect } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Switch, KeyboardAvoidingView, Platform, Alert, TextInput, Animated,
} from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '../../constants/theme'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { api } from '../../lib/api'

export default function CreateListingScreen() {
  const { colors } = useTheme()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const params = useLocalSearchParams<{
    inventoryItemId?: string
    name?: string
    genericName?: string
    category?: string
    unit?: string
    quantity?: string
    sellingPrice?: string
    expiryDate?: string
  }>()

  const fromInventory = !!params.inventoryItemId

  const [drugName, setDrugName]       = useState(params.name ?? '')
  const [genericName, setGenericName] = useState(params.genericName ?? '')
  const [category, setCategory]       = useState(params.category ?? '')
  const [unit, setUnit]               = useState(params.unit ?? '')
  const [quantity, setQuantity]       = useState(params.quantity ?? '')
  const [askingPrice, setAskingPrice] = useState('')
  const [originalPrice, setOriginalPrice] = useState(params.sellingPrice ?? '')
  const [expiryDate, setExpiryDate]   = useState(() => {
    if (!params.expiryDate) return ''
    const d = new Date(params.expiryDate)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })
  const [description, setDescription] = useState('')
  const [isUrgent, setIsUrgent]       = useState(false)
  const [loading, setLoading]         = useState(false)

  const headerY  = useRef(new Animated.Value(-16)).current
  const headerOp = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.parallel([
      Animated.spring(headerY,  { toValue: 0, tension: 60, friction: 14, useNativeDriver: true }),
      Animated.timing(headerOp, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start()
  }, [])

  const handleSubmit = async () => {
    if (!drugName.trim() || !unit.trim() || !quantity || !askingPrice || !expiryDate) {
      Alert.alert('Missing fields', 'Drug name, unit, quantity, asking price, and expiry date are required.')
      return
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setLoading(true)
    try {
      await api.post('/marketplace', {
        drugName: drugName.trim(),
        ...(genericName.trim() && { genericName: genericName.trim() }),
        ...(category.trim()    && { category: category.trim() }),
        unit: unit.trim(),
        quantity: parseInt(quantity, 10),
        askingPrice: parseFloat(askingPrice),
        ...(originalPrice && { originalPrice: parseFloat(originalPrice) }),
        expiryDate,
        ...(description.trim() && { description: description.trim() }),
        isUrgent,
        ...(params.inventoryItemId && { inventoryItemId: params.inventoryItemId }),
      })
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      router.back()
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to create listing. Check verification level.'
      Alert.alert('Error', msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        {/* Header */}
        <Animated.View style={[
          styles.header,
          { paddingTop: insets.top + 16, borderBottomColor: colors.border },
          { transform: [{ translateY: headerY }], opacity: headerOp },
        ]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>List on Marketplace</Text>
          <View style={{ width: 40 }} />
        </Animated.View>

        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
        >
          {/* Inventory banner */}
          {fromInventory && (
            <View style={[styles.banner, { backgroundColor: `${colors.sage}15`, borderColor: `${colors.sage}40` }]}>
              <Ionicons name="checkmark-circle" size={18} color={colors.sage} />
              <Text style={[styles.bannerText, { color: colors.sage }]}>
                Pre-filled from your inventory — just set the price
              </Text>
            </View>
          )}

          {/* Drug details */}
          <Text style={[styles.section, { color: colors.textMuted }]}>DRUG DETAILS</Text>
          <View style={styles.fields}>
            <Input
              label="Drug name *"
              value={drugName}
              onChangeText={setDrugName}
              placeholder="e.g. Amoxicillin 500mg"
              autoCapitalize="words"
            />
            <Input
              label="Generic name"
              value={genericName}
              onChangeText={setGenericName}
              placeholder="e.g. Amoxicillin Trihydrate"
              autoCapitalize="words"
            />
            <Input
              label="Category"
              value={category}
              onChangeText={setCategory}
              placeholder="e.g. Antibiotic"
              autoCapitalize="words"
            />
          </View>

          {/* Pricing & stock */}
          <Text style={[styles.section, { color: colors.textMuted }]}>PRICING & STOCK</Text>
          <View style={styles.fields}>
            <View style={styles.row2}>
              <View style={{ flex: 1 }}>
                <Input
                  label="Quantity *"
                  value={quantity}
                  onChangeText={setQuantity}
                  placeholder="50"
                  keyboardType="number-pad"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label="Unit *"
                  value={unit}
                  onChangeText={setUnit}
                  placeholder="Tabs"
                  autoCapitalize="words"
                />
              </View>
            </View>
            <View style={styles.row2}>
              <View style={{ flex: 1 }}>
                <Input
                  label="Asking price (₦) *"
                  value={askingPrice}
                  onChangeText={setAskingPrice}
                  placeholder="3500"
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label="Original price (₦)"
                  value={originalPrice}
                  onChangeText={setOriginalPrice}
                  placeholder="5000"
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
            <Input
              label="Expiry date *"
              value={expiryDate}
              onChangeText={setExpiryDate}
              placeholder="YYYY-MM-DD"
            />
          </View>

          {/* Options */}
          <Text style={[styles.section, { color: colors.textMuted }]}>OPTIONS</Text>
          <View style={styles.fields}>
            <View style={styles.descWrapper}>
              <Text style={[styles.descLabel, { color: colors.textSecondary }]}>Description</Text>
              <TextInput
                style={[styles.descInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
                value={description}
                onChangeText={setDescription}
                placeholder="Additional details (optional)"
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
            <View style={[styles.urgentRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.urgentLabel, { color: colors.textPrimary }]}>Mark as urgent</Text>
                <Text style={[styles.urgentSub, { color: colors.textMuted }]}>Highlights listing for fast visibility</Text>
              </View>
              <Switch
                value={isUrgent}
                onValueChange={(v) => { setIsUrgent(v); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light) }}
                trackColor={{ false: colors.border, true: colors.error }}
                thumbColor="#fff"
              />
            </View>
          </View>

          <Button label="Create Listing" onPress={handleSubmit} loading={loading} style={{ marginTop: 8 }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' },

  content: { paddingHorizontal: 20, paddingTop: 20 },

  banner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 24,
  },
  bannerText: { flex: 1, fontSize: 14, fontWeight: '500', lineHeight: 20 },

  section: { fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 14, marginTop: 4 },
  fields: { gap: 16, marginBottom: 28 },
  row2: { flexDirection: 'row', gap: 12 },

  descWrapper: { gap: 8 },
  descLabel: { fontSize: 15, fontWeight: '500', letterSpacing: 0.2 },
  descInput: {
    borderWidth: 1.5, borderRadius: 14, padding: 16,
    fontSize: 16, minHeight: 90,
  },

  urgentRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderRadius: 14, padding: 16, gap: 12,
  },
  urgentLabel: { fontSize: 16, fontWeight: '600', marginBottom: 3 },
  urgentSub:   { fontSize: 13 },
})
