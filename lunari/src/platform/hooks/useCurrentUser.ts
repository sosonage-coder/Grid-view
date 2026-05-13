import { useState } from 'react'
import type { User } from '../types/core'
import { AuthService } from '../services/auth.service'
import { hasPermission } from '../types/permissions'
import type { Permission } from '../types/permissions'

export function useCurrentUser(): {
  user: User
  can: (permission: Permission) => boolean
} {
  const [user] = useState<User>(AuthService.getCurrentUser())

  const can = (permission: Permission): boolean => hasPermission(user.role, permission)

  return { user, can }
}
