import { useEffect, useMemo, useState } from 'react'
import { FaDownload, FaExpandArrowsAlt, FaLock, FaShieldAlt, FaSyncAlt } from 'react-icons/fa'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import api from '../api/client'
import LoadingSpinner from '../components/LoadingSpinner'
import WatermarkOverlay from '../components/WatermarkOverlay'
import { formatDateTime } from '../utils/date'

const getSessionId = () => {
  const existing = sessionStorage.getItem('truecert_verify_session')
  if (existing) {
    return existing
  }

  const generated = Math.random().toString(36).slice(2, 10).toUpperCase()
  sessionStorage.setItem('truecert_verify_session', generated)
  return generated
}

const ProtectedPdfViewerPage = () => {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pdfUrl, setPdfUrl] = useState('')
  const [viewerUrl, setViewerUrl] = useState('')
  const [sessionId, setSessionId] = useState('')
  const [isSecurityLocked, setIsSecurityLocked] = useState(false)
  const [isRefreshingViewer, setIsRefreshingViewer] = useState(false)
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false)

  useEffect(() => {
    const sessionFromUrl = searchParams.get('sessionId')
    setSessionId(sessionFromUrl || getSessionId())
  }, [searchParams])

  useEffect(() => {
    const fetchPdf = async () => {
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
        const accessUrl = response.data.certificate.pdfAccessUrl
        if (!accessUrl) {
          throw new Error('Secure PDF URL is unavailable. Please re-verify this certificate.')
        }

        const pdfResponse = await fetch(accessUrl)
        if (!pdfResponse.ok) {
          let message = 'Unable to load protected PDF.'
          try {
            const body = await pdfResponse.json()
            message = body?.message || message
          } catch {
            // Keep fallback message when response body is not JSON.
          }
          throw new Error(message)
        }

        const blob = await pdfResponse.blob()
        const blobUrl = globalThis.URL.createObjectURL(blob)

        setPdfUrl(accessUrl)
        setViewerUrl((previousUrl) => {
          if (previousUrl) {
            globalThis.URL.revokeObjectURL(previousUrl)
          }
          return blobUrl
        })
      } catch (requestError) {
        setError(requestError.response?.data?.message || requestError.message || 'Unable to open protected PDF viewer.')
      } finally {
        setLoading(false)
      }
    }

    fetchPdf()
  }, [id, sessionId])

  useEffect(
    () => () => {
      if (viewerUrl) {
        globalThis.URL.revokeObjectURL(viewerUrl)
      }
    },
    [viewerUrl],
  )

  const refreshViewer = async () => {
    if (!sessionId) {
      return
    }

    setIsRefreshingViewer(true)
    setError('')

    try {
      const response = await api.get(`/verify/${id}`, {
        params: {
          sessionId,
        },
      })

      const accessUrl = response.data.certificate.pdfAccessUrl
      if (!accessUrl) {
        throw new Error('Secure PDF URL is unavailable. Please re-verify this certificate.')
      }

      const pdfResponse = await fetch(accessUrl)
      if (!pdfResponse.ok) {
        throw new Error('Unable to refresh protected PDF. Please try again.')
      }

      const blob = await pdfResponse.blob()
      const blobUrl = globalThis.URL.createObjectURL(blob)

      setPdfUrl(accessUrl)
      setViewerUrl((previousUrl) => {
        if (previousUrl) {
          globalThis.URL.revokeObjectURL(previousUrl)
        }
        return blobUrl
      })
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'Unable to refresh protected PDF viewer.')
    } finally {
      setIsRefreshingViewer(false)
    }
  }

  const downloadPdf = async () => {
    if (!pdfUrl) {
      setError('Secure PDF URL is unavailable. Please refresh and try again.')
      return
    }

    try {
      setIsDownloadingPdf(true)
      const separator = pdfUrl.includes('?') ? '&' : '?'
      const downloadUrl = `${pdfUrl}${separator}download=1`
      const response = await fetch(downloadUrl)
      if (!response.ok) {
        throw new Error('Unable to download certificate PDF. Please refresh and try again.')
      }

      const blob = await response.blob()
      const objectUrl = globalThis.URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = objectUrl
      anchor.download = `certificate_${id}.pdf`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      globalThis.URL.revokeObjectURL(objectUrl)
    } catch (requestError) {
      setError(requestError.message || 'Unable to download certificate PDF.')
    } finally {
      setIsDownloadingPdf(false)
    }
  }

  const openFullscreenViewer = () => {
    if (viewerUrl) {
      globalThis.open(viewerUrl, '_blank', 'noopener,noreferrer')
    }
  }

  useEffect(() => {
    const disableContextMenu = (event) => event.preventDefault()
    const disableShortcut = (event) => {
      if ((event.ctrlKey || event.metaKey) && ['p', 's', 'c', 'u'].includes(event.key.toLowerCase())) {
        event.preventDefault()
      }

      if (event.key === 'F12' || ((event.ctrlKey || event.metaKey) && event.shiftKey && ['i', 'j', 'c'].includes(event.key.toLowerCase()))) {
        event.preventDefault()
      }
    }

    const lockView = () => {
      setIsSecurityLocked(true)
    }

    const lockOnBlur = () => {
      if (document.hidden) {
        setIsSecurityLocked(true)
      }
    }

    document.addEventListener('contextmenu', disableContextMenu)
    document.addEventListener('keydown', disableShortcut)
    document.addEventListener('visibilitychange', lockOnBlur)
    globalThis.addEventListener('beforeprint', lockView)

    return () => {
      document.removeEventListener('contextmenu', disableContextMenu)
      document.removeEventListener('keydown', disableShortcut)
      document.removeEventListener('visibilitychange', lockOnBlur)
      globalThis.removeEventListener('beforeprint', lockView)
    }
  }, [])

  const watermarkText = useMemo(
    () => `Protected Viewer | ${formatDateTime(new Date())} | Session ${sessionId}`,
    [sessionId],
  )

  if (loading) {
    return <LoadingSpinner label="Opening protected viewer..." />
  }

  if (error) {
    return (
      <div className="mx-auto mt-10 max-w-4xl px-4">
        <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</p>
      </div>
    )
  }

  return (
    <div className="relative secure-no-select min-h-screen overflow-hidden px-4 py-8">
      <div className="pointer-events-none absolute -left-20 top-8 h-64 w-64 rounded-full bg-brand-200/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-8 h-72 w-72 rounded-full bg-cyan-200/30 blur-3xl" />

      <div className="mx-auto w-full max-w-7xl space-y-5">
        <div className="glass-panel rounded-3xl border border-slate-200/70 p-5 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-brand-700">Protected Delivery</p>
              <h1 className="mt-1 text-3xl font-bold text-slate-900 md:text-4xl">Certificate Viewer</h1>
            </div>
            <div className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white">
              Session {sessionId || 'N/A'}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
            <FaShieldAlt className="text-brand-700" />
            Dynamic watermark and tab-lock protection enabled
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              to={`/verify/${id}`}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Back to Verify
            </Link>
            <a
              href={pdfUrl}
              target="_blank"
              rel="noreferrer"
              aria-disabled={!pdfUrl}
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Open Secure PDF
            </a>
            <button
              type="button"
              onClick={downloadPdf}
              disabled={!pdfUrl || isDownloadingPdf}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FaDownload />
              {isDownloadingPdf ? 'Downloading...' : 'Download PDF'}
            </button>
            <button
              type="button"
              onClick={openFullscreenViewer}
              disabled={!viewerUrl}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FaExpandArrowsAlt />
              Fullscreen
            </button>
            <button
              type="button"
              onClick={refreshViewer}
              disabled={isRefreshingViewer}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-brand-300 bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-700 transition hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FaSyncAlt className={isRefreshingViewer ? 'animate-spin' : ''} />
              {isRefreshingViewer ? 'Refreshing...' : 'Refresh PDF'}
            </button>
          </div>
        </div>

        <section className="glass-panel relative overflow-hidden rounded-[30px] border border-slate-200/75 p-2 md:p-3">
          <WatermarkOverlay text={watermarkText} />
          {isSecurityLocked && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-900/65 p-4">
              <div className="max-w-md rounded-2xl bg-white p-5 text-center shadow-soft">
                <p className="inline-flex items-center gap-2 text-base font-semibold text-slate-900">
                  <FaLock /> Viewer locked for security.
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  Certified locks this screen when the tab loses focus or print is triggered.
                </p>
                <button
                  type="button"
                  onClick={() => setIsSecurityLocked(false)}
                  className="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white"
                >
                  Resume Protected Viewer
                </button>
              </div>
            </div>
          )}

          <div className="relative z-10 overflow-hidden rounded-[24px] border border-slate-200 bg-gradient-to-b from-slate-100 to-white p-2">
            <div className="mb-2 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Premium Protected Viewer</p>
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>Active Secure Mode</span>
              </div>
            </div>

            {viewerUrl ? (
                  <iframe title="Certified Protected PDF" src={viewerUrl} className="h-[79vh] w-full rounded-2xl bg-white" />
            ) : (
              <div className="flex h-[79vh] items-center justify-center rounded-2xl bg-slate-50 text-sm font-semibold text-slate-500">
                Protected PDF is unavailable. Use Refresh PDF and try again.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

export default ProtectedPdfViewerPage
