import PropTypes from 'prop-types'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from './LoadingSpinner'

const ProtectedRoute = ({ children }) => {
  const location = useLocation()
  const { isAuthenticated, loading } = useAuth()
  const isDemoMode =
    (import.meta.env.DEV && import.meta.env.VITE_DEMO_MODE !== 'false') || import.meta.env.VITE_DEMO_MODE === 'true'

  if (isDemoMode) {
    return children
  }

  if (loading) {
    return <LoadingSpinner label="Checking session..." />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return children
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
}

export default ProtectedRoute
