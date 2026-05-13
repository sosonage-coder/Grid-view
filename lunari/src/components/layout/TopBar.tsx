import { Bell, Settings, LogOut, User, ChevronDown } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { EntitySwitcher } from './EntitySwitcher'
import { PeriodBadge } from '../ui/PeriodBadge'
import { usePeriodLock } from '../../platform/hooks/usePeriodLock'
import { useCurrentUser } from '../../platform/hooks/useCurrentUser'

export function TopBar() {
  const { user } = useCurrentUser()
  const { period } = usePeriodLock()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setUserMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <header className="h-14 bg-slate-900 border-b border-slate-700/80 flex items-center justify-between px-4 gap-4 flex-shrink-0">
      <div className="flex items-center gap-4">
        <EntitySwitcher />
        <PeriodBadge period={period} />
      </div>

      <div className="flex items-center gap-2">
        <button className="relative p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded-lg transition-colors">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 bg-blue-500 rounded-full" />
        </button>

        <div className="relative" ref={ref}>
          <button
            className="flex items-center gap-2 p-1.5 pl-3 rounded-lg hover:bg-slate-700 transition-colors"
            onClick={() => setUserMenuOpen((o) => !o)}
          >
            <div className="h-7 w-7 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
              {user.name.charAt(0)}
            </div>
            <div className="text-left hidden md:block">
              <p className="text-sm font-medium text-slate-200 leading-none">{user.name}</p>
              <p className="text-xs text-slate-500 capitalize mt-0.5">{user.role.replace(/_/g, ' ')}</p>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
          </button>

          {userMenuOpen && (
            <div className="absolute top-full mt-1 right-0 w-56 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 py-1">
              <div className="px-3 py-2 border-b border-slate-700">
                <p className="text-sm font-medium text-slate-200">{user.name}</p>
                <p className="text-xs text-slate-400">{user.email}</p>
                <p className="text-xs text-slate-500 capitalize mt-0.5">{user.role.replace(/_/g, ' ')}</p>
              </div>
              <button className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors">
                <User className="h-4 w-4 text-slate-400" />
                Profile Settings
              </button>
              <button className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors">
                <Settings className="h-4 w-4 text-slate-400" />
                System Settings
              </button>
              <div className="border-t border-slate-700 my-1" />
              <button className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-400 hover:bg-slate-700 transition-colors">
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
