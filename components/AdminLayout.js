import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';

const NAV_ITEMS = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/admin/orders', label: 'My Orders', icon: '📋' },
  { href: '/admin/settings', label: 'Settings', icon: '⚙️' },
];

export default function AdminLayout({ children, title, subtitle, showBack = false, isConnected, onLogout, adminName }) {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50/30">
      {/* Header */}
      <header className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-white/95 backdrop-blur-xl shadow-lg shadow-orange-500/5' 
          : 'bg-white/80 backdrop-blur-md'
      }`}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/admin/dashboard" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/25 group-hover:shadow-orange-500/40 transition-all group-hover:scale-105">
                <span className="text-lg">👨‍💼</span>
              </div>
              <div className="hidden sm:block">
                <span className="text-lg font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
                  Admin Panel
                </span>
              </div>
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {NAV_ITEMS.map((item) => {
                const isActive = router.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25'
                        : 'text-gray-600 hover:bg-orange-50 hover:text-orange-600'
                    }`}
                  >
                    <span>{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            
            {/* Right Section */}
            <div className="flex items-center gap-3">
              {/* Connection Status */}
              {typeof isConnected === 'boolean' && (
                <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                  isConnected 
                    ? 'bg-green-50 text-green-700 border border-green-200' 
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                  {isConnected ? 'Live' : 'Offline'}
                </div>
              )}
              
              {/* Admin Avatar */}
              {adminName && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-orange-50 rounded-xl">
                  <div className="w-7 h-7 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                    {adminName.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-gray-700 max-w-24 truncate">{adminName}</span>
                </div>
              )}
              
              {/* Logout */}
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                >
                  Logout
                </button>
              )}
              
              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-orange-50 text-orange-600"
              >
                {mobileMenuOpen ? '✕' : '☰'}
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-orange-100 bg-white/95 backdrop-blur-xl">
            <nav className="p-4 space-y-2">
              {NAV_ITEMS.map((item) => {
                const isActive = router.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white'
                        : 'text-gray-600 hover:bg-orange-50'
                    }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6 md:py-8">
        {/* Page Header */}
        {(title || showBack) && (
          <div className="flex items-start justify-between mb-8">
            <div>
              {showBack && (
                <button
                  onClick={() => router.back()}
                  className="flex items-center gap-2 text-gray-500 hover:text-orange-600 text-sm font-medium mb-2 transition-colors"
                >
                  ← Back
                </button>
              )}
              {title && (
                <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">{title}</h1>
              )}
              {subtitle && (
                <p className="text-gray-500 mt-1">{subtitle}</p>
              )}
            </div>
          </div>
        )}
        
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-orange-100 mt-auto">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center text-sm text-gray-400">
          <p>Admin Panel • Swiggy Concierge</p>
        </div>
      </footer>
    </div>
  );
}
