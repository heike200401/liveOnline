import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api, errMsg } from '../api/client'
import { toast } from '../stores/toast'
import { dayjs } from '../utils/date'
import type { DailyRecord } from '../types'
import { TagChip } from '../components/TagChip'

export default function RecordDetail() {
  const { id } = useParams<{ id: string }>()
  const [record, setRecord] = useState<DailyRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    if (!id) return
    api
      .get<DailyRecord>(`/daily-records/${id}`)
      .then(({ data }) => setRecord(data))
      .catch((e) => toast.error(errMsg(e)))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <p className="text-sm text-[#86868b] dark:text-[#98989d] py-20 text-center">加载中…</p>
  if (!record) return <p className="text-sm text-[#86868b] dark:text-[#98989d] py-20 text-center">记录不存在</p>

  return (
    <div className="max-w-2xl mx-auto">
      <Link to="/records" className="text-sm text-[#0071e3] dark:text-[#0a84ff] hover:underline">
        ← 返回收获列表
      </Link>

      <div className="mt-4 bg-white dark:bg-[#2c2c2e] rounded-2xl border border-black/[0.04] dark:border-white/[0.08] shadow-sm p-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h1 className="text-2xl font-bold">
            {dayjs(record.recordDate).format('YYYY年MM月DD日 dddd')}
          </h1>
          <div className="flex items-center gap-2">
            {record.status === 'draft' && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-amber-100/70 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400">
                草稿
              </span>
            )}
            <button
              type="button"
              onClick={() => navigate('/checkin')}
              className="px-4 py-2 rounded-full bg-[#0071e3] text-white text-sm font-medium hover:bg-[#0077ed] dark:hover:bg-[#0a84ff] transition active:scale-[0.98]"
            >
              编辑
            </button>
          </div>
        </div>

        {record.skills.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {record.skills.map((s) => (
              <span
                key={s.skillId}
                className="inline-flex items-center gap-1.5 text-sm px-3 py-1 rounded-full bg-black/[0.04] dark:bg-white/[0.08]"
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                {s.name}
                <span className="text-[#6e6e73] dark:text-[#98989d]">{s.hours}h</span>
              </span>
            ))}
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-[#0071e3]/10 text-[#0071e3] dark:text-[#0a84ff] font-medium">
              共 {record.totalHours} 小时
            </span>
          </div>
        )}

        <p className="text-sm text-[#424245] dark:text-[#c7c7cc] whitespace-pre-wrap break-words leading-relaxed mt-5">
          {record.textContent}
        </p>

        {record.images.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mt-5">
            {record.images.map((img) => (
              <a key={img.id} href={img.url} target="_blank" rel="noreferrer">
                <img
                  src={img.url}
                  alt=""
                  loading="lazy"
                  className="aspect-square w-full object-cover rounded-xl bg-black/[0.03] hover:opacity-90 transition"
                />
              </a>
            ))}
          </div>
        )}

        {record.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-5">
            {record.tags.map((t) => (
              <TagChip key={t.id} tag={t} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
