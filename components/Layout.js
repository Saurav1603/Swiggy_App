import Link from 'next/link'
import { useState } from 'react'

export default function Layout({ children }) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🍔</span>
            <span className="text-xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
              Swiggy Concierge
            </span>
          </Link>
          
          {/* No admin navigation for user/home pages */}
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6 md:py-10">
        {children}
      </main>

      <footer className="bg-white/50 backdrop-blur-sm border-t">
        <div className="max-w-5xl mx-auto px-4 py-6 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} Swiggy Concierge — Manual proxy ordering</p>
          <p className="mt-1 text-xs">We don't scrape or use Swiggy APIs. Orders are placed manually.</p>
        </div>
      </footer>
    </div>
  )
}
