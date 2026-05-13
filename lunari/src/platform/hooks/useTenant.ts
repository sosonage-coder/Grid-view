import { useState, useEffect } from 'react'
import type { Tenant } from '../types/core'
import { AuthService } from '../services/auth.service'

export function useTenant(): { tenant: Tenant; loading: boolean } {
  const [tenant, setTenant] = useState<Tenant>(AuthService.getCurrentTenant())
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    try {
      setTenant(AuthService.getCurrentTenant())
    } finally {
      setLoading(false)
    }
  }, [])

  return { tenant, loading }
}
