import clsx from 'clsx'

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'muted'

interface BadgeProps {
  variant?: BadgeVariant
  size?: 'sm' | 'md'
  children: React.ReactNode
  className?: string
  dot?: boolean
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-slate-700 text-slate-300',
  primary: 'bg-blue-900/60 text-blue-300 ring-1 ring-blue-700/50',
  success: 'bg-green-900/60 text-green-300 ring-1 ring-green-700/50',
  warning: 'bg-amber-900/60 text-amber-300 ring-1 ring-amber-700/50',
  danger: 'bg-red-900/60 text-red-300 ring-1 ring-red-700/50',
  info: 'bg-cyan-900/60 text-cyan-300 ring-1 ring-cyan-700/50',
  muted: 'bg-slate-800 text-slate-500',
}

const dotClasses: Record<BadgeVariant, string> = {
  default: 'bg-slate-400',
  primary: 'bg-blue-400',
  success: 'bg-green-400',
  warning: 'bg-amber-400',
  danger: 'bg-red-400',
  info: 'bg-cyan-400',
  muted: 'bg-slate-600',
}

export function Badge({ variant = 'default', size = 'sm', children, className, dot = false }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-xs gap-1' : 'px-2.5 py-1 text-sm gap-1.5',
        variantClasses[variant],
        className,
      )}
    >
      {dot && <span className={clsx('h-1.5 w-1.5 rounded-full flex-shrink-0', dotClasses[variant])} />}
      {children}
    </span>
  )
}
