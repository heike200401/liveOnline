import { motion } from 'framer-motion'

export default function ProgressBar({ value }: { value: number }) {
  const pct = Math.min(100, Math.max(0, value * 100))
  return (
    <div className="h-2 rounded-full bg-black/[0.06] dark:bg-white/[0.1] overflow-hidden">
      <motion.div
        className="h-full rounded-full bg-gradient-to-r from-[#0071e3] to-[#5aa9f5]"
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />
    </div>
  )
}
