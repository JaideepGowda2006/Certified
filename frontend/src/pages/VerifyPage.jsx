import { useEffect, useMemo, useState } from 'react'
import { FaDownload, FaExclamationTriangle, FaEye, FaLock, FaQrcode, FaShieldAlt } from 'react-icons/fa'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  LinkedinIcon,
  LinkedinShareButton,
  WhatsappIcon,
  WhatsappShareButton,
  XIcon,
  XShareButton,
} from 'react-share'
import api from '../api/client'
import LoadingSpinner from '../components/LoadingSpinner'
import StatusBadge from '../components/StatusBadge'
import WatermarkOverlay from '../components/WatermarkOverlay'
import ThemeToggle from '../components/ThemeToggle'
import { formatDate, formatDateTime } from '../utils/date'

const getOrCreateSessionId = () => {
  const existing = sessionStorage.getItem('truecert_verify_session')
  if (existing) {
    return existing
  }

  const generated = Math.random().toString(36).slice(2, 10).toUpperCase()
  sessionStorage.setItem('truecert_verify_session', generated)
  return generated
}

const VerifyPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(Boolean(id))
  const [error, setError] = useState('')
  const [payload, setPayload] = useState(null)
  const [lookupId, setLookupId] = useState(id || '')
  const [revealed, setRevealed] = useState(false)
  const [sessionId, setSessionId] = useState('')
  const [isSecurityLocked, setIsSecurityLocked] = useState(false)
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false)
  const [downloadError, setDownloadError] = useState('')

  useEffect(() => {
    setSessionId(getOrCreateSessionId())
  }, [])

  useEffect(() => {
    setLookupId(id || '')
  }, [id])

  useEffect(() => {
    const loadCertificate = async () => {
      if (!id || !sessionId) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError('')
      setPayload(null)

      try {
        const response = await api.get(`/verify/${id}`, {
          params: {
            sessionId,
          },
        })
        setPayload(response.data)
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Unable to verify this certificate.')
      } finally {
        setLoading(false)
      }
    }

    loadCertificate()
  }, [id, sessionId])

  useEffect(() => {
    const disableContextMenu = (event) => event.preventDefault()
    const disableCopyShortcuts = (event) => {
      if ((event.ctrlKey || event.metaKey) && ['c', 'p', 's', 'u'].includes(event.key.toLowerCase())) {
        event.preventDefault()
      }

      if (event.key === 'F12' || ((event.ctrlKey || event.metaKey) && event.shiftKey && ['i', 'j', 'c'].includes(event.key.toLowerCase()))) {
        event.preventDefault()
      }
    }
    const disableDragStart = (event) => event.preventDefault()

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setRevealed(false)
        setIsSecurityLocked(true)
      }
    }

    const lockBeforePrint = () => {
      setRevealed(false)
      setIsSecurityLocked(true)
    }

    document.addEventListener('contextmenu', disableContextMenu)
    document.addEventListener('keydown', disableCopyShortcuts)
    document.addEventListener('dragstart', disableDragStart)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('beforeprint', lockBeforePrint)

    return () => {
      document.removeEventListener('contextmenu', disableContextMenu)
      document.removeEventListener('keydown', disableCopyShortcuts)
      document.removeEventListener('dragstart', disableDragStart)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeprint', lockBeforePrint)
    }
  }, [])

  const watermarkText = useMemo(() => {
    const timestamp = new Date().toISOString()
    return `Verified via Certified | ${timestamp} | Session ${sessionId}`
  }, [sessionId])

  const shareUrl = globalThis.location?.href || ''

  const handleLookupSubmit = (event) => {
    event.preventDefault()
    const normalizedId = lookupId.trim()

    if (!normalizedId) {
      setError('Enter a certificate ID to verify.')
      return
    }

    navigate(`/verify/${encodeURIComponent(normalizedId)}`)
  }

  const lookupForm = (
    <form onSubmit={handleLookupSubmit} className="flex flex-col gap-3 sm:flex-row">
      <label htmlFor="certificate-id" className="sr-only">
        Certificate ID
      </label>
      <input
        id="certificate-id"
        value={lookupId}
        onChange={(event) => setLookupId(event.target.value)}
        placeholder="Enter certificate ID, e.g. TCRHAMY558G4C"
        className="liquid-glass-input min-w-0 flex-1 rounded-2xl px-4 py-3 text-xs outline-none"
      />
      <button
        type="submit"
        className="liquid-btn-primary rounded-2xl px-6 py-3 text-xs font-bold tracking-wide"
      >
        Verify Certificate
      </button>
    </form>
  )

  if (!id) {
    return (
      <div className="min-h-screen bg-[#fbfbfd] text-[#1d1d1f] dark:bg-[#000000] dark:text-[#f5f5f7] px-4 py-16 transition-colors duration-300">
        <div className="mx-auto max-w-2xl space-y-6">
          <header className="rounded-2xl border border-neutral-200/90 dark:border-neutral-850 bg-white/80 dark:bg-neutral-925/80 p-7 md:p-8 backdrop-blur-xl shadow-apple dark:shadow-apple-dark">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-mono text-xs font-bold">
                  C
                </div>
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400">Public Verification</p>
              </div>
              <ThemeToggle compact />
            </div>
            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-neutral-950 dark:text-white md:text-3xl">Verify a Credential</h1>
            <p className="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400">
              Enter any issued credential identification number to validate its cryptographic authenticity, issuance history, and active status.
            </p>
          </header>

          <section className="rounded-2xl border border-neutral-200/90 dark:border-neutral-850 bg-white/80 dark:bg-neutral-925/80 p-6 md:p-7 backdrop-blur-xl shadow-apple dark:shadow-apple-dark">
            {lookupForm}
            {error && (
              <p className="mt-4 rounded-xl border border-rose-300 bg-rose-50/80 dark:bg-rose-950/50 dark:border-rose-800 px-4 py-3 text-xs font-medium text-rose-700 dark:text-rose-300">
                {error}
              </p>
            )}
          </section>

          <div className="text-center">
            <Link to="/dashboard" className="font-mono text-xs text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white underline underline-offset-4">
              ← Return to Certified Console
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return <LoadingSpinner label="Validating certificate authenticity..." />
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#fbfbfd] text-[#1d1d1f] dark:bg-[#000000] dark:text-[#f5f5f7] px-4 py-16 transition-colors duration-300">
        <div className="mx-auto max-w-2xl space-y-5">
          <div className="rounded-2xl border border-rose-300/80 bg-rose-50/90 dark:bg-rose-950/60 dark:border-rose-800 p-5 text-xs font-medium text-rose-800 dark:text-rose-200">
            <p className="font-semibold text-sm">Certificate Verification Issue</p>
            <p className="mt-1">{error}</p>
          </div>
          <div className="rounded-2xl border border-neutral-200/90 dark:border-neutral-850 bg-white/80 dark:bg-neutral-925/80 p-6 shadow-apple dark:shadow-apple-dark">
            {lookupForm}
          </div>
          <div className="text-center">
            <Link to="/dashboard" className="font-mono text-xs text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white underline underline-offset-4">
              ← Return to Certified Console
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!payload?.certificate || !payload?.verification) {
    return <LoadingSpinner label="Validating certificate..." />
  }

  const certificate = payload?.certificate
  const verification = payload?.verification
  const canRevealData = revealed && !isSecurityLocked

  const handleDownloadPdf = async () => {
    if (!sessionId) {
      setDownloadError('Session is not ready yet. Please try again in a moment.')
      return
    }

    try {
      setIsDownloadingPdf(true)
      setDownloadError('')

      const verifyResponse = await api.get(`/verify/${id}`, {
        params: {
          sessionId,
        },
      })

      const freshPdfAccessUrl = verifyResponse.data?.certificate?.pdfAccessUrl
      if (!freshPdfAccessUrl) {
        throw new Error('Unable to generate PDF access URL. Please re-verify certificate.')
      }

      const separator = freshPdfAccessUrl.includes('?') ? '&' : '?'
      const downloadUrl = `${freshPdfAccessUrl}${separator}download=1`
      const pdfResponse = await fetch(downloadUrl)

      if (!pdfResponse.ok) {
        let message = 'Failed to download certificate PDF.'
        try {
          const body = await pdfResponse.json()
          message = body?.message || message
        } catch {
          // Keep fallback message
        }
        throw new Error(message)
      }

      const pdfBlob = await pdfResponse.blob()
      const objectUrl = globalThis.URL.createObjectURL(pdfBlob)
      const anchor = document.createElement('a')
      anchor.href = objectUrl
      anchor.download = `certificate_${certificate.certificateId}.pdf`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      globalThis.URL.revokeObjectURL(objectUrl)
    } catch (requestError) {
      setDownloadError(requestError.message || 'Failed to download certificate PDF.')
    } finally {
      setIsDownloadingPdf(false)
    }
  }

  return (
    <div className="secure-no-select min-h-screen bg-[#fbfbfd] text-[#1d1d1f] dark:bg-[#000000] dark:text-[#f5f5f7] px-4 py-8 transition-colors duration-300">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <header className="rounded-2xl border border-neutral-200/90 dark:border-neutral-850 bg-white/80 dark:bg-neutral-925/80 p-5 md:p-6 backdrop-blur-xl shadow-apple dark:shadow-apple-dark">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-mono text-xs font-bold">
                C
              </div>
              <div>
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400">Cryptographic Registry</p>
                <h1 className="text-xl font-semibold tracking-tight text-neutral-950 dark:text-white md:text-2xl">Credential Vault</h1>
                <p className="font-mono text-xs text-neutral-500 dark:text-neutral-400">SHA-256 tamper-proof protocol.</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Link
                to="/"
                className="rounded-full border border-neutral-300 dark:border-neutral-800 bg-transparent px-4 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 transition hover:bg-neutral-100 dark:hover:bg-neutral-900"
              >
                Home
              </Link>
            </div>
          </div>
        </header>

        <section className="relative overflow-hidden rounded-2xl border border-neutral-200/90 dark:border-neutral-850 bg-white/80 dark:bg-neutral-925/80 p-6 md:p-8 backdrop-blur-xl shadow-apple dark:shadow-apple-dark">
          <WatermarkOverlay text={watermarkText} />

          <div className="relative z-10 space-y-6">
            {isSecurityLocked && (
              <div className="rounded-xl border border-amber-300/80 bg-amber-50/90 dark:bg-amber-950/50 dark:border-amber-800 p-4">
                <p className="inline-flex items-center gap-2 text-xs font-semibold text-amber-900 dark:text-amber-200">
                  <FaLock className="text-amber-600 dark:text-amber-400" /> Security lock active for this session
                </p>
                <p className="mt-1 text-xs text-amber-800 dark:text-amber-300">
                  Certified automatically restricts sensitive candidate records when the tab loses focus or print is invoked.
                </p>
                <button
                  type="button"
                  onClick={() => setIsSecurityLocked(false)}
                  className="mt-3 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-3.5 py-1.5 text-xs font-medium"
                >
                  Unlock Verified View
                </button>
              </div>
            )}

            {/* Status & ID Banner */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/60 p-4">
              <div className="flex flex-wrap items-center gap-2">
                {certificate.effectiveStatus === 'revoked' && (
                  <span className="rounded-full bg-rose-500/10 border border-rose-500/30 px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
                    Revoked Certificate
                  </span>
                )}
                {certificate.effectiveStatus === 'expired' && (
                  <span className="rounded-full bg-amber-500/10 border border-amber-500/30 px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                    Expired Certificate
                  </span>
                )}
                {certificate.effectiveStatus === 'active' && (
                  <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                    Verified Active
                  </span>
                )}
                <StatusBadge status={certificate.effectiveStatus} />
              </div>
              <div className="font-mono text-xs font-bold tracking-wider text-neutral-800 dark:text-neutral-200">
                ID: {certificate.certificateId}
              </div>
            </div>

            {/* Revoked Notice if applicable */}
            {(certificate.effectiveStatus === 'revoked' || certificate.status === 'revoked') && (
              <div className="rounded-xl border border-rose-300/80 bg-rose-50/95 dark:bg-rose-950/60 dark:border-rose-800 p-4 text-rose-900 dark:text-rose-200">
                <div className="flex items-center gap-2 font-semibold text-rose-800 dark:text-rose-300 text-xs">
                  <FaExclamationTriangle className="text-rose-600 dark:text-rose-400 text-base" />
                  <span>Credential Revocation Notice</span>
                </div>
                <p className="mt-2 text-xs text-rose-700 dark:text-rose-300">
                  <span className="font-semibold">Official Reason:</span>{' '}
                  {certificate.revocationReason || 'Revoked by issuing authority'}
                </p>
                {certificate.revokedAt && (
                  <p className="mt-1 font-mono text-[10px] text-rose-500 dark:text-rose-400">
                    Timestamp: {formatDateTime(certificate.revokedAt)}
                  </p>
                )}
              </div>
            )}

            {/* Hash Verification Pill */}
            <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/60 p-4">
              <p className="inline-flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                <FaShieldAlt className="text-neutral-700 dark:text-neutral-300 text-xs" /> Cryptographic Integrity Check
              </p>
              <p className={`mt-1.5 text-xs font-mono font-semibold ${verification.isAuthentic ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                {verification.message}
              </p>
            </div>

            {/* Details & QR Grid */}
            <div className={`grid gap-5 md:grid-cols-[1.2fr_0.8fr] security-blur ${canRevealData ? 'revealed' : ''}`}>
              <article className="space-y-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40 p-5">
                <h2 className="text-sm font-semibold tracking-tight text-neutral-950 dark:text-white">Credential Metadata</h2>
                <div className="grid gap-3 text-xs text-neutral-600 dark:text-neutral-300 md:grid-cols-2">
                  <p>
                    <strong className="text-neutral-950 dark:text-white font-medium">ID:</strong> {certificate.certificateId}
                  </p>
                  <p>
                    <strong className="text-neutral-950 dark:text-white font-medium">Candidate:</strong> {certificate.candidateName}
                  </p>
                  <p>
                    <strong className="text-neutral-950 dark:text-white font-medium">Award Title:</strong> {certificate.certificateTitle}
                  </p>
                  <p>
                    <strong className="text-neutral-950 dark:text-white font-medium">Course / Program:</strong> {certificate.courseName}
                  </p>
                  <p>
                    <strong className="text-neutral-950 dark:text-white font-medium">Issue Date:</strong> {formatDate(certificate.issueDate)}
                  </p>
                  <p>
                    <strong className="text-neutral-950 dark:text-white font-medium">Expiry Date:</strong> {formatDate(certificate.expiryDate)}
                  </p>
                  <p>
                    <strong className="text-neutral-950 dark:text-white font-medium">Issuer Authority:</strong> {certificate.issuerName}
                  </p>
                  <p>
                    <strong className="text-neutral-950 dark:text-white font-medium">Institution:</strong> {certificate.organization}
                  </p>
                </div>

                {certificate.description && (
                  <p className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white/60 dark:bg-neutral-925/60 p-3 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
                    {certificate.description}
                  </p>
                )}
              </article>

              <article className="space-y-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40 p-5">
                <h2 className="text-sm font-semibold tracking-tight text-neutral-950 dark:text-white">Official Artifacts</h2>
                {certificate.qrUrl && (
                  <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-925 p-4 text-center">
                    <p className="mb-3 inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                      <FaQrcode className="text-xs" /> Tamper-Proof QR Link
                    </p>
                    <img
                      src={certificate.qrUrl}
                      alt="Certificate QR"
                      draggable="false"
                      className="mx-auto rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white p-2 max-w-[140px]"
                    />
                  </div>
                )}

                <div className="grid gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadPdf}
                    disabled={isDownloadingPdf || !certificate?.pdfAccessUrl}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 py-2.5 text-center text-xs font-semibold transition hover:opacity-90 disabled:opacity-50"
                  >
                    <FaDownload className="text-xs" />
                    {isDownloadingPdf ? 'Generating PDF...' : 'Download Certificate PDF'}
                  </button>
                  <Link
                    to={`/verify/${certificate.certificateId}/pdf?sessionId=${encodeURIComponent(sessionId)}`}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-300 dark:border-neutral-800 bg-transparent py-2.5 text-center text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900"
                  >
                    <FaEye className="text-xs" />
                    Open Protected PDF Viewer
                  </Link>
                </div>

                {downloadError && <p className="text-xs font-medium text-rose-700 dark:text-rose-400">{downloadError}</p>}
              </article>
            </div>

            {/* Privacy Shield Notice */}
            <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/60 p-4">
              <h3 className="inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                <FaShieldAlt className="text-xs" /> Active Security Shield
              </h3>
              <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Dynamic session watermark overlays this view. Screen capture, copy, and print shortcuts are monitored to protect student credential privacy.
              </p>
              {!canRevealData && (
                <button
                  type="button"
                  onClick={() => setRevealed(true)}
                  className="mt-3 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 px-3.5 py-1.5 text-xs font-semibold"
                >
                  Reveal Verified Data
                </button>
              )}
            </div>

            {/* Social Share */}
            <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/60 p-4 flex items-center justify-between">
              <p className="font-mono text-xs text-neutral-600 dark:text-neutral-400">Share Public Verification</p>
              <div className="flex items-center gap-2">
                <LinkedinShareButton url={shareUrl} title="Verified certificate on Certified">
                  <LinkedinIcon size={28} round />
                </LinkedinShareButton>
                <XShareButton url={shareUrl} title="Verified certificate on Certified">
                  <XIcon size={28} round />
                </XShareButton>
                <WhatsappShareButton url={shareUrl} title="Verified certificate on Certified">
                  <WhatsappIcon size={28} round />
                </WhatsappShareButton>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default VerifyPage
