export const normalizeStatus = (status) => {
  if (!status) {
    return 'active'
  }

  const normalized = String(status).toLowerCase()
  if (['active', 'revoked', 'expired'].includes(normalized)) {
    return normalized
  }

  return 'active'
}

export const getStatusTheme = (status) => {
  switch (normalizeStatus(status)) {
    case 'revoked':
      return 'bg-rose-100 text-rose-700'
    case 'expired':
      return 'bg-amber-100 text-amber-700'
    case 'active':
    default:
      return 'bg-emerald-100 text-emerald-700'
  }
}
