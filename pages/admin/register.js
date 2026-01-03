import Layout from '../../components/Layout'
import { useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { useRouter } from 'next/router'

export default function AdminRegister() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRegister = async (e) => {
    e.preventDefault()

    // Client-side validation
    if (!email || !name || !password || !confirmPassword) {
      toast.error('All fields required')
      return
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/admin/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, password }),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success('Admin registered successfully! Redirecting to login...')
        // Clear form
        setEmail('')
        setName('')
        setPassword('')
        setConfirmPassword('')
        // Redirect to login after 2 seconds
        setTimeout(() => router.push('/admin'), 2000)
      } else {
        console.error('Registration API error:', data)
        if (data.details && data.details.message) {
          toast.error(`Error: ${data.details.message}`)
        } else {
          toast.error(data.error || 'Registration failed')
        }
      }
    } catch (err) {
      console.error('Register error:', err)
      toast.error(`Network error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="max-w-md mx-auto mt-12 animate-fadeIn">
        <div className="card p-6">
          <h1 className="text-2xl font-bold mb-4 text-gray-900">Admin Register</h1>
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                placeholder="Your Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <input
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-field"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary"
            >
              {loading ? 'Registering...' : 'Register'}
            </button>
          </form>

          <div className="mt-4 text-center text-sm">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link href="/admin/login" className="text-orange-600 hover:text-orange-700 font-medium">
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  )
}
