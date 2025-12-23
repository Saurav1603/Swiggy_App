// This page is now merged into /admin/dashboard
import { useEffect } from 'react'
export default function AdminLogin() {
  useEffect(() => {
    window.location.replace('/admin/dashboard')
  }, [])
  return null
}
