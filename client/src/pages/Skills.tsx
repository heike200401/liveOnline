import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, errMsg } from '../api/client'
import { toast } from '../stores/toast'
import { dayjs } from '../utils/date'
import type { Skill } from '../types'
import ProgressBar from '../components/ProgressBar'
import SkillFormModal from '../components/SkillFormModal'

const SORTS = [
  { value: 'created', label: '创建时间' },
  { value: 'hours', label: '累计小时' },
  { value: 'recent', label: '最近学习' },
] as const

type SortValue = (typeof SORTS)[number]['value']

export default function Skills() {
  const [skills, setSkills] = useState<Skill[]>([])
  const [sort, setSort] = useState<SortValue>('created')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort])

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get<Skill[]>('/skills', { params: { sort } })
      setSkills(data)
    } catch (e) {
      toast.error(errMsg(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold">技能树</h1>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex bg-black/[0.05] dark:bg-white/[0.08] rounded-full p-1 text-sm">
            {SORTS.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setSort(s.value)}
                className={`px-3.5 py-1.5 rounded-full transition ${
                  sort === s.value
                    ? 'bg-white dark:bg-[#48484a] shadow-sm font-medium'
                    : 'text-[#6e6e73] dark:text-[#98989d] hover:text-[#1d1d1f] dark:hover:text-[#f5f5f7]'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="px-5 py-2 rounded-full bg-[#0071e3] text-white text-sm font-medium hover:bg-[#0077ed] dark:hover:bg-[#0a84ff] transition active:scale-[0.98]"
          >
            新建技能
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-[#86868b] dark:text-[#98989d] py-20 text-center">加载中…</p>
      ) : skills.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-[#86868b] dark:text-[#98989d] text-sm">还没有技能，点击右上角「新建技能」开始养成</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {skills.map((s) => (
            <div
              key={s.id}
              onClick={() => navigate(`/skills/${s.id}`)}
              className="bg-white dark:bg-[#2c2c2e] rounded-2xl border border-black/[0.04] dark:border-white/[0.08] shadow-sm p-5 cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                  <h3 className="font-semibold truncate">{s.name}</h3>
                </div>
                <span className="shrink-0 text-xs px-2.5 py-1 rounded-full bg-black/[0.05] dark:bg-white/[0.08] text-[#6e6e73] dark:text-[#98989d]">
                  {s.stage}
                </span>
              </div>
              {s.description && (
                <p className="text-sm text-[#6e6e73] dark:text-[#98989d] mt-2 line-clamp-2">{s.description}</p>
              )}
              <div className="mt-4 flex items-baseline justify-between">
                <span className="font-semibold">
                  {s.totalHours}
                  <span className="text-xs text-[#6e6e73] dark:text-[#98989d] font-normal ml-1">小时</span>
                </span>
                <span className="text-xs text-[#86868b] dark:text-[#98989d]">
                  {s.lastStudyDate
                    ? `最近学习 ${dayjs(s.lastStudyDate).format('MM月DD日')}`
                    : '尚未学习'}
                </span>
              </div>
              <div className="mt-2">
                <ProgressBar value={s.progress} />
              </div>
            </div>
          ))}
        </div>
      )}

      <SkillFormModal open={modalOpen} onClose={() => setModalOpen(false)} onSaved={load} />
    </div>
  )
}
