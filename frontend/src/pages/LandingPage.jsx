import { useState } from 'react'
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import {
  FaArrowRight,
  FaCheckCircle,
  FaChartLine,
  FaFingerprint,
  FaHistory,
  FaLock,
  FaQrcode,
  FaSearch,
  FaShieldAlt,
} from 'react-icons/fa'
import { useAuth } from '../context/AuthContext'
import ThemeToggle from '../components/ThemeToggle'

const systemCapabilities = [
  {
    index: '01',
    icon: FaFingerprint,
    title: 'SHA-256 Cryptography',
    description:
      'Every credential generates an immutable SHA-256 digital signature, ensuring mathematically verifiable tamper detection.',
  },
  {
    index: '02',
    icon: FaQrcode,
    title: 'Instant QR Validation',
    description:
      'Direct-to-vault QR routing allows any smartphone or scanner to verify credential status, issuer, and date in milliseconds.',
  },
  {
    index: '03',
    icon: FaHistory,
    title: 'Status & Revocation Logs',
    description:
      'Instantaneous active, expired, and revoked state tracking with transparent authoritative audit reasons.',
  },
  {
    index: '04',
    icon: FaChartLine,
    title: 'Verification Telemetry',
    description:
      'Audited scan analytics capturing client platform, geographic origin, and timestamp access logs.',
  },
]

const staggerParent = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
}

const staggerChild = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

const LandingPage = () => {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [lookupId, setLookupId] = useState('')
  const [activeTab, setActiveTab] = useState('crypto')
  const [isSimulating, setIsSimulating] = useState(false)
  const [simulatedResult, setSimulatedResult] = useState(null)

  const handleLookup = (e) => {
    e.preventDefault()
    const trimmed = lookupId.trim()
    if (trimmed) {
      navigate(`/verify/${encodeURIComponent(trimmed)}`)
    } else {
      navigate('/verify')
    }
  }

  const runSimulation = () => {
    setIsSimulating(true)
    setSimulatedResult(null)
    setTimeout(() => {
      setIsSimulating(false)
      setSimulatedResult({
        status: 'valid',
        timestamp: new Date().toISOString(),
        blockHash: '7c8d9e2f...1a4b',
      })
    }, 600)
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#f8f9fc] text-[#1d1d1f] dark:bg-[#07070a] dark:text-[#f5f5f7] transition-colors duration-300">
      {/* Liquid Glass Ambient Refraction Shafts (Provides lighting for glass refraction) */}
      <div className="liquid-ambient-shaft -top-36 -left-36 h-[500px] w-[500px] bg-blue-600/25 dark:bg-blue-600/20 animate-liquid-float" />
      <div className="liquid-ambient-shaft top-16 -right-36 h-[600px] w-[600px] bg-indigo-600/25 dark:bg-indigo-600/20 animate-liquid-float-rev" />
      <div className="liquid-ambient-shaft top-[55%] left-1/4 h-[480px] w-[480px] bg-cyan-500/20 dark:bg-cyan-500/15 animate-liquid-float" />

      {/* Apple Dynamic Island Floating Liquid Header */}
      <header className="sticky top-4 z-40 mx-auto max-w-4xl px-4 pt-2">
        <div className="apple-island-dock rounded-full px-5 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-mono text-xs font-bold tracking-tighter shadow-xs">
              C
            </div>
            <span className="font-mono text-xs font-bold tracking-[0.2em] uppercase text-neutral-900 dark:text-white">
              Certified
            </span>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              to="/verify/TCRHAMY558G4C"
              className="hidden rounded-full border border-neutral-300/80 dark:border-neutral-700/80 bg-white/40 dark:bg-white/5 px-3.5 py-1 text-xs font-medium text-neutral-700 dark:text-neutral-300 transition hover:bg-white/80 dark:hover:bg-white/10 md:inline-flex"
            >
              Sample Specimen
            </Link>
            <Link
              to={isAuthenticated ? '/dashboard' : '/login'}
              className="liquid-btn-primary rounded-full px-4 py-1.5 text-xs font-semibold"
            >
              {isAuthenticated ? 'Console' : 'Sign In'}
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-5xl px-6 pt-12 pb-24 md:pt-20">
        {/* Editorial Hero Section */}
        <section className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200/90 dark:border-white/10 bg-white/60 dark:bg-white/5 px-3.5 py-1 text-[11px] font-mono font-medium text-neutral-600 dark:text-neutral-400 backdrop-blur-md shadow-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>ACADEMIC CREDENTIAL PROTOCOL</span>
          </div>

          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-neutral-950 dark:text-white sm:text-6xl md:text-7xl md:leading-[1.08]">
            Authentic by design.
            <br />
            <span className="text-neutral-400 dark:text-neutral-500">Verified everywhere.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-neutral-600 dark:text-neutral-400 md:text-lg font-normal">
            An immutable cryptographic registry for academic degrees, professional credentials, and institutional records.
          </p>

          {/* Apple Spotlight Style Liquid Glass Search */}
          <div className="mx-auto mt-10 max-w-xl">
            <form
              onSubmit={handleLookup}
              className="group relative flex items-center rounded-2xl apple-liquid-glass p-2 transition-all focus-within:border-blue-500 dark:focus-within:border-white focus-within:ring-4 focus-within:ring-blue-500/15"
            >
              <FaSearch className="ml-3.5 text-neutral-400 dark:text-neutral-500 text-sm" />
              <input
                type="text"
                value={lookupId}
                onChange={(e) => setLookupId(e.target.value)}
                placeholder="Enter Certificate ID, e.g. TCRHAMY558G4C"
                className="w-full bg-transparent px-3.5 py-2.5 text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 outline-none"
              />
              <button
                type="submit"
                className="liquid-btn-primary inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold shrink-0"
              >
                <span>Verify</span>
                <FaArrowRight className="text-[10px]" />
              </button>
            </form>

            <div className="mt-3.5 flex items-center justify-center gap-2 text-xs text-neutral-500">
              <span className="font-mono text-[11px]">SPECIMENS:</span>
              <button
                type="button"
                onClick={() => navigate('/verify/TCRHAMY558G4C')}
                className="font-mono text-neutral-900 dark:text-neutral-300 underline decoration-neutral-300 dark:decoration-neutral-700 underline-offset-4 hover:text-black dark:hover:text-white"
              >
                TCRHAMY558G4C
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => navigate('/verify/TC5X5G3UZHCEB')}
                className="font-mono text-neutral-900 dark:text-neutral-300 underline decoration-neutral-300 dark:decoration-neutral-700 underline-offset-4 hover:text-black dark:hover:text-white"
              >
                TC5X5G3UZHCEB
              </button>
            </div>
          </div>
        </section>

        {/* Apple Hardware-Style Liquid Glass Interactive Specimen */}
        <section className="mt-16">
          <div className="apple-liquid-card overflow-hidden rounded-3xl p-6 md:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-black/[0.06] dark:border-white/[0.08]">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-mono text-xs font-bold shadow-xs">
                  <FaShieldAlt className="text-sm" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                      LIVE SPECIMEN
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 font-mono text-[9px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      ACTIVE VAULT
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mt-0.5">
                    Master of Science in Distributed Systems
                  </h3>
                </div>
              </div>

              {/* Specimen Interactive Switcher */}
              <div className="flex rounded-xl bg-black/[0.04] dark:bg-white/[0.06] p-1 border border-black/[0.04] dark:border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setActiveTab('crypto')}
                  className={`rounded-lg px-3 py-1 font-mono text-[11px] font-medium transition ${
                    activeTab === 'crypto'
                      ? 'bg-white dark:bg-neutral-850 text-neutral-900 dark:text-white shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  Cryptography
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('metadata')}
                  className={`rounded-lg px-3 py-1 font-mono text-[11px] font-medium transition ${
                    activeTab === 'metadata'
                      ? 'bg-white dark:bg-neutral-850 text-neutral-900 dark:text-white shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  Metadata
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('qr')}
                  className={`rounded-lg px-3 py-1 font-mono text-[11px] font-medium transition ${
                    activeTab === 'qr'
                      ? 'bg-white dark:bg-neutral-850 text-neutral-900 dark:text-white shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  QR Routing
                </button>
              </div>
            </div>

            {/* Specimen Body */}
            <div className="pt-6">
              {activeTab === 'crypto' && (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.02] p-4">
                    <p className="font-mono text-[10px] uppercase tracking-wider text-neutral-400">
                      SHA-256 Digest Signature
                    </p>
                    <p className="mt-1 font-mono text-xs text-neutral-800 dark:text-neutral-200 break-all select-all">
                      e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={runSimulation}
                        disabled={isSimulating}
                        className="liquid-btn-primary inline-flex items-center gap-2 rounded-xl px-4 py-2 font-mono text-xs font-semibold disabled:opacity-50"
                      >
                        <FaLock className="text-[10px]" />
                        <span>{isSimulating ? 'Validating Hash...' : 'Test Hash Verification'}</span>
                      </button>

                      {simulatedResult && (
                        <span className="inline-flex items-center gap-1.5 font-mono text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                          <FaCheckCircle className="text-xs" />
                          <span>Tamper Check Passed</span>
                        </span>
                      )}
                    </div>

                    <Link
                      to="/verify/TCRHAMY558G4C"
                      className="font-mono text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white underline underline-offset-4"
                    >
                      Open Full Verification Certificate →
                    </Link>
                  </div>
                </div>
              )}

              {activeTab === 'metadata' && (
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 font-mono text-xs">
                  <div className="rounded-xl border border-black/[0.06] dark:border-white/[0.08] p-3.5 bg-black/[0.02] dark:bg-white/[0.02]">
                    <span className="text-[10px] text-neutral-400 uppercase">Candidate</span>
                    <p className="mt-1 font-semibold text-neutral-900 dark:text-white">Alex Morgan</p>
                  </div>
                  <div className="rounded-xl border border-black/[0.06] dark:border-white/[0.08] p-3.5 bg-black/[0.02] dark:bg-white/[0.02]">
                    <span className="text-[10px] text-neutral-400 uppercase">Issuing Institute</span>
                    <p className="mt-1 font-semibold text-neutral-900 dark:text-white">Global University</p>
                  </div>
                  <div className="rounded-xl border border-black/[0.06] dark:border-white/[0.08] p-3.5 bg-black/[0.02] dark:bg-white/[0.02]">
                    <span className="text-[10px] text-neutral-400 uppercase">Date of Registry</span>
                    <p className="mt-1 font-semibold text-neutral-900 dark:text-white">October 24, 2026</p>
                  </div>
                  <div className="rounded-xl border border-black/[0.06] dark:border-white/[0.08] p-3.5 bg-black/[0.02] dark:bg-white/[0.02]">
                    <span className="text-[10px] text-neutral-400 uppercase">Status</span>
                    <p className="mt-1 font-semibold text-emerald-600 dark:text-emerald-400">Authentic</p>
                  </div>
                </div>
              )}

              {activeTab === 'qr' && (
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="rounded-2xl border border-black/[0.08] dark:border-white/[0.12] bg-white p-3 shadow-md max-w-[120px]">
                    <img
                      src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=http://localhost:5173/verify/TCRHAMY558G4C"
                      alt="Sample QR"
                      className="h-24 w-24 object-contain"
                    />
                  </div>
                  <div className="space-y-1.5 text-center sm:text-left">
                    <p className="font-mono text-xs font-semibold text-neutral-900 dark:text-white">
                      Instant Smartphone Optical Routing
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-md leading-relaxed">
                      Every physical diploma and PDF artifact encodes an unalterable direct-to-vault URL for instant third-party validation.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Minimal Monolithic Capabilities Grid (Nothing / Sony Style in Liquid Glass) */}
        <section className="mt-20 border-t border-neutral-200/80 dark:border-neutral-850 pt-16">
          <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-2">
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 dark:text-neutral-500">
                ARCHITECTURE SPECIFICATION
              </p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white">
                Core System Standards
              </h2>
            </div>
            <p className="font-mono text-xs text-neutral-400 dark:text-neutral-500">
              V2.4 • SHA-256 HASH VERIFICATION
            </p>
          </div>

          <motion.div
            variants={staggerParent}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            {systemCapabilities.map((cap) => {
              const Icon = cap.icon
              return (
                <motion.article
                  key={cap.title}
                  variants={staggerChild}
                  className="apple-liquid-card flex flex-col justify-between rounded-2xl p-6"
                >
                  <div>
                    <div className="flex items-center justify-between pb-6">
                      <span className="font-mono text-xs font-bold text-neutral-400 dark:text-neutral-600">
                        {cap.index}
                      </span>
                      <Icon className="text-neutral-600 dark:text-neutral-400 text-sm" />
                    </div>
                    <h3 className="text-base font-semibold text-neutral-900 dark:text-white tracking-tight">
                      {cap.title}
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                      {cap.description}
                    </p>
                  </div>
                </motion.article>
              )
            })}
          </motion.div>
        </section>
      </main>

      {/* Sony / Apple Minimalist Clean Footer */}
      <footer className="border-t border-neutral-200/80 dark:border-neutral-850 py-10">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-6 md:flex-row text-xs text-neutral-500">
          <div className="flex items-center gap-2">
            <span className="font-mono font-semibold text-neutral-900 dark:text-neutral-300">CERTIFIED</span>
            <span>•</span>
            <span>Cryptographic Academic Credential Architecture</span>
          </div>
          <div className="flex items-center gap-4 font-mono text-[11px]">
            <Link to="/verify" className="hover:text-neutral-900 dark:hover:text-white">
              Public Lookup
            </Link>
            <span>•</span>
            <Link to="/login" className="hover:text-neutral-900 dark:hover:text-white">
              Sign In
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
