import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { dayjs } from '../utils/date'
import type { DailyRecord } from '../types'
import { TagChip } from './TagChip'

interface Props {
  record: DailyRecord
  clamp?: boolean
}

export default function RecordCard({ record, clamp = true }: Props) {
  const navigate = useNavigate()

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
      onClick={() => navigate(`/records/${record.id}`)}
      className="bg-white dark:bg-[#2c2c2e] rounded-2xl border border-black/[0.04] dark:border-white/[0.08] shadow-sm p-5 cursor-pointer hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">
          {dayjs(record.recordDate).format('YYYY年MM月DD日 dddd')}
        </span>
        {record.status === 'draft' && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100/70 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400">
            草稿
          </span>
        )}
      </div>
      <p
        className={`text-sm text-[#424245] dark:text-[#c7c7cc] whitespace-pre-wrap break-words ${
          clamp ? 'line-clamp-3' : ''
        }`}
      >
        {record.textContent}
      </p>
      {record.images.length > 0 && (
        <div className="grid grid-cols-3 gap-1.5 mt-3">
          {record.images.slice(0, 9).map((img) => (
            <img
              key={img.id}
              src={img.url}
              alt=""
              loading="lazy"
              className="aspect-square w-full object-cover rounded-lg bg-black/[0.03]"
            />
          ))}
        </div>
      )}
      {record.skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {record.skills.map((s) => (
            <span
              key={s.skillId}
              className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-black/[0.04] dark:bg-white/[0.08]"
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
              {s.name} · {s.hours}h
            </span>
          ))}
        </div>
      )}
      {record.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2.5">
          {record.tags.map((t) => (
            <TagChip key={t.id} tag={t} />
          ))}
        </div>
      )}
    </motion.div>
  )
}
