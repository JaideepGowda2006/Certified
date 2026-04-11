import { Link } from 'react-router-dom'
import { FaArrowLeft, FaListUl } from 'react-icons/fa'
import CreateCertificatePage from './CreateCertificatePage'

const CreateCertificateStudioPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-brand-50/50">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1850px] flex-wrap items-center justify-between gap-3 px-3 py-3 md:px-6">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-brand-700">TrueCert</p>
            <h1 className="text-xl font-bold text-slate-900 md:text-2xl">Certificate Studio Workspace</h1>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              <FaArrowLeft /> Dashboard
            </Link>

            <Link
              to="/certificates"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              <FaListUl /> Certificates
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1850px] px-3 py-4 md:px-6 md:py-6">
        <CreateCertificatePage />
      </main>
    </div>
  )
}

export default CreateCertificateStudioPage