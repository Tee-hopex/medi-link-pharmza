export interface Channel {
  id: string
  name: string
  description: string
  type: 'general' | 'pharma' | 'clinical' | 'emergency' | 'career'
  memberCount: number
  lastMessage: string
  lastMessageTime: string
  lastSenderName: string
  unreadCount: number
  verified: boolean
  pinned?: boolean
}

export interface ChatMessage {
  id: string
  channelId: string
  senderId: string
  senderName: string
  senderProfession: string
  senderVerified: boolean
  text: string
  timestamp: string
  isOwn: boolean
}

export interface Patient {
  id: string
  name: string
  age: number
  condition: string
  medications: PatientMed[]
  adherenceStatus: 'on-track' | 'missed' | 'critical'
  adherencePercent: number
  lastSeen: string
  phone: string
  nextRefillDays: number
}

export interface PatientMed {
  name: string
  dosage: string
  frequency: string
  nextDoseIn: string
}

export interface JobListing {
  id: string
  title: string
  company: string
  location: string
  type: 'Full-time' | 'Part-time' | 'Contract' | 'Locum'
  salaryRange: string
  postedDaysAgo: number
  description: string
  requirements: string[]
  verified: boolean
  bookmarked: boolean
  urgent: boolean
}

export const MOCK_CHANNELS: Channel[] = [
  {
    id: 'C1', name: 'Lagos Pharmacists',
    description: 'Verified pharmacists in the Lagos network',
    type: 'pharma', memberCount: 248, unreadCount: 7,
    lastMessage: 'Anyone have Ozempic 1mg in stock? Urgent patient need.',
    lastMessageTime: '2 min ago', lastSenderName: 'Dr. Amaka O.',
    verified: true, pinned: true,
  },
  {
    id: 'C2', name: 'Drug Shortage Alerts',
    description: 'Real-time shortage intelligence across the network',
    type: 'emergency', memberCount: 1042, unreadCount: 3,
    lastMessage: 'Insulin glargine short supply reported in VI, Lekki, Ajah.',
    lastMessageTime: '14 min ago', lastSenderName: 'Medi_LinK Intel',
    verified: true, pinned: true,
  },
  {
    id: 'C3', name: 'Pharmacy Owners Hub',
    description: 'Business, compliance, and operations discussions',
    type: 'general', memberCount: 185, unreadCount: 0,
    lastMessage: 'NAFDAC inspection season is here. Share your checklist.',
    lastMessageTime: '1 h ago', lastSenderName: 'Bello K.',
    verified: false,
  },
  {
    id: 'C4', name: 'Clinical Updates',
    description: 'Latest treatment guidelines and drug interactions',
    type: 'clinical', memberCount: 390, unreadCount: 12,
    lastMessage: 'New WHO malaria treatment protocol — important read for all.',
    lastMessageTime: '3 h ago', lastSenderName: 'Dr. Chidi N.',
    verified: true,
  },
  {
    id: 'C5', name: 'Wholesalers Connect',
    description: 'Bulk pricing, supply chain, distributor network',
    type: 'pharma', memberCount: 97, unreadCount: 0,
    lastMessage: 'Paracetamol 500mg bulk — ₦8,500/box of 1000. DM.',
    lastMessageTime: '5 h ago', lastSenderName: 'Tunde Dist.',
    verified: false,
  },
  {
    id: 'C6', name: 'MediCareer Board',
    description: 'Job postings and career opportunities',
    type: 'career', memberCount: 520, unreadCount: 1,
    lastMessage: 'Locum pharmacist needed this weekend in Ikeja. Apply now.',
    lastMessageTime: '8 h ago', lastSenderName: 'HR Gateway',
    verified: true,
  },
]

export const MOCK_MESSAGES: Record<string, ChatMessage[]> = {
  C1: [
    { id: 'm1', channelId: 'C1', senderId: 'u2', senderName: 'Dr. Amaka O.', senderProfession: 'Pharmacist', senderVerified: true,  text: 'Anyone have Ozempic 1mg in stock? Urgent patient need.', timestamp: '2:03 PM', isOwn: false },
    { id: 'm2', channelId: 'C1', senderId: 'u3', senderName: 'Bello K.',      senderProfession: 'Pharmacist', senderVerified: false, text: 'We have 4 pens left. Come before 5pm.', timestamp: '2:05 PM', isOwn: false },
    { id: 'm3', channelId: 'C1', senderId: 'u1', senderName: 'You',           senderProfession: 'Pharmacist', senderVerified: true,  text: 'I have 2 pens — can hold till tomorrow morning if needed.', timestamp: '2:08 PM', isOwn: true },
    { id: 'm4', channelId: 'C1', senderId: 'u2', senderName: 'Dr. Amaka O.', senderProfession: 'Pharmacist', senderVerified: true,  text: 'Thank you! Coming to your location.', timestamp: '2:09 PM', isOwn: false },
    { id: 'm5', channelId: 'C1', senderId: 'u4', senderName: 'Chidi N.',      senderProfession: 'Doctor',     senderVerified: true,  text: 'FYI — shortage expected for another 2 weeks. Stock up now.', timestamp: '2:14 PM', isOwn: false },
  ],
  C2: [
    { id: 'm1', channelId: 'C2', senderId: 'sys', senderName: 'Medi_LinK Intel', senderProfession: 'System', senderVerified: true, text: 'SHORTAGE ALERT: Insulin glargine (Lantus) supply disruption reported by 12 pharmacies in Lagos Island, Lekki, and Ajah zones.', timestamp: '1:49 PM', isOwn: false },
    { id: 'm2', channelId: 'C2', senderId: 'u5',  senderName: 'Funmi A.',     senderProfession: 'Pharmacist', senderVerified: true, text: 'Confirmed — our last 3 units sold out this morning. Cannot restock until next week.', timestamp: '1:52 PM', isOwn: false },
    { id: 'm3', channelId: 'C2', senderId: 'u1',  senderName: 'You',           senderProfession: 'Pharmacist', senderVerified: true, text: 'We still have 8 vials. Can supply at cost to anyone with urgent patients.', timestamp: '1:55 PM', isOwn: true },
  ],
}

export const MOCK_PATIENTS: Patient[] = [
  {
    id: 'PT1', name: 'Mrs. Ngozi Adeyemi', age: 58, condition: 'Type 2 Diabetes',
    adherenceStatus: 'on-track', adherencePercent: 92, lastSeen: '2 days ago',
    phone: '08023456789', nextRefillDays: 4,
    medications: [
      { name: 'Metformin 850mg', dosage: '1 tab', frequency: 'Twice daily', nextDoseIn: '3 h' },
      { name: 'Amlodipine 5mg',  dosage: '1 tab', frequency: 'Once daily',  nextDoseIn: '6 h' },
    ],
  },
  {
    id: 'PT2', name: 'Mr. Emeka Okafor', age: 45, condition: 'Hypertension',
    adherenceStatus: 'missed', adherencePercent: 68, lastSeen: '5 days ago',
    phone: '08034567890', nextRefillDays: 2,
    medications: [
      { name: 'Lisinopril 10mg',  dosage: '1 tab', frequency: 'Once daily',   nextDoseIn: 'Missed' },
      { name: 'Aspirin 75mg',     dosage: '1 tab', frequency: 'Once daily',   nextDoseIn: 'Missed' },
    ],
  },
  {
    id: 'PT3', name: 'Baby Zainab Musa', age: 3, condition: 'Recurrent Malaria',
    adherenceStatus: 'on-track', adherencePercent: 100, lastSeen: 'Today',
    phone: '08045678901', nextRefillDays: 11,
    medications: [
      { name: 'Artemether 20mg', dosage: '1 tab', frequency: 'Per protocol', nextDoseIn: 'Day 4' },
    ],
  },
  {
    id: 'PT4', name: 'Mr. Sunday Bassey', age: 67, condition: 'Hypertension + Diabetes',
    adherenceStatus: 'critical', adherencePercent: 41, lastSeen: '12 days ago',
    phone: '08056789012', nextRefillDays: 0,
    medications: [
      { name: 'Metformin 1g',     dosage: '1 tab', frequency: 'Three daily',  nextDoseIn: 'Overdue' },
      { name: 'Amlodipine 10mg',  dosage: '1 tab', frequency: 'Once daily',   nextDoseIn: 'Overdue' },
      { name: 'Lisinopril 20mg',  dosage: '1 tab', frequency: 'Once daily',   nextDoseIn: 'Overdue' },
    ],
  },
]

export const MOCK_JOBS: JobListing[] = [
  {
    id: 'J1', title: 'Locum Pharmacist', company: 'HealthPlus Pharmacy',
    location: 'Ikeja, Lagos', type: 'Locum', salaryRange: '₦25,000/day',
    postedDaysAgo: 0, urgent: true, verified: true, bookmarked: false,
    description: 'Urgent coverage needed this weekend (Sat–Sun). Busy community pharmacy with high footfall.',
    requirements: ['PCN licensed', 'Minimum 2 years experience', 'Available Sat–Sun'],
  },
  {
    id: 'J2', title: 'Senior Pharmacist', company: 'Reddington Hospital',
    location: 'Victoria Island, Lagos', type: 'Full-time', salaryRange: '₦350,000–₦450,000/mo',
    postedDaysAgo: 2, urgent: false, verified: true, bookmarked: true,
    description: 'Join our hospital pharmacy team. Manage drug dispensing, clinical reviews, and patient counselling.',
    requirements: ['PCN licensed', '5+ years hospital experience', 'B.Pharm or Pharm.D'],
  },
  {
    id: 'J3', title: 'Pharmacy Manager', company: 'MedCity Pharmacy Chain',
    location: 'Lekki, Lagos', type: 'Full-time', salaryRange: '₦280,000–₦350,000/mo',
    postedDaysAgo: 4, urgent: false, verified: true, bookmarked: false,
    description: 'Manage daily operations of a high-volume pharmacy. Supervise staff and ensure compliance.',
    requirements: ['PCN licensed', '3+ years management experience', 'Stock management skills'],
  },
  {
    id: 'J4', title: 'Pharmaceutical Sales Rep', company: 'Emzor Pharma',
    location: 'Lagos (Field Role)', type: 'Full-time', salaryRange: '₦180,000 + Commission',
    postedDaysAgo: 6, urgent: false, verified: true, bookmarked: false,
    description: 'Promote Emzor products to pharmacies, hospitals, and clinics across Lagos South.',
    requirements: ['Pharmacy or Science degree', 'Own vehicle preferred', 'Good communication skills'],
  },
  {
    id: 'J5', title: 'Clinical Pharmacist', company: 'Lagos University Teaching Hospital',
    location: 'Idi-Araba, Lagos', type: 'Contract', salaryRange: '₦300,000–₦380,000/mo',
    postedDaysAgo: 9, urgent: false, verified: true, bookmarked: false,
    description: '12-month contract covering clinical pharmacy services across medical wards.',
    requirements: ['Pharm.D or equivalent', 'Hospital experience required', 'Knowledge of therapeutic drug monitoring'],
  },
]
