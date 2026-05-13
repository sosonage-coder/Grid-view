import { Link } from 'react-router-dom'

export function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center py-20">
      <p className="text-6xl font-bold text-slate-700 font-mono">404</p>
      <h1 className="text-xl font-semibold text-slate-300 mt-3">Page not found</h1>
      <p className="text-slate-500 mt-2 max-w-sm">This page doesn't exist or you don't have permission to view it.</p>
      <Link
        to="/"
        className="mt-6 inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-500 transition-colors"
      >
        Return to Dashboard
      </Link>
    </div>
  )
}
