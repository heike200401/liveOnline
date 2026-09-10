import { AnimatePresence, motion } from 'framer-motion'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/auth'
import { useTheme } from '../hooks/useTheme'
import { toast } from '../stores/toast'

const links = [
  { to: '/skills', label: '技能树' },
  { to: '/checkin', label: '每日打卡' },
  { to: '/records', label: '收获' },
  { to: '/tags', label: '标签' },
  { to: '/stats', label: '统计' },
]

function SunIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
    </svg>
  )
}

export default function AppLayout() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const { isDark, toggle } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-xl border-b border-black/[0.06] dark:bg-[#1d1d1f]/70 dark:border-white/[0.08]">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-5">
          <span className="text-lg font-bold tracking-tight shrink-0">技能树</span>
          <nav className="flex-1 flex items-center gap-1 overflow-x-auto">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `px-3.5 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-[#0071e3] text-white font-medium'
                      : 'text-[#424245] hover:bg-black/5 dark:text-[#c7c7cc] dark:hover:bg-white/10'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-3 text-sm shrink-0">
            <motion.button
              type="button"
              onClick={toggle}
              whileTap={{ scale: 0.88 }}
              aria-label={isDark ? '切换为浅色模式' : '切换为深色模式'}
              title={isDark ? '切换为浅色模式' : '切换为深色模式'}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[#6e6e73] hover:bg-black/5 dark:text-[#98989d] dark:hover:bg-white/10 transition-colors"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={isDark ? 'sun' : 'moon'}
                  initial={{ rotate: -70, opacity: 0, scale: 0.8 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: 70, opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  className="flex"
                >
                  {isDark ? <SunIcon /> : <MoonIcon />}
                </motion.span>
              </AnimatePresence>
            </motion.button>
            <span className="text-[#6e6e73] dark:text-[#98989d] hidden sm:inline">
              {user?.username}
            </span>
            <button
              type="button"
              className="text-[#0071e3] hover:underline"
              onClick={() => {
                logout()
                toast.info('已退出登录')
                navigate('/login')
              }}
            >
              退出登录
            </button>
          </div>
        </div>
      </header>
      <motion.main
        key={location.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="max-w-5xl mx-auto px-4 py-8"
      >
        <Outlet />
      </motion.main>
    </div>
  )
}
