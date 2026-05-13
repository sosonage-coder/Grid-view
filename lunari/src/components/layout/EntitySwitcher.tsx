import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Building2, Check } from 'lucide-react'
import clsx from 'clsx'
import { useEntity } from '../../platform/hooks/useEntity'

export function EntitySwitcher() {
  const { currentEntity, entities, switchEntity } = useEntity()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        className="flex items-center gap-2 bg-slate-700/60 hover:bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm transition-colors"
        onClick={() => setOpen((o) => !o)}
      >
        <Building2 className="h-4 w-4 text-slate-400" />
        <span className="text-slate-200 font-medium max-w-32 truncate">{currentEntity.name}</span>
        <span className="text-xs text-slate-500 font-mono">{currentEntity.currency}</span>
        <ChevronDown className={clsx('h-3.5 w-3.5 text-slate-400 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute top-full mt-1 right-0 w-64 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 py-1">
          <p className="px-3 py-1.5 text-xs font-medium text-slate-500 uppercase tracking-wider border-b border-slate-700 mb-1">
            Switch Entity
          </p>
          {entities.map((entity) => (
            <button
              key={entity.id}
              className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-slate-700 transition-colors"
              onClick={() => { switchEntity(entity.id); setOpen(false) }}
            >
              <div className="flex items-start gap-2 min-w-0">
                <Building2 className="h-4 w-4 text-slate-400 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-slate-200 truncate">{entity.name}</p>
                  <p className="text-xs text-slate-500 truncate">{entity.legalName}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                <span className="text-xs font-mono text-slate-400">{entity.currency}</span>
                {entity.id === currentEntity.id && (
                  <Check className="h-3.5 w-3.5 text-blue-400" />
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
