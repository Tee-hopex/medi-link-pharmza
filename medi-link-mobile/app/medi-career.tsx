import { useEffect, useRef, useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, ScrollView, TextInput,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { FlashList } from '@shopify/flash-list'
import { useTheme } from '../constants/theme'
import { JobListing } from '../constants/network'
import { api } from '../lib/api'

function mapJob(j: any): JobListing {
  return {
    id: j.id,
    title: j.title,
    company: j.poster?.facility?.name || `${j.poster?.firstName ?? ''} ${j.poster?.lastName ?? ''}`.trim(),
    location: j.location || '',
    type: j.type as JobListing['type'],
    salaryRange: j.salaryRange || '',
    postedDaysAgo: Math.floor((Date.now() - new Date(j.createdAt).getTime()) / 86_400_000),
    description: j.description || '',
    requirements: typeof j.requirements === 'string'
      ? j.requirements.split('\n').filter(Boolean)
      : (j.requirements || []),
    verified: !!(j.poster?.facility?.name),
    bookmarked: false,
    urgent: j.isUrgent ?? false,
  }
}

// ─── Type chip ────────────────────────────────────────────────────────────────

type Filter = 'all' | 'Full-time' | 'Part-time' | 'Contract' | 'Locum'

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all',       label: 'All'       },
  { key: 'Full-time', label: 'Full-time' },
  { key: 'Locum',     label: 'Locum'     },
  { key: 'Contract',  label: 'Contract'  },
  { key: 'Part-time', label: 'Part-time' },
]

function typeColor(type: JobListing['type'], colors: any): string {
  switch (type) {
    case 'Locum':     return colors.warning
    case 'Contract':  return colors.teal
    case 'Part-time': return colors.sage
    default:          return colors.textSecondary
  }
}

// ─── Job card ─────────────────────────────────────────────────────────────────

function JobCard({ job, index, visible, onBookmark, onApply }: {
  job: JobListing; index: number; visible: boolean
  onBookmark: (id: string) => void
  onApply: (id: string) => void
}) {
  const { colors } = useTheme()
  const ty      = useRef(new Animated.Value(24)).current
  const opacity = useRef(new Animated.Value(0)).current
  const scale   = useRef(new Animated.Value(1)).current
  const bmScale = useRef(new Animated.Value(1)).current

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.delay(index * 70),
        Animated.parallel([
          Animated.spring(ty,      { toValue: 0, tension: 160, friction: 18, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        ]),
      ]).start()
    } else {
      ty.setValue(24); opacity.setValue(0)
    }
  }, [visible])

  const handleBookmark = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    Animated.sequence([
      Animated.spring(bmScale, { toValue: 1.3, tension: 300, friction: 8, useNativeDriver: true }),
      Animated.spring(bmScale, { toValue: 1,   tension: 300, friction: 8, useNativeDriver: true }),
    ]).start()
    onBookmark(job.id)
  }

  const color = typeColor(job.type, colors)

  return (
    <Animated.View style={{ transform: [{ translateY: ty }, { scale }], opacity }}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={() => Animated.spring(scale, { toValue: 0.97, tension: 300, friction: 10, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1,    tension: 300, friction: 10, useNativeDriver: true }).start()}
        onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
      >
        <View style={[jc.card, { backgroundColor: colors.surface, borderColor: job.urgent ? `${colors.warning}50` : colors.border }]}>
          {/* Top row */}
          <View style={jc.topRow}>
            <View style={{ flex: 1, gap: 4 }}>
              {job.urgent && (
                <View style={[jc.urgentBadge, { backgroundColor: `${colors.warning}18`, borderColor: `${colors.warning}40` }]}>
                  <Ionicons name="flash" size={11} color={colors.warning} />
                  <Text style={[jc.urgentText, { color: colors.warning }]}>Urgent</Text>
                </View>
              )}
              <Text style={[jc.title, { color: colors.textPrimary }]}>{job.title}</Text>
              <View style={jc.companyRow}>
                <Text style={[jc.company, { color: colors.textSecondary }]}>{job.company}</Text>
                {job.verified && (
                  <Ionicons name="shield-checkmark" size={13} color={colors.sage} />
                )}
              </View>
            </View>

            <Animated.View style={{ transform: [{ scale: bmScale }] }}>
              <TouchableOpacity
                style={[jc.bmBtn, { backgroundColor: job.bookmarked ? `${colors.sage}18` : colors.background, borderColor: job.bookmarked ? `${colors.sage}40` : colors.border }]}
                onPress={handleBookmark}
              >
                <Ionicons
                  name={job.bookmarked ? 'bookmark' : 'bookmark-outline'}
                  size={18}
                  color={job.bookmarked ? colors.sage : colors.textMuted}
                />
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* Meta row */}
          <View style={jc.metaRow}>
            <View style={jc.metaItem}>
              <Ionicons name="location-outline" size={14} color={colors.textMuted} />
              <Text style={[jc.metaText, { color: colors.textMuted }]}>{job.location}</Text>
            </View>
            <View style={[jc.typePill, { backgroundColor: `${color}18`, borderColor: `${color}40` }]}>
              <Text style={[jc.typeText, { color }]}>{job.type}</Text>
            </View>
            <Text style={[jc.salary, { color: colors.textPrimary }]}>{job.salaryRange}</Text>
          </View>

          {/* Description preview */}
          <Text style={[jc.desc, { color: colors.textSecondary }]} numberOfLines={2}>
            {job.description}
          </Text>

          {/* Footer */}
          <View style={jc.footer}>
            <Text style={[jc.posted, { color: colors.textMuted }]}>
              {job.postedDaysAgo === 0 ? 'Posted today' : `Posted ${job.postedDaysAgo}d ago`}
            </Text>
            <TouchableOpacity
              style={[jc.applyBtn, { backgroundColor: colors.textPrimary }]}
              onPress={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
                onApply(job.id)
              }}
            >
              <Text style={[jc.applyText, { color: colors.sage }]}>Apply Now</Text>
              <Ionicons name="arrow-forward" size={14} color={colors.sage} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}

const jc = StyleSheet.create({
  card: { borderRadius: 18, borderWidth: 1, padding: 16, gap: 12 },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  urgentBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 8, borderWidth: 1,
  },
  urgentText: { fontSize: 11, fontWeight: '700' },
  title:   { fontSize: 18, fontWeight: '700', letterSpacing: -0.2 },
  companyRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  company: { fontSize: 14 },
  bmBtn:   { width: 36, height: 36, borderRadius: 11, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  metaItem:{ flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText:{ fontSize: 13 },
  typePill: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1,
  },
  typeText: { fontSize: 12, fontWeight: '700' },
  salary:   { fontSize: 15, fontWeight: '800', marginLeft: 'auto' },
  desc:     { fontSize: 14, lineHeight: 21 },
  footer:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  posted:   { fontSize: 13 },
  applyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12,
  },
  applyText: { fontSize: 14, fontWeight: '700' },
})

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function MediCareerScreen() {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const router = useRouter()

  const [filter, setFilter]   = useState<Filter>('all')
  const [query, setQuery]     = useState('')
  const [jobs, setJobs]       = useState<JobListing[]>([])
  const [visible, setVisible] = useState(false)
  const [applying, setApplying] = useState<string | null>(null)

  const headerY  = useRef(new Animated.Value(-16)).current
  const headerOp = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.parallel([
      Animated.spring(headerY,  { toValue: 0, tension: 60, friction: 14, useNativeDriver: true }),
      Animated.timing(headerOp, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start()
    api.get('/jobs').then(({ data }) => {
      setJobs((data.data as any[]).map(mapJob))
      setTimeout(() => setVisible(true), 150)
    }).catch(() => setTimeout(() => setVisible(true), 150))
  }, [])

  const handleBookmark = (id: string) => {
    setJobs(prev => prev.map(j => j.id === id ? { ...j, bookmarked: !j.bookmarked } : j))
  }

  const handleApply = async (id: string) => {
    if (applying === id) return
    setApplying(id)
    try {
      await api.post(`/jobs/${id}/apply`, {})
    } catch {}
    setApplying(null)
  }

  const filtered = jobs.filter(j => {
    const matchFilter = filter === 'all' || j.type === filter
    const matchQuery  = !query.trim() ||
      j.title.toLowerCase().includes(query.toLowerCase()) ||
      j.company.toLowerCase().includes(query.toLowerCase()) ||
      j.location.toLowerCase().includes(query.toLowerCase())
    return matchFilter && matchQuery
  })

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Header */}
      <Animated.View style={[
        styles.header,
        { paddingTop: insets.top + 16, backgroundColor: colors.background },
        { transform: [{ translateY: headerY }], opacity: headerOp },
      ]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>MediCareer</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              {filtered.length} job{filtered.length !== 1 ? 's' : ''} available
            </Text>
          </View>
          <View style={[styles.bookmarksBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="bookmark-outline" size={20} color={colors.textPrimary} />
            {jobs.filter(j => j.bookmarked).length > 0 && (
              <View style={[styles.bmCount, { backgroundColor: colors.sage }]}>
                <Text style={styles.bmCountText}>{jobs.filter(j => j.bookmarked).length}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Search */}
        <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="search-outline" size={19} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Search jobs, companies, locations…"
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {FILTERS.map(f => {
            const active = filter === f.key
            return (
              <TouchableOpacity
                key={f.key}
                style={[styles.chip, { backgroundColor: active ? colors.textPrimary : colors.surface, borderColor: active ? colors.textPrimary : colors.border }]}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setFilter(f.key); setVisible(false); setTimeout(() => setVisible(true), 50) }}
              >
                <Text style={[styles.chipText, { color: active ? '#fff' : colors.textSecondary }]}>{f.label}</Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </Animated.View>

      {/* Job list */}
      <FlashList
        data={filtered}
        keyExtractor={j => j.id}
        estimatedItemSize={200}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: insets.bottom + 120 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="briefcase-outline" size={52} color={colors.border} />
            <Text style={[styles.emptyTitle, { color: colors.textMuted }]}>No jobs found</Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <View style={{ marginBottom: 12 }}>
            <JobCard job={item} index={index} visible={visible} onBookmark={handleBookmark} onApply={handleApply} />
          </View>
        )}
      />
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1 },

  header: { paddingHorizontal: 20, paddingBottom: 14, zIndex: 10 },
  headerTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 16 },
  title:    { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, marginTop: 2 },
  bookmarksBtn: {
    width: 46, height: 46, borderRadius: 14, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  bmCount: { position: 'absolute', top: -4, right: -4, width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  bmCountText: { fontSize: 11, fontWeight: '800', color: '#fff' },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    height: 52, borderRadius: 14, borderWidth: 1.5,
    paddingHorizontal: 16, marginBottom: 14,
  },
  searchInput: { flex: 1, fontSize: 16 },

  filterRow: { flexDirection: 'row', gap: 8, paddingBottom: 2 },
  chip: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, borderWidth: 1.5 },
  chipText: { fontSize: 14, fontWeight: '600' },

  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: '600' },
})
