import { useState, useCallback } from 'react'
import type { Entity } from '../types/core'
import { AuthService, MOCK_ENTITIES } from '../services/auth.service'

export function useEntity(): {
  currentEntity: Entity
  entities: Entity[]
  switchEntity: (entityId: string) => void
} {
  const [currentEntity, setCurrentEntity] = useState<Entity>(AuthService.getCurrentEntity())
  const [entities] = useState<Entity[]>(MOCK_ENTITIES)

  const switchEntity = useCallback((entityId: string) => {
    AuthService.setCurrentEntity(entityId)
    setCurrentEntity(AuthService.getCurrentEntity())
  }, [])

  return { currentEntity, entities, switchEntity }
}
