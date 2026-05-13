import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, Eye, EyeOff } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { AuthService } from '../platform/services/auth.service'

export function Login() {
  const [email, setEmail] = useState('controller@acme.com')
  const [password, setPassword] = useState('demo')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await AuthService.login(email, password)
      navigate('/')
    } catch {
      setError('Invalid credentials. Try controller@acme.com')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-100">Lunari</p>
              <p className="text-xs text-slate-500">AI-Native Finance OS</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h1 className="text-lg font-semibold text-slate-100 mb-1">Sign in</h1>
          <p className="text-sm text-slate-400 mb-5">Access your finance workspace</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Email</label>
              <input
                type="email"
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 pr-10 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  onClick={() => setShowPw((s) => !s)}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <Button type="submit" variant="primary" className="w-full" loading={loading}>
              Sign in
            </Button>
          </form>

          <div className="mt-4 pt-4 border-t border-slate-700">
            <p className="text-xs text-slate-500 mb-2 font-medium">Demo accounts:</p>
            {[
              { email: 'controller@acme.com', role: 'Finance Controller' },
              { email: 'manager@acme.com', role: 'Finance Manager' },
              { email: 'accountant@acme.com', role: 'Accountant' },
            ].map((a) => (
              <button
                key={a.email}
                className="w-full text-left px-2 py-1 text-xs hover:bg-slate-700 rounded transition-colors"
                onClick={() => setEmail(a.email)}
              >
                <span className="text-blue-400">{a.email}</span>
                <span className="text-slate-500 ml-2">— {a.role}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
