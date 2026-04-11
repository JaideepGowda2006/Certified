import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'

const initialForm = {
  candidateName: '',
  certificateTitle: '',
  courseName: '',
  issueDate: '',
  expiryDate: '',
  issuerName: '',
  grade: '',
  description: '',
}

const CreateCertificatePage = () => {
  const [formData, setFormData] = useState(initialForm)
  const [logoFile, setLogoFile] = useState(null)
  const [signatureFile, setSignatureFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [createdCertificate, setCreatedCertificate] = useState(null)

  const isSubmitDisabled = useMemo(
    () =>
      loading ||
      !formData.candidateName ||
      !formData.certificateTitle ||
      !formData.courseName ||
      !formData.issueDate ||
      !formData.issuerName,
    [formData, loading],
  )

  const onFieldChange = (event) => {
    setFormData((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }))
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setCreatedCertificate(null)

    try {
      const multipartData = new FormData()

      Object.entries(formData).forEach(([key, value]) => {
        if (value !== '') {
          multipartData.append(key, value)
        }
      })

      if (logoFile) {
        multipartData.append('logo', logoFile)
      }

      if (signatureFile) {
        multipartData.append('signature', signatureFile)
      }

      const response = await api.post('/certificates', multipartData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      setCreatedCertificate(response.data.certificate)
      setFormData(initialForm)
      setLogoFile(null)
      setSignatureFile(null)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to create certificate.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-brand-700">Issue Credential</p>
        <h1 className="text-3xl font-bold text-slate-900">Create Certificate</h1>
      </div>

      <section className="glass-panel rounded-2xl p-5 md:p-6">
        <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
          {[
            ['candidateName', 'Candidate Name', 'text'],
            ['certificateTitle', 'Certificate Title', 'text'],
            ['courseName', 'Course', 'text'],
            ['issueDate', 'Issue Date', 'date'],
            ['expiryDate', 'Expiry Date', 'date'],
            ['issuerName', 'Issuer Name', 'text'],
            ['grade', 'Grade', 'text'],
          ].map(([name, label, type]) => (
            <label key={name} className="block">
              <span className="mb-1 block text-sm font-semibold text-slate-700">{label}</span>
              <input
                name={name}
                type={type}
                value={formData[name]}
                onChange={onFieldChange}
                required={['candidateName', 'certificateTitle', 'courseName', 'issueDate', 'issuerName'].includes(name)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-brand-600"
              />
            </label>
          ))}

          <label className="md:col-span-2">
            <span className="mb-1 block text-sm font-semibold text-slate-700">Description</span>
            <textarea
              name="description"
              rows={4}
              value={formData.description}
              onChange={onFieldChange}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-brand-600"
              placeholder="Certificate context, project summary, specialization, or achievement notes."
            />
          </label>

          <label>
            <span className="mb-1 block text-sm font-semibold text-slate-700">Organization Logo Upload</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={(event) => setLogoFile(event.target.files?.[0] || null)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700"
            />
          </label>

          <label>
            <span className="mb-1 block text-sm font-semibold text-slate-700">Digital Signature Upload</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={(event) => setSignatureFile(event.target.files?.[0] || null)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700"
            />
          </label>

          {error && <p className="md:col-span-2 rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{error}</p>}

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={isSubmitDisabled}
              className="rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {loading ? 'Generating certificate...' : 'Issue Certificate'}
            </button>
          </div>
        </form>
      </section>

      {createdCertificate && (
        <section className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4">
          <p className="text-sm font-semibold text-emerald-700">Certificate issued successfully.</p>
          <p className="mt-1 text-sm text-emerald-800">
            ID: <strong>{createdCertificate.certificateId}</strong>
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <Link
              to={`/verify/${createdCertificate.certificateId}`}
              target="_blank"
              className="rounded-lg border border-emerald-400 px-3 py-2 text-sm font-semibold text-emerald-700"
            >
              Open Verification Page
            </Link>
            <Link to="/certificates" className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white">
              View All Certificates
            </Link>
          </div>
        </section>
      )}
    </div>
  )
}

export default CreateCertificatePage
