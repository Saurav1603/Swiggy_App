import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'

export default function Layout({ children }) {
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const isHome = router.pathname === '/'
  const isCreate = router.pathname === '/create'
  const isStatus = router.pathname.startsWith('/status')

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-orange-50/50 via-white to-orange-50/30">
      {/* Header */}
      <header className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-white/95 backdrop-blur-xl shadow-lg shadow-orange-500/5' 
          : 'bg-white/80 backdrop-blur-md'
      }`}>
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/25 group-hover:shadow-orange-500/40 transition-shadow">
                <span className="text-xl">🍔</span>
              </div>
              <div className="hidden sm:block">
                <span className="text-xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
                  Swiggy Concierge
                </span>
                <span className="hidden md:inline text-xs text-gray-400 ml-2">• Order Made Easy</span>
              </div>
            </Link>
            
            {/* Navigation */}
            <nav className="flex items-center gap-2">
              {!isHome && (
                <Link 
                  href="/" 
                  className="px-4 py-2 text-gray-600 hover:text-orange-600 font-medium rounded-xl hover:bg-orange-50 transition-all"
                >
                  Home
                </Link>
              )}
              {!isCreate && !isStatus && (
                <Link 
                  href="/create" 
                  className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-105 transition-all"
                >
                  🛒 Order Now
                </Link>
              )}
              {isStatus && (
                <Link 
                  href="/create" 
                  className="px-4 py-2 text-gray-600 hover:text-orange-600 font-medium rounded-xl hover:bg-orange-50 transition-all"
                >
                  + New Order
                </Link>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6 md:py-10">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-t from-orange-50 to-transparent border-t border-orange-100">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Brand */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center">
                <span className="text-sm">🍔</span>
              </div>
              <span className="font-semibold text-gray-700">Swiggy Concierge</span>
            </div>
            
            {/* Links */}
            <div className="flex items-center gap-6 text-sm">
              <Link href="/" className="text-gray-500 hover:text-orange-600 transition-colors">Home</Link>
              <Link href="/create" className="text-gray-500 hover:text-orange-600 transition-colors">Create Order</Link>
            </div>
            
            {/* Copyright */}
            <div className="text-center md:text-right">
              <p className="text-sm text-gray-500">© {new Date().getFullYear()} Swiggy Concierge</p>
              <p className="text-xs text-gray-400 mt-0.5">Manual proxy ordering service</p>
            </div>
          </div>
          
          {/* Trust Badge */}
          <div className="mt-6 pt-6 border-t border-orange-100 flex flex-wrap items-center justify-center gap-6 text-xs text-gray-400">
            <span className="flex items-center gap-1.5"><span className="text-green-500">✓</span> Secure Payments</span>
            <span className="flex items-center gap-1.5"><span className="text-green-500">✓</span> Human Support</span>
            <span className="flex items-center gap-1.5"><span className="text-green-500">✓</span> No Hidden Fees</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
