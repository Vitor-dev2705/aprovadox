import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from './Sidebar'
import Header from './Header'
import MobileNav from './MobileNav'

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  useEffect(() => { setMobileOpen(false) }, [location])

  const sidebarW = collapsed ? 76 : 260

  return (
    <div className="min-h-screen bg-dark-900 flex relative overflow-hidden">
      {/* ============ Background Decorations ============ */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Gradient blobs flutuantes */}
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-500/10 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{ x: [0, -25, 0], y: [0, 20, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-0 left-0 w-[450px] h-[450px] bg-accent-500/10 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{ x: [0, 15, 0], y: [0, -15, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/2 left-1/3 w-[300px] h-[300px] bg-purple-500/5 rounded-full blur-[100px]"
        />

        {/* Grid sutil */}
        <div
          className="absolute inset-0 opacity-[0.015] dark:opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* ============ Desktop sidebar ============ */}
      <div className="hidden lg:block flex-shrink-0 relative z-10" style={{ width: sidebarW }}>
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      </div>

      {/* ============ Mobile sidebar overlay ============ */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <div className="lg:hidden">
              <Sidebar collapsed={false} onToggle={() => setMobileOpen(false)} />
            </div>
          </>
        )}
      </AnimatePresence>

      {/* ============ Main content ============ */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        <Header sidebarCollapsed={collapsed} />
        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <MobileNav onMenuOpen={() => setMobileOpen(true)} />
    </div>
  )
}
