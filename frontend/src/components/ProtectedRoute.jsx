import PropTypes from 'prop-types'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from './LoadingSpinner'

const ProtectedRoute = ({ children, roles = null }) => {
  const location = useLocation()
  const { isAuthenticated, loading, user } = useAuth()

  if (loading) {
    return <LoadingSpinner label="Checking session..." />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (roles && roles.length > 0) {
    const userRole = user?.role || ''
    const hasRole = roles.includes(userRole)
    if (!hasRole) {
      return <Navigate to="/dashboard" replace />
    }
  }

  return children
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  roles: PropTypes.arrayOf(PropTypes.string),
}

export default ProtectedRoute
