import PropTypes from 'prop-types'

const LoadingSpinner = ({ label = 'Loading...' }) => (
  <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 text-slate-600">
    <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-brand-600" />
    <p className="text-sm font-medium">{label}</p>
  </div>
)

LoadingSpinner.propTypes = {
  label: PropTypes.string,
}

export default LoadingSpinner
