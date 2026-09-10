import { AnimatePresence, motion } from 'framer-motion'
import { useToastStore } from '../stores/toast'

const styles: Record<string, { dot: string; border: string }> = {
  success: { dot: 'bg-emerald-500', border: 'border-emerald-100 dark:border-emerald-500/20' },
  error: { dot: 'bg-red-500', border: 'border-red-100 dark:border-red-500/20' },
  info: { dot: 'bg-[#0071e3]', border: 'border-black/5 dark:border-white/[0.08]' },
}

export default function ToastHost() {
  const toasts = useToastStore((s) => s.toasts)
  const remove = useToastStore((s) => s.remove)

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.button
            key={t.id}
            type="button"
            onClick={() => remove(t.id)}
            initial={{ opacity: 0, y: -12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`pointer-events-auto flex items-center gap-2 px-4 py-2.5 rounded-full bg-white dark:bg-[#2c2c2e] dark:text-[#f5f5f7] shadow-lg border text-sm ${
              styles[t.type].border
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${styles[t.type].dot}`} />
            {t.text}
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  )
}
