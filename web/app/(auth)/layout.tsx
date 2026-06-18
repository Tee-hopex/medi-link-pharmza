const BRAND_POINTS = [
  'Expiry alert automation',
  'Escrow-protected trading',
  'Verified pharmacy network',
  'Emergency Rx broadcast',
]

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left panel — brand */}
      <div className="hidden lg:flex lg:w-[420px] xl:w-[480px] flex-col justify-between p-10 flex-shrink-0 bg-[linear-gradient(160deg,#0F1A13_0%,#0D2028_100%)]">
        <div>
          <div className="flex items-center gap-3 mb-16">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-dark.png" alt="PHARVA" width={40} height={40} className="object-contain mix-blend-screen" />
            <span className="font-display font-bold text-white text-xl tracking-tight">PHARVA</span>
          </div>

          <div>
            <div className="pharva-accent-line w-12 mb-6" />
            <h2 className="text-3xl font-bold text-white leading-tight mb-4">
              The pharmacy<br />intelligence platform.
            </h2>
            <p className="text-sm leading-relaxed text-[#8AADA0]">
              Redistribute near-expiry medications, manage inventory, and connect with
              verified pharmacies across Nigeria.
            </p>
          </div>

          <div className="mt-12 space-y-4">
            {BRAND_POINTS.map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                  <div className="w-2 h-2 rounded-full bg-primary-500" />
                </div>
                <span className="text-sm text-[#8AADA0]">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-[#3A5A48]">
          © {new Date().getFullYear()} PHARVA. All rights reserved.
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-[#F7F8F5]">
        <div className="w-full max-w-md">
          {/* Mobile-only logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="PHARVA" width={36} height={36} className="object-contain mix-blend-multiply" />
            <span className="font-display font-bold text-gray-900 text-xl tracking-tight">PHARVA</span>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-[#E3E6E1] p-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
