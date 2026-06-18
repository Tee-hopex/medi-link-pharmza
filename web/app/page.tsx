import Link from 'next/link'
import { ArrowRight, BarChart3, RefreshCcw, Bell, Shield, Package, Zap } from 'lucide-react'

const STATS = [
  { value: '2,400+', label: 'Pharmacies connected' },
  { value: '₦840M', label: 'Waste prevented' },
  { value: '18 states', label: 'Across Nigeria' },
  { value: '99.9%', label: 'Uptime SLA' },
]

const FEATURES = [
  {
    icon: RefreshCcw,
    title: 'Pharmacy-to-Pharmacy Redistribution',
    desc: 'List near-expiry medications and match with qualified buyers before losses crystallize.',
    iconBg: 'bg-primary-50',
    iconColor: 'text-primary-600',
  },
  {
    icon: Bell,
    title: 'Intelligent Expiry Alerts',
    desc: 'Automated alerts at 90, 60, and 30 days with direct redistribution suggestions.',
    iconBg: 'bg-accent-light',
    iconColor: 'text-accent',
  },
  {
    icon: BarChart3,
    title: 'Inventory Intelligence',
    desc: 'Dead stock detection, profit analysis, and demand forecasting — all in one view.',
    iconBg: 'bg-primary-50',
    iconColor: 'text-primary-600',
  },
  {
    icon: Shield,
    title: 'Verified Ecosystem',
    desc: 'Every facility is PCN-verified. Transact with confidence across a trusted network.',
    iconBg: 'bg-accent-light',
    iconColor: 'text-accent',
  },
  {
    icon: Zap,
    title: 'Emergency Rx Network',
    desc: 'Broadcast critical medication requests to nearby verified pharmacies in seconds.',
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
  },
  {
    icon: Package,
    title: 'Marketplace',
    desc: 'Buy and sell pharmaceutical inventory with escrow-protected transactions.',
    iconBg: 'bg-primary-50',
    iconColor: 'text-primary-600',
  },
]

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'List near-expiry stock',
    desc: 'Add items within 90 days of expiry. PHARVA surfaces them to verified buyers automatically.',
  },
  {
    step: '02',
    title: 'Match with verified buyers',
    desc: 'Nearby facilities see your listings first. Transactions are escrow-protected until delivery.',
  },
  {
    step: '03',
    title: 'Recover margin, not waste',
    desc: 'Turn imminent losses into revenue. Track everything in your analytics dashboard.',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-[#E3E6E1] px-6 lg:px-10 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="PHARVA" width={36} height={36} className="object-contain mix-blend-multiply" />
            <span className="font-display font-bold text-gray-900 text-xl tracking-tight">PHARVA</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-500 font-medium">
            <a href="#features" className="hover:text-gray-900 transition-colors">Features</a>
            <a href="#how" className="hover:text-gray-900 transition-colors">How it works</a>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="text-sm text-gray-600 hover:text-gray-900 font-medium px-4 py-2 transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="text-sm bg-primary-600 text-white font-semibold px-5 py-2.5 rounded-lg hover:bg-primary-700 transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 border border-primary-200 bg-primary-50 text-primary-700 text-xs font-semibold px-4 py-2 rounded-full mb-10 tracking-wide uppercase">
          <span className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-pulse" />
          Now live for Nigerian pharmacies
        </div>

        <h1 className="text-5xl md:text-7xl font-bold text-gray-950 leading-[1.06] tracking-tight mb-7 max-w-4xl mx-auto">
          Stop losing money to<br />
          <span className="text-primary-600">expired stock.</span>
        </h1>

        <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto mb-12 leading-relaxed">
          PHARVA connects community pharmacies, hospital pharmacies, and healthcare
          facilities to redistribute near-expiry medications, reduce waste, and protect margins.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-20">
          <Link
            href="/register"
            className="flex items-center gap-2.5 bg-primary-600 text-white font-semibold px-7 py-3.5 rounded-xl hover:bg-primary-700 transition-all text-base shadow-lg shadow-primary-600/20"
          >
            Create free account <ArrowRight size={18} />
          </Link>
          <Link
            href="/login"
            className="text-gray-700 font-semibold px-7 py-3.5 border border-[#E3E6E1] rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all text-base"
          >
            Sign in
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-[#E3E6E1] pt-12">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <div className="font-display text-3xl font-bold text-gray-900 mb-1">{s.value}</div>
              <div className="text-sm text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-[#F7F8F5] py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-primary-600 uppercase tracking-widest mb-3">
              Platform capabilities
            </p>
            <h2 className="text-4xl font-bold text-gray-900 tracking-tight">
              A complete operating system<br />for modern pharmacies
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="bg-white rounded-2xl p-7 border border-[#E3E6E1] hover:border-gray-300 hover:shadow-sm transition-all"
              >
                <div className={`w-10 h-10 rounded-xl ${f.iconBg} flex items-center justify-center mb-5`}>
                  <f.icon size={20} className={f.iconColor} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2.5">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-24">
        <div className="max-w-5xl mx-auto px-6 lg:px-10">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-primary-600 uppercase tracking-widest mb-3">
              How it works
            </p>
            <h2 className="text-4xl font-bold text-gray-900 tracking-tight">
              From expiry risk to recovered value
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {HOW_IT_WORKS.map((item) => (
              <div key={item.step}>
                <div className="font-display text-5xl font-bold text-gray-100 mb-3 select-none">
                  {item.step}
                </div>
                <div className="pharva-accent-line w-10 mb-5" />
                <h3 className="font-semibold text-gray-900 text-lg mb-3">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-4 md:mx-10 mb-20 rounded-3xl overflow-hidden bg-[linear-gradient(135deg,#0F1A13_0%,#1E3A2E_60%,#0F2535_100%)]">
        <div className="px-8 md:px-16 py-16 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-dark.png" alt="PHARVA" width={52} height={52} className="mx-auto mb-6 object-contain mix-blend-screen" />
          <h2 className="text-4xl font-bold text-white mb-4 tracking-tight">
            Ready to stop the bleeding?
          </h2>
          <p className="text-gray-400 mb-10 text-lg max-w-xl mx-auto">
            Join hundreds of pharmacies already using PHARVA to recapture margin from
            near-expiry inventory.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2.5 bg-white text-gray-900 font-semibold px-8 py-4 rounded-xl hover:bg-gray-100 transition-all text-base"
          >
            Create your account <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <footer className="border-t border-[#E3E6E1] py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="PHARVA" width={28} height={28} className="object-contain mix-blend-multiply" />
            <span className="font-display font-bold text-gray-900">PHARVA</span>
          </div>
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} PHARVA. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-gray-400">
            <a href="#" className="hover:text-gray-600 transition-colors">Privacy</a>
            <a href="#" className="hover:text-gray-600 transition-colors">Terms</a>
            <a href="#" className="hover:text-gray-600 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
