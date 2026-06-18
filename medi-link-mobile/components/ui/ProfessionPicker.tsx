import { useEffect, useRef, useState } from 'react'
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  TextInput, SectionList, Animated, Dimensions, Platform,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '../../constants/theme'

const { height: SH } = Dimensions.get('window')

// ─── Profession data ───────────────────────────────────────────────────────────

const MEDICAL_SECTIONS = [
  {
    title: 'Doctors & Physicians',
    data: [
      'General Practitioner (GP)',
      'Medical Officer',
      'Surgeon',
      'Obstetrician / Gynaecologist',
      'Paediatrician',
      'Cardiologist',
      'Neurologist',
      'Psychiatrist',
      'Oncologist',
      'Anaesthesiologist',
      'Dermatologist',
      'Emergency Medicine Physician',
      'Family Medicine Physician',
      'Internal Medicine Physician',
      'Ophthalmologist',
      'Orthopaedic Surgeon',
      'Urologist',
      'ENT Specialist',
      'Endocrinologist',
      'Gastroenterologist',
      'Haematologist',
      'Nephrologist',
      'Pulmonologist / Chest Physician',
      'Rheumatologist',
      'Pathologist',
      'Forensic Medicine Physician',
    ],
  },
  {
    title: 'Pharmacy',
    data: [
      'Pharmacist',
      'Pharmacy Technician',
      'Clinical Pharmacist',
      'Industrial Pharmacist',
      'Pharmaceutical Scientist',
    ],
  },
  {
    title: 'Nursing & Midwifery',
    data: [
      'Registered Nurse (RN)',
      'Nurse-Midwife',
      'Community Health Nurse',
      'Perioperative Nurse',
      'Intensive Care Nurse',
      'Paediatric Nurse',
      'Psychiatric Nurse',
      'Nurse Practitioner',
      'Midwife',
    ],
  },
  {
    title: 'Dental',
    data: [
      'Dentist',
      'Dental Surgeon',
      'Oral & Maxillofacial Surgeon',
      'Orthodontist',
      'Prosthodontist',
      'Dental Technologist',
      'Dental Therapist',
    ],
  },
  {
    title: 'Medical Laboratory',
    data: [
      'Medical Laboratory Scientist',
      'Haematology Lab Scientist',
      'Microbiology Lab Scientist',
      'Biochemistry Lab Scientist',
      'Histopathology Lab Scientist',
      'Laboratory Technician',
    ],
  },
  {
    title: 'Imaging & Radiology',
    data: [
      'Radiologist',
      'Radiographer / Rad Technologist',
      'Sonographer / Ultrasonographer',
      'Nuclear Medicine Technologist',
    ],
  },
  {
    title: 'Allied Health',
    data: [
      'Physiotherapist',
      'Occupational Therapist',
      'Speech & Language Therapist',
      'Optometrist',
      'Orthoptist',
      'Dietitian / Nutritionist',
      'Prosthetics & Orthotics Specialist',
      'Medical Social Worker',
      'Health Psychologist',
      'Chiropractor',
    ],
  },
  {
    title: 'Community & Public Health',
    data: [
      'Community Health Officer (CHO)',
      'Community Health Extension Worker (CHEW)',
      'Community Health Practitioner',
      'Environmental Health Officer',
      'Public Health Practitioner',
      'Epidemiologist',
      'Health Educator',
      'Disease Surveillance Officer',
    ],
  },
  {
    title: 'Health Administration',
    data: [
      'Hospital Administrator',
      'Medical Records Officer',
      'Health Information Manager',
      'Healthcare Finance Officer',
      'Clinical Audit Officer',
    ],
  },
]

const NON_MEDICAL_SECTIONS = [
  {
    title: 'Pharmaceutical Supply Chain',
    data: [
      'Drug Wholesaler',
      'Pharmaceutical Distributor',
      'Pharmaceutical Sales Representative',
      'Medical Supplies Dealer',
      'NAFDAC Liaison Officer',
    ],
  },
  {
    title: 'Logistics & Warehousing',
    data: [
      'Warehouse Manager',
      'Logistics Coordinator',
      'Cold Chain Manager',
      'Procurement Officer',
      'Inventory Manager',
    ],
  },
  {
    title: 'Medical Equipment',
    data: [
      'Medical Equipment Supplier',
      'Biomedical Engineer',
      'Medical Device Sales Rep',
      'Biomedical Equipment Technician',
    ],
  },
  {
    title: 'Healthcare Administration',
    data: [
      'Hospital Administrator',
      'Healthcare Finance Manager',
      'Healthcare HR Manager',
      'Healthcare Legal Officer',
      'Quality Assurance Officer',
    ],
  },
  {
    title: 'Healthcare Technology',
    data: [
      'Healthcare IT Specialist',
      'Health Informatics Officer',
      'Telemedicine Coordinator',
      'Healthcare Data Analyst',
    ],
  },
]

// ─── Component ─────────────────────────────────────────────────────────────────

interface ProfessionPickerProps {
  label: string
  value: string
  onChange: (val: string) => void
  role: 'MEDICAL' | 'NON_MEDICAL' | 'PATIENT'
  error?: string
}

export function ProfessionPicker({ label, value, onChange, role, error }: ProfessionPickerProps) {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const slideY = useRef(new Animated.Value(SH)).current

  const sections = role === 'MEDICAL' ? MEDICAL_SECTIONS : NON_MEDICAL_SECTIONS

  const filtered = query.trim()
    ? sections
        .map(s => ({ ...s, data: s.data.filter(d => d.toLowerCase().includes(query.toLowerCase())) }))
        .filter(s => s.data.length > 0)
    : sections

  const openModal = () => {
    setOpen(true)
    Animated.spring(slideY, { toValue: 0, tension: 65, friction: 14, useNativeDriver: true }).start()
  }

  const closeModal = () => {
    Animated.timing(slideY, { toValue: SH, duration: 260, useNativeDriver: true }).start(() => {
      setOpen(false)
      setQuery('')
    })
  }

  const select = (val: string) => {
    onChange(val)
    closeModal()
  }

  return (
    <>
      {/* Trigger field */}
      <View style={styles.fieldWrap}>
        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{label}</Text>
        <TouchableOpacity
          style={[
            styles.trigger,
            { backgroundColor: colors.surface, borderColor: error ? colors.error : colors.border },
          ]}
          onPress={openModal}
          activeOpacity={0.7}
        >
          <Text style={[styles.triggerText, { color: value ? colors.textPrimary : colors.textMuted }]}>
            {value || 'Select your profession…'}
          </Text>
          <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
        </TouchableOpacity>
        {!!error && <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>}
      </View>

      {/* Picker Modal */}
      <Modal visible={open} transparent animationType="none" onRequestClose={closeModal}>
        <View style={styles.overlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={closeModal} activeOpacity={1} />

          <Animated.View style={[
            styles.sheet,
            { backgroundColor: colors.background, paddingBottom: insets.bottom + 16 },
            { transform: [{ translateY: slideY }] },
          ]}>
            {/* Handle */}
            <View style={[styles.handle, { backgroundColor: colors.border }]} />

            {/* Header */}
            <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>
                Select your profession
              </Text>
              <TouchableOpacity onPress={closeModal} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Search */}
            <View style={[styles.searchWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="search-outline" size={17} color={colors.textMuted} />
              <TextInput
                style={[styles.searchInput, { color: colors.textPrimary }]}
                placeholder="Search professions…"
                placeholderTextColor={colors.textMuted}
                value={query}
                onChangeText={setQuery}
                autoCorrect={false}
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={() => setQuery('')}>
                  <Ionicons name="close-circle" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {/* List */}
            <SectionList
              sections={filtered}
              keyExtractor={(item, i) => `${item}-${i}`}
              showsVerticalScrollIndicator={false}
              stickySectionHeadersEnabled={false}
              keyboardShouldPersistTaps="handled"
              renderSectionHeader={({ section }) => (
                <Text style={[styles.sectionHeader, { color: colors.sage, backgroundColor: colors.background }]}>
                  {section.title}
                </Text>
              )}
              renderItem={({ item }) => {
                const selected = value === item
                return (
                  <TouchableOpacity
                    style={[
                      styles.item,
                      { borderBottomColor: colors.border },
                      selected && { backgroundColor: colors.surface },
                    ]}
                    onPress={() => select(item)}
                    activeOpacity={0.65}
                  >
                    <Text style={[styles.itemText, { color: selected ? colors.sage : colors.textPrimary }]}>
                      {item}
                    </Text>
                    {selected && <Ionicons name="checkmark" size={17} color={colors.sage} />}
                  </TouchableOpacity>
                )
              }}
              ListEmptyComponent={
                <View style={styles.empty}>
                  <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                    No results for "{query}". You can type it in manually.
                  </Text>
                  <TouchableOpacity
                    style={[styles.useAnywayBtn, { borderColor: colors.border }]}
                    onPress={() => select(query)}
                  >
                    <Text style={[styles.useAnywayText, { color: colors.textPrimary }]}>
                      Use "{query}"
                    </Text>
                  </TouchableOpacity>
                </View>
              }
            />
          </Animated.View>
        </View>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  fieldWrap: { gap: 8 },
  fieldLabel: { fontSize: 15, fontWeight: '500', letterSpacing: 0.2 },
  trigger: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    height: 58, borderRadius: 14, borderWidth: 1.5, paddingHorizontal: 16,
  },
  triggerText: { fontSize: 17, flex: 1 },
  errorText:   { fontSize: 13 },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.42)', justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: SH * 0.88,
    overflow: 'hidden',
  },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  sheetHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1,
  },
  sheetTitle: { fontSize: 19, fontWeight: '700' },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 16, marginVertical: 12,
    borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 14, height: 50,
  },
  searchInput: { flex: 1, fontSize: 17 },

  sectionHeader: {
    fontSize: 13, fontWeight: '700', letterSpacing: 0.8,
    textTransform: 'uppercase', paddingHorizontal: 20,
    paddingTop: 18, paddingBottom: 8,
  },
  item: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  itemText: { fontSize: 17, flex: 1 },

  empty: { padding: 28, alignItems: 'center', gap: 14 },
  emptyText: { fontSize: 16, textAlign: 'center', lineHeight: 22 },
  useAnywayBtn: { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 },
  useAnywayText: { fontSize: 16, fontWeight: '600' },
})
