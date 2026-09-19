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

      // If viewing as student, only prepend if candidate email matches
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
      if (!id) return
      setCertificates((prev) =>
        prev.map((c) =>
          c.certificateId === id
            ? {
                ...c,
                status: 'revoked',
                effectiveStatus: 'revoked',
                revocationReason: cert?.revocationReason || payload?.revocationReason || 'Revoked via real-time update',
                revokedAt: cert?.revokedAt || new Date().toISOString(),
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
    <div className="space-y-5">
      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-brand-700">Certificate Registry</p>
        <h1 className="text-3xl font-bold text-slate-900">Issued Certificates</h1>
      </div>

      <section className="glass-panel rounded-2xl p-4 md:p-5">
        <form onSubmit={onSearch} className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by ID, candidate, or title"
              className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-brand-600"
            />
          </div>
          <button
            type="submit"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Search
          </button>
        </form>

        {error && <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{error}</p>}

        {hasCertificates ? (
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-2 text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-3 py-2">Certificate</th>
                  <th className="px-3 py-2">Candidate</th>
                  <th className="px-3 py-2">Issued</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {certificates.map((certificate) => {
                  const isRevoked = certificate.status === 'revoked' || certificate.effectiveStatus === 'revoked'

                  return (
                    <tr key={certificate.certificateId} className="rounded-xl bg-white shadow-sm">
                      <td className="rounded-l-xl px-3 py-3">
                        <p className="font-semibold text-slate-800">{certificate.certificateTitle}</p>
                        <p className="text-xs text-slate-500">{certificate.certificateId}</p>

                        {isRevoked && (
                          <div className="mt-2 flex flex-col gap-1 rounded-lg border border-rose-200 bg-rose-50/90 p-2 text-xs text-rose-800">
                            <div className="flex items-center gap-1.5 font-bold text-rose-900">
                              <FaExclamationTriangle className="text-rose-600" />
                              <span>Reason for Revocation:</span>
                            </div>
                            <p className="text-rose-700 italic">
                              "{certificate.revocationReason || 'Revoked by authority'}"
                            </p>
                            {certificate.revokedAt && (
                              <p className="text-[10px] text-rose-500">
                                Revoked on: {formatDate(certificate.revokedAt)}
                              </p>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3 text-slate-700">
                        <p className="font-medium text-slate-800">{certificate.candidateName}</p>
                        {certificate.candidateEmail && (
                          <p className="text-xs text-slate-500">{certificate.candidateEmail}</p>
                        )}
                      </td>
                      <td className="px-3 py-3 text-slate-700">{formatDate(certificate.issueDate)}</td>
                      <td className="px-3 py-3">
                        <StatusBadge status={certificate.effectiveStatus || certificate.status} />
                      </td>
                      <td className="rounded-r-xl px-3 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => window.open(`/verify/${certificate.certificateId}`, '_blank')}
                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
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
                                  className="rounded-lg border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed"
                                >
                                  {revokingId === certificate.certificateId ? 'Revoking...' : 'Revoke'}
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => onUnrevoke(certificate.certificateId)}
                                  disabled={unrevokingId === certificate.certificateId}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-100 disabled:cursor-not-allowed shadow-sm"
                                  title="Reinstate this certificate to active status"
                                >
                                  <FaUndo className="text-[10px]" />
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
          <p className="mt-5 text-sm text-slate-600">No certificates found.</p>
        )}
      </section>

      {/* Revocation Reason Modal Dialog */}
      {revokeModalOpen && targetCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2 text-rose-700">
                <FaExclamationTriangle className="text-xl" />
                <h3 className="text-lg font-bold text-slate-900">Revoke Certificate</h3>
              </div>
              <button
                type="button"
                onClick={() => setRevokeModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <FaTimes />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                <p>
                  <span className="font-semibold text-slate-800">Certificate:</span>{' '}
                  {targetCert.certificateTitle} ({targetCert.certificateId})
                </p>
                <p className="mt-1">
                  <span className="font-semibold text-slate-800">Candidate:</span>{' '}
                  {targetCert.candidateName} {targetCert.candidateEmail ? `(${targetCert.candidateEmail})` : ''}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Select Reason for Revocation <span className="text-rose-500">*</span>
                </label>
                <p className="mt-0.5 text-xs text-slate-500">
                  This reason will be visible to the student and anyone verifying the certificate.
                </p>
                <div className="mt-2 space-y-2">
                  {PRESET_REASONS.map((reason) => (
                    <label
                      key={reason}
                      className={`flex cursor-pointer items-center gap-2.5 rounded-xl border p-2.5 text-xs transition ${
                        selectedReason === reason
                          ? 'border-rose-400 bg-rose-50/60 font-semibold text-rose-950'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
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
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Custom Reason Description <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Enter detailed reason for certificate revocation..."
                    className="mt-1.5 w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-800 outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                  />
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
              <button
                type="button"
                onClick={() => setRevokeModalOpen(false)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRevoke}
                disabled={Boolean(revokingId)}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-rose-700 disabled:opacity-50"
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
