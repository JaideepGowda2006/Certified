import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { FaCheckCircle, FaGlobe, FaQrcode, FaShieldAlt } from 'react-icons/fa'
import { useAuth } from '../context/AuthContext'

const featureCards = [
  {
    icon: FaShieldAlt,
    title: 'Tamper-Resistant Credentials',
    description:
      'Each certificate stores a SHA-256 signature, secure PDF artifact, and immutable verification history.',
  },
  {
    icon: FaQrcode,
    title: 'Instant QR Verification',
    description:
      'Every issued credential generates a unique QR destination for one-click public authenticity checks.',
  },
  {
    icon: FaGlobe,
    title: 'Public Trust Portal',
    description:
      'Employers and institutions can verify certificate status, expiry, and revocation in seconds.',
  },
  {
    icon: FaCheckCircle,
    title: 'Issuer Analytics',
    description:
      'Monitor scan activity, top-performing certificates, and verification traffic from one dashboard.',
  },
]

const trustedLogos = [
  'Arbor University',
  'Northbridge Institute',
  'Acumen Labs',
  'BluePeak Systems',
  'Atlas Bootcamp',
]

const plans = [
  {
    name: 'Starter',
    price: '$29',
    subtitle: 'For training centers',
    bullets: ['Up to 500 certificates/month', 'QR verification', 'PDF generation'],
  },
  {
    name: 'Growth',
    price: '$99',
    subtitle: 'For universities and teams',
    bullets: ['Unlimited certificates', 'Custom branding', 'Scan analytics + revocation'],
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    subtitle: 'For large organizations',
    bullets: ['SSO and role controls', 'Audit export APIs', 'Dedicated onboarding'],
  },
]

const staggerParent = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const staggerChild = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0 },
}

const LandingPage = () => {
  const { isAuthenticated } = useAuth()

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-6 md:px-6">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-brand-700">TrueCert</p>
          <h1 className="text-2xl font-bold text-slate-900">Trust Every Credential</h1>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/verify/TCX82LM92PQ"
            className="hidden rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 md:inline-flex"
          >
            View Demo Verify
          </Link>
          <Link
            to={isAuthenticated ? '/dashboard' : '/login'}
            className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            {isAuthenticated ? 'Open Dashboard' : 'Admin Login'}
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 pb-12 md:px-6">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="glass-panel relative overflow-hidden rounded-3xl p-7 md:p-12"
        >
          <div className="absolute -right-16 -top-20 h-52 w-52 rounded-full bg-orange-300/30 blur-2xl" />
          <div className="absolute -bottom-20 left-1/3 h-56 w-56 rounded-full bg-teal-300/30 blur-2xl" />

          <div className="relative grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <p className="mb-4 inline-flex rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-brand-700">
                Secure Certificate Verification Platform
              </p>
              <h2 className="text-4xl font-bold leading-tight text-slate-900 md:text-5xl">
                Issue, secure, and verify certificates with confidence.
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-600 md:text-lg">
                TrueCert helps colleges, companies, and institutes issue QR-based digital credentials with
                tamper detection, revocation controls, and public verification workflows.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  to={isAuthenticated ? '/create-certificate' : '/login'}
                  className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Start Issuing Certificates
                </Link>
                <Link
                  to="/verify/TCX82LM92PQ"
                  className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Verify Public Certificate
                </Link>
              </div>
            </div>

            <div className="glass-panel rounded-2xl border border-slate-200/70 bg-white/90 p-5">
              <p className="text-sm font-semibold text-brand-700">Live Product Snapshot</p>
              <div className="mt-4 space-y-3">
                {[
                  'Certificate ID generated automatically',
                  'Secure QR URL mapped to verification route',
                  'Professional PDF generated and uploaded',
                  'Public scan analytics tracked in real time',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                    <FaCheckCircle className="mt-0.5 text-brand-600" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section
          variants={staggerParent}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="mt-10"
        >
          <h3 className="mb-5 text-2xl font-bold text-slate-900 md:text-3xl">Platform Features</h3>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {featureCards.map((card) => {
              const Icon = card.icon
              return (
                <motion.article
                  key={card.title}
                  variants={staggerChild}
                  className="glass-panel rounded-2xl p-5 transition hover:-translate-y-1"
                >
                  <div className="mb-3 inline-flex rounded-lg bg-brand-50 p-3 text-brand-700">
                    <Icon className="text-lg" />
                  </div>
                  <h4 className="text-lg font-semibold text-slate-900">{card.title}</h4>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{card.description}</p>
                </motion.article>
              )
            })}
          </div>
        </motion.section>

        <section className="mt-12 rounded-3xl border border-slate-200/70 bg-white/80 p-6 md:p-8">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.26em] text-slate-500">Trusted by</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {trustedLogos.map((brand) => (
              <div
                key={brand}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700"
              >
                {brand}
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <h3 className="mb-5 text-2xl font-bold text-slate-900 md:text-3xl">Simple Pricing Preview</h3>
          <div className="grid gap-4 md:grid-cols-3">
            {plans.map((plan) => (
              <article
                key={plan.name}
                className={`rounded-2xl border p-5 ${
                  plan.highlighted
                    ? 'border-brand-600 bg-brand-600 text-white shadow-soft'
                    : 'border-slate-200 bg-white/90 text-slate-900'
                }`}
              >
                <p className="text-sm font-semibold uppercase tracking-wider opacity-85">{plan.name}</p>
                <p className="mt-2 text-3xl font-bold">{plan.price}</p>
                <p className={`mt-1 text-sm ${plan.highlighted ? 'text-teal-100' : 'text-slate-600'}`}>{plan.subtitle}</p>
                <ul className="mt-4 space-y-2 text-sm">
                  {plan.bullets.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <FaCheckCircle className="mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-12 rounded-3xl bg-slate-900 p-8 text-center text-white md:p-12">
          <h3 className="text-3xl font-bold">Ready to launch trusted credentials?</h3>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-200 md:text-base">
            Start issuing branded certificates with secure verification, revocation, and analytics across your organization.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              to={isAuthenticated ? '/dashboard' : '/login'}
              className="rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-600"
            >
              {isAuthenticated ? 'Open Issuer Dashboard' : 'Get Started'}
            </Link>
            <Link
              to="/verify/TCX82LM92PQ"
              className="rounded-xl border border-slate-600 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:bg-slate-800"
            >
              View Verification Demo
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200/70 px-4 py-6 text-center text-sm text-slate-500">
        <p>TrueCert. Secure credential management and public verification for modern institutions.</p>
      </footer>
    </div>
  )
}

export default LandingPage
