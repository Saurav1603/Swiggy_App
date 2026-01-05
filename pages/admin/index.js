import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

// Admin index - redirects based on authentication status
export default function AdminIndex() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const adminId = localStorage.getItem('adminId');
    
    if (token && adminId) {
      // User is logged in, go to dashboard
      router.replace('/admin/dashboard');
    } else {
      // User not logged in, go to login
      router.replace('/admin/login');
    }
    setChecking(false);
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-white">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return null;
}
