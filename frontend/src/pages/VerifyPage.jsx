import { useEffect, useMemo, useState } from 'react'
import { FaDownload, FaEye, FaLock, FaQrcode, FaShieldAlt } from 'react-icons/fa'
import { Link, useParams } from 'react-router-dom'
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [payload, setPayload] = useState(null)
  const [revealed, setRevealed] = useState(false)
  const [sessionId, setSessionId] = useState('')
  const [isSecurityLocked, setIsSecurityLocked] = useState(false)
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false)
  const [downloadError, setDownloadError] = useState('')

  useEffect(() => {
    setSessionId(getOrCreateSessionId())
  }, [])

  useEffect(() => {
    const loadCertificate = async () => {
      if (!sessionId) {
        return
      }

      setLoading(true)
      setError('')

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
    globalThis.addEventListener('beforeprint', lockBeforePrint)

    return () => {
      document.removeEventListener('contextmenu', disableContextMenu)
      document.removeEventListener('keydown', disableCopyShortcuts)
      document.removeEventListener('dragstart', disableDragStart)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      globalThis.removeEventListener('beforeprint', lockBeforePrint)
    }
  }, [])

  const watermarkText = useMemo(() => {
    const timestamp = formatDateTime(new Date())
    return `Verified via TrueCert | ${timestamp} | Session ${sessionId}`
  }, [sessionId])

  const shareUrl = globalThis.location?.href || ''

  if (loading) {
    return <LoadingSpinner label="Validating certificate..." />
  }

  if (error) {
    return (
      <div className="mx-auto mt-10 max-w-4xl px-4">
        <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</p>
      </div>
    )
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
          // Keep fallback message when response body is not JSON.
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
    <div className="relative secure-no-select min-h-screen overflow-hidden px-4 py-8">
      <div className="pointer-events-none absolute -left-20 top-6 h-64 w-64 rounded-full bg-brand-200/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-10 h-72 w-72 rounded-full bg-orange-200/35 blur-3xl" />

      <div className="mx-auto w-full max-w-6xl space-y-6">
        <header className="glass-panel rounded-3xl border border-slate-200/70 p-5 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-brand-700">Public Verification</p>
              <h1 className="mt-1 text-3xl font-bold text-slate-900 md:text-4xl">Certificate Vault</h1>
              <p className="mt-2 text-sm text-slate-600">High-trust credential verification with protected PDF access.</p>
            </div>
            <Link
              to="/"
              className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Back to TrueCert
            </Link>
          </div>
        </header>

        <section className="glass-panel relative overflow-hidden rounded-[30px] border border-slate-200/75 p-5 md:p-8">
          <WatermarkOverlay text={watermarkText} />
          <div className="pointer-events-none absolute -right-10 top-8 h-40 w-40 rounded-full bg-brand-100/35 blur-2xl" />
          <div className="pointer-events-none absolute -left-16 bottom-4 h-48 w-48 rounded-full bg-cyan-100/35 blur-2xl" />

          <div className="relative z-10 space-y-6">
            {isSecurityLocked && (
              <div className="rounded-2xl border border-amber-300 bg-amber-50/95 p-4">
                <p className="inline-flex items-center gap-2 text-sm font-semibold text-amber-800">
                  <FaLock /> Security lock is active for this session.
                </p>
                <p className="mt-2 text-sm text-amber-800">
                  TrueCert automatically locks sensitive data when the tab loses focus or print is invoked.
                </p>
                <button
                  type="button"
                  onClick={() => setIsSecurityLocked(false)}
                  className="mt-3 rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-white"
                >
                  Unlock Verified View
                </button>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/90 p-3 md:p-4">
              <div className="flex flex-wrap items-center gap-2">
                {certificate.effectiveStatus === 'revoked' && (
                  <span className="rounded-full bg-rose-100 px-4 py-2 text-sm font-bold uppercase tracking-wide text-rose-700">
                    Revoked Certificate
                  </span>
                )}
                {certificate.effectiveStatus === 'expired' && (
                  <span className="rounded-full bg-amber-100 px-4 py-2 text-sm font-bold uppercase tracking-wide text-amber-700">
                    Expired Certificate
                  </span>
                )}
                {certificate.effectiveStatus === 'active' && (
                  <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-bold uppercase tracking-wide text-emerald-700">
                    Verified Active Certificate
                  </span>
                )}
                <StatusBadge status={certificate.effectiveStatus} />
              </div>
              <div className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white">
                ID: {certificate.certificateId}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white/95 p-4">
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                <FaShieldAlt className="text-brand-700" /> Hash Verification
              </p>
              <p className={`mt-2 text-base font-bold ${verification.isAuthentic ? 'text-emerald-700' : 'text-rose-700'}`}>
                {verification.message}
              </p>
            </div>

            <div className={`grid gap-5 md:grid-cols-[1.2fr_0.8fr] security-blur ${canRevealData ? 'revealed' : ''}`}>
              <article className="space-y-4 rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-soft">
                <h2 className="text-xl font-semibold text-slate-900">Certificate Details</h2>
                <div className="grid gap-3 text-sm text-slate-700 md:grid-cols-2">
                  <p>
                    <strong>ID:</strong> {certificate.certificateId}
                  </p>
                  <p>
                    <strong>Candidate:</strong> {certificate.candidateName}
                  </p>
                  <p>
                    <strong>Title:</strong> {certificate.certificateTitle}
                  </p>
                  <p>
                    <strong>Course:</strong> {certificate.courseName}
                  </p>
                  <p>
                    <strong>Issue Date:</strong> {formatDate(certificate.issueDate)}
                  </p>
                  <p>
                    <strong>Expiry Date:</strong> {formatDate(certificate.expiryDate)}
                  </p>
                  <p>
                    <strong>Issuer:</strong> {certificate.issuerName}
                  </p>
                  <p>
                    <strong>Organization:</strong> {certificate.organization}
                  </p>
                </div>

                {certificate.description && (
                  <p className="rounded-xl bg-slate-50 p-3 text-sm leading-relaxed text-slate-600">{certificate.description}</p>
                )}
              </article>

              <article className="space-y-4 rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-soft">
                <h2 className="text-xl font-semibold text-slate-900">Artifacts</h2>
                {certificate.qrUrl && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                      <FaQrcode /> Verification QR
                    </p>
                    <img
                      src={certificate.qrUrl}
                      alt="Certificate QR"
                      draggable="false"
                      className="mx-auto rounded-xl border border-slate-200 bg-white p-2"
                    />
                  </div>
                )}

                <div className="grid gap-3">
                  <button
                    type="button"
                    onClick={handleDownloadPdf}
                    disabled={isDownloadingPdf || !certificate?.pdfAccessUrl}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3.5 text-center text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-500"
                  >
                    <FaDownload className="text-sm" />
                    {isDownloadingPdf ? 'Preparing PDF...' : 'Download Certificate PDF'}
                  </button>
                  <Link
                    to={`/verify/${certificate.certificateId}/pdf?sessionId=${encodeURIComponent(sessionId)}`}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    <FaEye className="text-sm" />
                    Open Protected PDF Viewer
                  </Link>
                </div>

                {downloadError && <p className="text-xs font-semibold text-rose-700">{downloadError}</p>}
              </article>
            </div>

            <div className="rounded-2xl border border-brand-200 bg-brand-50/80 p-4 md:p-5">
              <h3 className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-brand-800">
                <FaShieldAlt /> Security Shield Enabled
              </h3>
              <p className="mt-2 text-sm text-brand-800">
                Dynamic watermark overlays this view with timestamp and session ID. Right-click, copy and print
                shortcuts are restricted to reduce unauthorized capture.
              </p>
              <p className="mt-1 text-xs text-brand-700">
                PDF access token expires in approximately {verification.pdfTokenExpiresInMinutes || 10} minutes.
              </p>
              {!canRevealData && (
                <button
                  type="button"
                  onClick={() => setRevealed(true)}
                  className="mt-3 rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white"
                >
                  Reveal Verified Data
                </button>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white/95 p-4 md:p-5">
              <p className="text-sm font-semibold text-slate-700">Share Verification</p>
              <div className="mt-3 flex items-center gap-2">
                <LinkedinShareButton url={shareUrl} title="Verified certificate on TrueCert">
                  <LinkedinIcon size={36} round />
                </LinkedinShareButton>
                <XShareButton url={shareUrl} title="Verified certificate on TrueCert">
                  <XIcon size={36} round />
                </XShareButton>
                <WhatsappShareButton url={shareUrl} title="Verified certificate on TrueCert">
                  <WhatsappIcon size={36} round />
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
