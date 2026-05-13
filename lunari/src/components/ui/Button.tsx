import { forwardRef } from 'react'
import clsx from 'clsx'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'warning'
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-blue-600 hover:bg-blue-500 text-white border-blue-600 hover:border-blue-500 focus:ring-blue-500',
  secondary: 'bg-slate-700 hover:bg-slate-600 text-slate-100 border-slate-600 hover:border-slate-500 focus:ring-slate-500',
  ghost: 'bg-transparent hover:bg-slate-700 text-slate-300 border-transparent hover:border-slate-600 focus:ring-slate-500',
  danger: 'bg-red-600 hover:bg-red-500 text-white border-red-600 hover:border-red-500 focus:ring-red-500',
  success: 'bg-green-600 hover:bg-green-500 text-white border-green-600 hover:border-green-500 focus:ring-green-500',
  warning: 'bg-amber-500 hover:bg-amber-400 text-slate-900 border-amber-500 hover:border-amber-400 focus:ring-amber-400',
}

const sizeClasses: Record<ButtonSize, string> = {
  xs: 'px-2 py-1 text-xs gap-1',
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-5 py-2.5 text-base gap-2',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading = false, leftIcon, rightIcon, children, className, disabled, ...rest }, ref) => {
    return (
      <button
        ref={ref}
        className={clsx(
          'inline-flex items-center justify-center rounded border font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed',
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        disabled={disabled || loading}
        {...rest}
      >
        {loading ? (
          <span className="animate-spin h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full" />
        ) : leftIcon}
        {children}
        {!loading && rightIcon}
      </button>
    )
  },
)

Button.displayName = 'Button'
