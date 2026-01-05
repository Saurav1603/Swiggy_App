import Link from 'next/link';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';

const NAV_ITEMS = [
  { href: '/manager', label: 'Dashboard', icon: '📊' },
  { href: '/manager/admins', label: 'Admins', icon: '👥' },
  { href: '/manager/requests', label: 'Requests', icon: '📋' },
  { href: '/manager/analytics', label: 'Analytics', icon: '📈' },
  { href: '/manager/settings', label: 'Settings', icon: '⚙️' },
];

export default function ManagerLayout({ children, title, subtitle }) {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('managerToken');
    toast.success('Logged out successfully');
    router.replace('/manager');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white/10 backdrop-blur-xl border-r border-white/10 z-50 hidden md:block">
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-pink-500 rounded-xl flex items-center justify-center">
              <span className="text-xl">👔</span>
            </div>
            <div>
              <h1 className="font-bold text-white text-lg">Manager</h1>
              <p className="text-white/60 text-xs">Control Panel</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {NAV_ITEMS.map((item) => {
            const isActive = router.pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-lg shadow-orange-500/25'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-white/70 hover:bg-red-500/20 hover:text-red-400 transition-all"
          >
            <span className="text-xl">🚪</span>
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white/10 backdrop-blur-xl border-b border-white/10 z-50 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-pink-500 rounded-lg flex items-center justify-center">
            <span className="text-sm">👔</span>
          </div>
          <span className="font-bold text-white">Manager</span>
        </div>
        <div className="flex gap-2">
          {NAV_ITEMS.map((item) => {
            const isActive = router.pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`w-10 h-10 flex items-center justify-center rounded-lg ${
                  isActive ? 'bg-orange-500' : 'bg-white/10'
                }`}
              >
                <span>{item.icon}</span>
              </Link>
            );
          })}
        </div>
      </header>

      {/* Main Content */}
      <main className="md:ml-64 min-h-screen pt-20 md:pt-0">
        <div className="p-6 md:p-8">
          {/* Page Header */}
          {title && (
            <div className="mb-8">
              <h1 className="text-2xl md:text-3xl font-bold text-white">{title}</h1>
              {subtitle && <p className="text-white/60 mt-1">{subtitle}</p>}
            </div>
          )}

          {/* Content */}
          {children}
        </div>
      </main>
    </div>
  );
}
