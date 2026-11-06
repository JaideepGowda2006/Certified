import { useEffect, useState } from 'react'
import { FaExclamationTriangle, FaSearch, FaTimes, FaUndo } from 'react-icons/fa'
import api from '../api/client'
import LoadingSpinner from '../components/LoadingSpinner'
import StatusBadge from '../components/StatusBadge'
import { formatDate } from '../utils/date'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'

const PRESET_REASONS = [
  'Academic Misconduct / Cheating',
  'Administrative Correction / Data Entry Error',
  'Duplicate Certificate Issued in Error',
  'Failure to Meet Final Course Requirements',
  'Candidate Requested Cancellation',
  'Other (Specify Below)',
]

const CertificatesPage = () => {
  const { user, isAdmin } = useAuth()
  const { socket } = useSocket()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [certificates, setCertificates] = useState([])
  const [revokingId, setRevokingId] = useState('')
  const [unrevokingId, setUnrevokingId] = useState('')

  // Revoke Reason Modal State
  const [revokeModalOpen, setRevokeModalOpen] = useState(false)
  const [targetCert, setTargetCert] = useState(null)
  const [selectedReason, setSelectedReason] = useState(PRESET_REASONS[0])
  const [customReason, setCustomReason] = useState('')

  const fetchCertificates = async (search = '') => {
    try {
      setLoading(true)
      setError('')
      const response = await api.get('/certificates', {
        params: {
          search,
        },
      })
      setCertificates(response.data.certificates || [])
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to fetch certificates.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCertificates()
  }, [])

  useEffect(() => {
    if (!socket) return

    const handleCreated = (payload) => {
      const cert = payload?.certificate || payload
      if (!cert?.certificateId) return

      if (!isAdmin && cert.candidateEmail && user?.email) {
        if (cert.candidateEmail.toLowerCase() !== user.email.toLowerCase()) {
          return
        }
      }

      setCertificates((prev) => [cert, ...prev.filter((c) => c.certificateId !== cert.certificateId)])
    }

    const handleUpdated = (payload) => {
      const cert = payload?.certificate || payload
      if (!cert?.certificateId) return
      setCertificates((prev) =>
        prev.map((c) => (c.certificateId === cert.certificateId ? { ...c, ...cert } : c)),
      )
    }

    const handleRevoked = (payload) => {
      const cert = payload?.certificate || payload
      const id = cert?.certificateId || payload?.certificateId
      const reason = payload?.reason || cert?.revocationReason || 'Revoked by authority'
      const revokedAt = payload?.revokedAt || new Date().toISOString()
      if (!id) return
      setCertificates((prev) =>
        prev.map((c) =>
          c.certificateId === id
            ? {
                ...c,
                status: 'revoked',
                effectiveStatus: 'revoked',
                revocationReason: reason,
                revokedAt,
              }
            : c,
        ),
      )
    }

    const handleUnrevoked = (payload) => {
      const cert = payload?.certificate || payload
      const id = cert?.certificateId || payload?.certificateId
      if (!id) return
      setCertificates((prev) =>
        prev.map((c) =>
          c.certificateId === id
            ? {
                ...c,
                status: 'active',
                effectiveStatus: 'active',
                revocationReason: '',
                revokedAt: null,
              }
            : c,
        ),
      )
    }

    const handleDeleted = (payload) => {
      const id = payload?.certificateId
      if (!id) return
      setCertificates((prev) => prev.filter((c) => c.certificateId !== id))
    }

    socket.on('certificate:created', handleCreated)
    socket.on('certificate:updated', handleUpdated)
    socket.on('certificate:revoked', handleRevoked)
    socket.on('certificate:unrevoked', handleUnrevoked)
    socket.on('certificate:deleted', handleDeleted)

    return () => {
      socket.off('certificate:created', handleCreated)
      socket.off('certificate:updated', handleUpdated)
      socket.off('certificate:revoked', handleRevoked)
      socket.off('certificate:unrevoked', handleUnrevoked)
      socket.off('certificate:deleted', handleDeleted)
    }
  }, [socket, isAdmin, user])

  const onSearch = (event) => {
    event.preventDefault()
    fetchCertificates(query)
  }

  const openRevokeModal = (certificate) => {
    setTargetCert(certificate)
    setSelectedReason(PRESET_REASONS[0])
    setCustomReason('')
    setRevokeModalOpen(true)
  }

  const handleConfirmRevoke = async () => {
    if (!targetCert) return
    const reasonToSend = selectedReason === 'Other (Specify Below)'
      ? (customReason.trim() || 'Revoked by authority')
      : selectedReason

    setRevokingId(targetCert.certificateId)
    setError('')

    try {
      await api.patch(`/certificates/${targetCert.certificateId}/revoke`, {
        reason: reasonToSend,
      })
      setCertificates((previous) =>
        previous.map((item) =>
          item.certificateId === targetCert.certificateId
            ? {
                ...item,
                status: 'revoked',
                effectiveStatus: 'revoked',
                revocationReason: reasonToSend,
                revokedAt: new Date().toISOString(),
              }
            : item,
        ),
      )
      setRevokeModalOpen(false)
      setTargetCert(null)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to revoke certificate.')
    } finally {
      setRevokingId('')
    }
  }

  const onUnrevoke = async (certificateId) => {
    setUnrevokingId(certificateId)
    setError('')

    try {
      await api.patch(`/certificates/${certificateId}/unrevoke`)
      setCertificates((previous) =>
        previous.map((item) =>
          item.certificateId === certificateId
            ? {
                ...item,
                status: 'active',
                effectiveStatus: 'active',
                revocationReason: '',
                revokedAt: null,
              }
            : item,
        ),
      )
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to reinstate certificate.')
    } finally {
      setUnrevokingId('')
    }
  }

  if (loading) {
    return <LoadingSpinner label="Loading certificates..." />
  }

  const hasCertificates = certificates.length > 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-indigo-600 dark:text-cyan-400">Certificate Registry</p>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-3xl">Issued Credentials</h1>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          {isAdmin ? 'Manage repository, revocation & status telemetry' : 'Your personal verified credentials vault'}
        </p>
      </div>

      <section className="liquid-glass rounded-3xl p-5 md:p-6 shadow-sm">
        <form onSubmit={onSearch} className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[240px] flex-1">
            <FaSearch className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by ID, candidate name, or credential title..."
              className="liquid-glass-input w-full rounded-2xl py-2.5 pl-10 pr-4 text-xs outline-none"
            />
          </div>
          <button
            type="submit"
            className="liquid-btn-secondary rounded-2xl px-5 py-2.5 text-xs font-bold"
          >
            Search Registry
          </button>
        </form>

        {error && (
          <p className="mt-4 rounded-xl border border-rose-300 bg-rose-50/80 dark:bg-rose-950/50 px-3.5 py-2 text-xs font-semibold text-rose-700 dark:text-rose-300">
            {error}
          </p>
        )}

        {hasCertificates ? (
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-2.5 text-xs">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wider text-slate-400">
                  <th className="px-4 py-2 font-bold">Credential Info</th>
                  <th className="px-4 py-2 font-bold">Candidate</th>
                  <th className="px-4 py-2 font-bold">Issued Date</th>
                  <th className="px-4 py-2 font-bold">Status</th>
                  <th className="px-4 py-2 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {certificates.map((certificate) => {
                  const isRevoked = certificate.status === 'revoked' || certificate.effectiveStatus === 'revoked'

                  return (
                    <tr key={certificate.certificateId} className="liquid-glass-subtle group transition hover:bg-white/90 dark:hover:bg-slate-800/80">
                      <td className="rounded-l-2xl px-4 py-3.5 border-y border-l border-white/80 dark:border-white/10">
                        <p className="font-bold text-slate-900 dark:text-white">{certificate.certificateTitle}</p>
                        <p className="mt-0.5 font-mono text-[10px] text-indigo-600 dark:text-cyan-400 font-semibold">{certificate.certificateId}</p>

                        {isRevoked && (
                          <div className="mt-2.5 flex flex-col gap-1 rounded-xl border border-rose-300/80 dark:border-rose-800 bg-rose-50/90 dark:bg-rose-950/60 p-2.5 text-[11px] text-rose-900 dark:text-rose-200">
                            <div className="flex items-center gap-1.5 font-bold text-rose-800 dark:text-rose-300">
                              <FaExclamationTriangle className="text-rose-600 dark:text-rose-400 shrink-0" />
                              <span>Revocation Notice:</span>
                            </div>
                            <p className="text-rose-700 dark:text-rose-300 italic">
                              "{certificate.revocationReason || 'Revoked by authority'}"
                            </p>
                            {certificate.revokedAt && (
                              <p className="text-[9px] text-rose-500 dark:text-rose-400 font-medium">
                                Revoked on: {formatDate(certificate.revokedAt)}
                              </p>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5 border-y border-white/80 dark:border-white/10 text-slate-700 dark:text-slate-300">
                        <p className="font-bold text-slate-900 dark:text-white">{certificate.candidateName}</p>
                        {certificate.candidateEmail && (
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">{certificate.candidateEmail}</p>
                        )}
                      </td>
                      <td className="px-4 py-3.5 border-y border-white/80 dark:border-white/10 text-slate-600 dark:text-slate-300 font-medium">
                        {formatDate(certificate.issueDate)}
                      </td>
                      <td className="px-4 py-3.5 border-y border-white/80 dark:border-white/10">
                        <StatusBadge status={certificate.effectiveStatus || certificate.status} />
                      </td>
                      <td className="rounded-r-2xl px-4 py-3.5 border-y border-r border-white/80 dark:border-white/10 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => window.open(`/verify/${certificate.certificateId}`, '_blank')}
                            className="liquid-btn-secondary rounded-xl px-3 py-1.5 text-[11px] font-bold"
                          >
                            Verify
                          </button>

                          {isAdmin && (
                            <>
                              {!isRevoked ? (
                                <button
                                  type="button"
                                  onClick={() => openRevokeModal(certificate)}
                                  disabled={revokingId === certificate.certificateId}
                                  className="rounded-xl border border-rose-300/80 bg-rose-50/80 dark:bg-rose-950/60 dark:border-rose-800 px-3 py-1.5 text-[11px] font-bold text-rose-700 dark:text-rose-300 transition hover:bg-rose-100 disabled:opacity-50"
                                >
                                  {revokingId === certificate.certificateId ? 'Revoking...' : 'Revoke'}
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => onUnrevoke(certificate.certificateId)}
                                  disabled={unrevokingId === certificate.certificateId}
                                  className="inline-flex items-center gap-1 rounded-xl border border-emerald-300/80 bg-emerald-50/80 dark:bg-emerald-950/60 dark:border-emerald-800 px-3 py-1.5 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 transition hover:bg-emerald-100 disabled:opacity-50 shadow-xs"
                                  title="Reinstate this certificate to active status"
                                >
                                  <FaUndo className="text-[9px]" />
                                  {unrevokingId === certificate.certificateId ? 'Reinstating...' : 'Unrevoke'}
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-6 text-xs text-slate-500 dark:text-slate-400">No certificates matching query found.</p>
        )}
      </section>

      {/* Revocation Reason Modal Dialog with Liquid Glass */}
      {revokeModalOpen && targetCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-md p-4">
          <div className="liquid-glass w-full max-w-lg rounded-3xl p-6 md:p-7 shadow-2xl border border-white/90 dark:border-white/10">
            <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/10 pb-3">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                <FaExclamationTriangle className="text-lg" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Revoke Certificate</h3>
              </div>
              <button
                type="button"
                onClick={() => setRevokeModalOpen(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <FaTimes />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="liquid-glass-subtle rounded-2xl p-3.5 text-xs text-slate-600 dark:text-slate-300 border border-white/80 dark:border-white/10">
                <p>
                  <span className="font-bold text-slate-800 dark:text-white">Certificate:</span>{' '}
                  {targetCert.certificateTitle} ({targetCert.certificateId})
                </p>
                <p className="mt-1">
                  <span className="font-bold text-slate-800 dark:text-white">Candidate:</span>{' '}
                  {targetCert.candidateName} {targetCert.candidateEmail ? `(${targetCert.candidateEmail})` : ''}
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Select Reason for Revocation <span className="text-rose-500">*</span>
                </label>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  This reason will be visible to the candidate and public verification scanners.
                </p>
                <div className="mt-2.5 space-y-2">
                  {PRESET_REASONS.map((reason) => (
                    <label
                      key={reason}
                      className={`flex cursor-pointer items-center gap-2.5 rounded-xl border p-2.5 text-xs transition ${
                        selectedReason === reason
                          ? 'border-rose-400 bg-rose-50/70 dark:bg-rose-950/70 font-bold text-rose-950 dark:text-rose-200 shadow-xs'
                          : 'border-slate-200/80 dark:border-slate-800 bg-white/60 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="revocationReason"
                        value={reason}
                        checked={selectedReason === reason}
                        onChange={(e) => setSelectedReason(e.target.value)}
                        className="text-rose-600 focus:ring-rose-500"
                      />
                      <span>{reason}</span>
                    </label>
                  ))}
                </div>
              </div>

              {selectedReason === 'Other (Specify Below)' && (
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Custom Reason Description <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Enter detailed reason for certificate revocation..."
                    className="liquid-glass-input mt-1.5 w-full rounded-2xl p-3 text-xs outline-none"
                  />
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-200/60 dark:border-white/10 pt-4">
              <button
                type="button"
                onClick={() => setRevokeModalOpen(false)}
                className="liquid-btn-secondary rounded-xl px-4 py-2 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRevoke}
                disabled={Boolean(revokingId)}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-rose-600/20 hover:bg-rose-700 disabled:opacity-50"
              >
                {revokingId ? 'Revoking...' : 'Confirm Revocation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CertificatesPage
