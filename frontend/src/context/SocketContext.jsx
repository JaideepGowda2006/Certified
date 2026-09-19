import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import { io } from 'socket.io-client'
import { API_BASE_URL } from '../api/client'

const SocketContext = createContext(null)

const getSocketServerUrl = () => {
  if (!API_BASE_URL) {
    return window.location.origin
  }

  // If API_BASE_URL is like 'http://localhost:5000/api' or 'https://api.domain.com/api'
  // the socket server runs at 'http://localhost:5000' or 'https://api.domain.com'
  return API_BASE_URL.replace(/\/api\/?$/, '')
}

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [notifications, setNotifications] = useState([])

  const addNotification = (item) => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newNotification = {
      id,
      timestamp: new Date(),
      ...item,
    }

    setNotifications((prev) => [newNotification, ...prev].slice(0, 8))

    // Auto dismiss after 6 seconds
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    }, 6000)
  }

  const dismissNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  useEffect(() => {
    const socketUrl = getSocketServerUrl()
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 8,
      reconnectionDelay: 1500,
    })

    newSocket.on('connect', () => {
      setIsConnected(true)
    })

    newSocket.on('disconnect', () => {
      setIsConnected(false)
    })

    newSocket.on('certificate:created', (certificate) => {
      addNotification({
        type: 'created',
        title: 'New Certificate Issued',
        message: `${certificate.certificateTitle || 'Certificate'} was issued for ${certificate.candidateName || 'candidate'}.`,
        certificateId: certificate.certificateId,
      })
    })

    newSocket.on('certificate:updated', (certificate) => {
      addNotification({
        type: 'updated',
        title: 'Certificate Updated',
        message: `${certificate.certificateTitle || certificate.certificateId} was updated.`,
        certificateId: certificate.certificateId,
      })
    })

    newSocket.on('certificate:revoked', (certificate) => {
      const reasonText = certificate.revocationReason ? ` Reason: "${certificate.revocationReason}"` : ''
      addNotification({
        type: 'revoked',
        title: 'Certificate Revoked',
        message: `Certificate ${certificate.certificateId} has been revoked.${reasonText}`,
        certificateId: certificate.certificateId,
      })
    })

    newSocket.on('certificate:unrevoked', (certificate) => {
      addNotification({
        type: 'created',
        title: 'Certificate Reinstated',
        message: `Certificate ${certificate.certificateId} revocation was removed and is now active!`,
        certificateId: certificate.certificateId,
      })
    })

    newSocket.on('certificate:deleted', ({ certificateId }) => {
      addNotification({
        type: 'deleted',
        title: 'Certificate Deleted',
        message: `Certificate ${certificateId} has been removed.`,
        certificateId,
      })
    })

    setSocket(newSocket)

    return () => {
      newSocket.disconnect()
    }
  }, [])

  const value = useMemo(
    () => ({
      socket,
      isConnected,
      notifications,
      dismissNotification,
    }),
    [socket, isConnected, notifications],
  )

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
}

SocketProvider.propTypes = {
  children: PropTypes.node.isRequired,
}

// eslint-disable-next-line react-refresh/only-export-components
export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}
