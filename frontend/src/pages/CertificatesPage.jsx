import { useEffect, useState } from 'react'
import { FaSearch } from 'react-icons/fa'
import api from '../api/client'
import LoadingSpinner from '../components/LoadingSpinner'
import StatusBadge from '../components/StatusBadge'
import { formatDate } from '../utils/date'

const CertificatesPage = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [certificates, setCertificates] = useState([])
  const [revokingId, setRevokingId] = useState('')

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

  const onSearch = (event) => {
    event.preventDefault()
    fetchCertificates(query)
  }

  const onRevoke = async (certificateId) => {
    setRevokingId(certificateId)
    setError('')

    try {
      await api.patch(`/certificates/${certificateId}/revoke`)
      setCertificates((previous) =>
        previous.map((item) =>
          item.certificateId === certificateId
            ? {
                ...item,
                status: 'revoked',
                effectiveStatus: 'revoked',
              }
            : item,
        ),
      )
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to revoke certificate.')
    } finally {
      setRevokingId('')
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
                {certificates.map((certificate) => (
                  <tr key={certificate.certificateId} className="rounded-xl bg-white shadow-sm">
                    <td className="rounded-l-xl px-3 py-3">
                      <p className="font-semibold text-slate-800">{certificate.certificateTitle}</p>
                      <p className="text-xs text-slate-500">{certificate.certificateId}</p>
                    </td>
                    <td className="px-3 py-3 text-slate-700">{certificate.candidateName}</td>
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

                        {certificate.status !== 'revoked' && (
                          <button
                            type="button"
                            onClick={() => onRevoke(certificate.certificateId)}
                            disabled={revokingId === certificate.certificateId}
                            className="rounded-lg border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed"
                          >
                            {revokingId === certificate.certificateId ? 'Revoking...' : 'Revoke'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-5 text-sm text-slate-600">No certificates found.</p>
        )}
      </section>
    </div>
  )
}

export default CertificatesPage
