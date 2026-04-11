import { useEffect, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import api from '../api/client'
import LoadingSpinner from '../components/LoadingSpinner'
import { formatDateTime } from '../utils/date'

const AnalyticsPage = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [analytics, setAnalytics] = useState(null)

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true)
      setError('')

      try {
        const response = await api.get('/analytics')
        setAnalytics(response.data.analytics)
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Failed to load analytics.')
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [])

  if (loading) {
    return <LoadingSpinner label="Loading analytics..." />
  }

  if (error) {
    return <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</p>
  }

  const hasRecentScans = (analytics?.recentScans?.length || 0) > 0

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-brand-700">Verification Insights</p>
        <h1 className="text-3xl font-bold text-slate-900">Scan Analytics</h1>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <article className="glass-panel rounded-2xl p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Total Scans</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{analytics?.totalScans || 0}</p>
        </article>

        <article className="glass-panel rounded-2xl p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Tracked Days</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{analytics?.scansPerDay?.length || 0}</p>
        </article>

        <article className="glass-panel rounded-2xl p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Top Certificates</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{analytics?.topCertificates?.length || 0}</p>
        </article>

        <article className="glass-panel rounded-2xl p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Recent Logs</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{analytics?.recentScans?.length || 0}</p>
        </article>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <article className="glass-panel rounded-2xl p-4 md:p-5">
          <h2 className="text-xl font-semibold text-slate-900">Scans Per Day</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics?.scansPerDay || []}>
                <CartesianGrid strokeDasharray="4 4" stroke="#dbeafe" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="scans" stroke="#0f766e" strokeWidth={2} name="Scans" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="glass-panel rounded-2xl p-4 md:p-5">
          <h2 className="text-xl font-semibold text-slate-900">Top Certificates</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.topCertificates || []}>
                <CartesianGrid strokeDasharray="4 4" stroke="#dbeafe" />
                <XAxis dataKey="certificateId" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="scans" fill="#0d9488" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>

      <section className="glass-panel rounded-2xl p-4 md:p-5">
        <h2 className="text-xl font-semibold text-slate-900">Recent Scan Activity</h2>
        {hasRecentScans ? (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-2">Certificate ID</th>
                  <th className="px-3 py-2">Location</th>
                  <th className="px-3 py-2">Device</th>
                  <th className="px-3 py-2">Browser</th>
                  <th className="px-3 py-2">Scanned At</th>
                </tr>
              </thead>
              <tbody>
                {analytics.recentScans.map((scan) => (
                  <tr key={`${scan.certificateId}-${scan.scannedAt}`} className="border-t border-slate-100">
                    <td className="px-3 py-3 font-semibold text-slate-800">{scan.certificateId}</td>
                    <td className="px-3 py-3 text-slate-600">
                      {scan.city}, {scan.country}
                    </td>
                    <td className="px-3 py-3 text-slate-600">{scan.device}</td>
                    <td className="px-3 py-3 text-slate-600">{scan.browser}</td>
                    <td className="px-3 py-3 text-slate-600">{formatDateTime(scan.scannedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-600">No scans tracked yet.</p>
        )}
      </section>
    </div>
  )
}

export default AnalyticsPage
