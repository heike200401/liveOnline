import { useEffect, useState } from 'react'
import { api, errMsg } from '../api/client'
import { toast } from '../stores/toast'
import { dayjs } from '../utils/date'
import type {
  RecordsViewResponse,
  Skill,
  Tag,
} from '../types'
import RecordCard from '../components/RecordCard'

type ViewMode = 'day' | 'week' | 'month'

const VIEW_TABS = [
  { value: 'day', label: '日' },
  { value: 'week', label: '周' },
  { value: 'month', label: '月' },
] as const

function SkillBreakdown({ breakdown, colorMap }: { breakdown: Record<string, number>; colorMap: Record<string, string> }) {
  const entries = Object.entries(breakdown).sort((a, b) => b[1] - a[1])
  if (entries.length === 0) {
    return <p className="text-sm text-[#86868b] dark:text-[#98989d]">暂无技能时长数据</p>
  }
  const max = Math.max(...entries.map(([, h]) => h))
  return (
    <div className="space-y-2.5">
      {entries.map(([name, hours]) => (
        <div key={name}>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colorMap[name] ?? '#8e8e93' }} />
              {name}
            </span>
            <span className="text-[#6e6e73] dark:text-[#98989d]">{hours}h</span>
          </div>
          <div className="h-1.5 rounded-full bg-black/[0.06] dark:bg-white/[0.1] overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${(hours / max) * 100}%`,
                backgroundColor: colorMap[name] ?? '#8e8e93',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function MonthCalendar({ month, calendar }: { month: string; calendar: Record<string, number> }) {
  const first = dayjs(`${month}-01`)
  const daysInMonth = first.daysInMonth()
  const offset = (first.day() + 6) % 7
  const max = Math.max(...Object.values(calendar), 1)
  const cells: (number | null)[] = [
    ...Array<null>(offset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  return (
    <div>
      <div className="grid grid-cols-7 gap-1.5 text-center text-xs text-[#86868b] dark:text-[#98989d] mb-1.5">
        {['一', '二', '三', '四', '五', '六', '日'].map((w) => (
          <div key={w}>{w}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((d, i) => {
          if (d === null) return <div key={i} />
          const key = `${month}-${String(d).padStart(2, '0')}`
          const h = calendar[key] ?? 0
          const ratio = h / max
          return (
            <div
              key={i}
              title={h > 0 ? `${key}：${h} 小时` : key}
              className="aspect-square rounded-lg flex flex-col items-center justify-center text-xs"
              style={{
                backgroundColor: h > 0 ? `rgba(0,113,227,${0.15 + 0.85 * ratio})` : 'var(--heatmap-empty-bg)',
                color: h > 0 ? (ratio > 0.55 ? '#fff' : 'var(--heatmap-low-text)') : '#c7c7cc',
              }}
            >
              <span className={h > 0 ? 'font-medium' : ''}>{d}</span>
              {h > 0 && <span className="text-[10px] leading-tight">{h}h</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function Records() {
  const [view, setView] = useState<ViewMode>('day')
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [tags, setTags] = useState<Tag[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [data, setData] = useState<RecordsViewResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [colorMap, setColorMap] = useState<Record<string, string>>({})

  useEffect(() => {
    api
      .get<Tag[]>('/tags')
      .then(({ data }) => setTags(data))
      .catch(() => {})
    api
      .get<Skill[]>('/skills')
      .then(({ data }) => {
        const m: Record<string, string> = {}
        for (const s of data) m[s.name] = s.color
        setColorMap(m)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, date, selectedTags])

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get<RecordsViewResponse>('/daily-records', {
        params: {
          view,
          date,
          ...(selectedTags.length > 0 ? { tag_id: selectedTags.join(',') } : {}),
        },
      })
      setData(data)
    } catch (e) {
      toast.error(errMsg(e))
    } finally {
      setLoading(false)
    }
  }

  const shift = (dir: number) => {
    const d = dayjs(date)
    if (view === 'day') setDate(d.add(dir, 'day').format('YYYY-MM-DD'))
    else if (view === 'week') setDate(d.add(dir * 7, 'day').format('YYYY-MM-DD'))
    else setDate(d.add(dir, 'month').format('YYYY-MM-DD'))
  }

  const toggleTag = (id: string) => {
    setSelectedTags((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]))
  }

  const headerLabel = data
    ? data.view === 'day'
      ? dayjs(data.date).format('YYYY年MM月DD日 dddd')
      : data.view === 'week'
        ? `${data.weekStart} ~ ${data.weekEnd}`
        : `${data.month.slice(0, 4)}年${Number(data.month.slice(5, 7))}月`
    : ''

  const records = data?.records ?? []

  return (
    <div>
      <div className="flex items-center justify-between gap-4 flex-wrap mb-5">
        <h1 className="text-3xl font-bold">收获</h1>
        <div className="flex items-center gap-2">
          <div className="flex bg-black/[0.05] dark:bg-white/[0.08] rounded-full p-1 text-sm">
            {VIEW_TABS.map((v) => (
              <button
                key={v.value}
                type="button"
                onClick={() => setView(v.value)}
                className={`px-4 py-1.5 rounded-full transition ${
                  view === v.value
                    ? 'bg-white dark:bg-[#48484a] shadow-sm font-medium'
                    : 'text-[#6e6e73] dark:text-[#98989d] hover:text-[#1d1d1f] dark:hover:text-[#f5f5f7]'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 mb-5">
        <button
          type="button"
          onClick={() => shift(-1)}
          className="w-8 h-8 rounded-full bg-white dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] text-[#6e6e73] dark:text-[#98989d] hover:text-[#1d1d1f] dark:hover:text-[#f5f5f7] transition"
        >
          ‹
        </button>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">{headerLabel}</span>
          <button
            type="button"
            onClick={() => setDate(dayjs().format('YYYY-MM-DD'))}
            className="px-3 py-1 rounded-full text-xs bg-white dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] text-[#0071e3] dark:text-[#0a84ff] hover:bg-[#0071e3]/5 dark:hover:bg-[#0a84ff]/10 transition"
          >
            今天
          </button>
        </div>
        <button
          type="button"
          onClick={() => shift(1)}
          className="w-8 h-8 rounded-full bg-white dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] text-[#6e6e73] dark:text-[#98989d] hover:text-[#1d1d1f] dark:hover:text-[#f5f5f7] transition"
        >
          ›
        </button>
      </div>

      {tags.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
          {tags.map((t) => {
            const active = selectedTags.includes(t.id)
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => toggleTag(t.id)}
                className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm border transition ${
                  active
                    ? 'text-white border-transparent'
                    : 'bg-white dark:bg-white/[0.06] text-[#424245] dark:text-[#c7c7cc] border-black/[0.08] dark:border-white/[0.1] hover:border-black/20 dark:hover:border-white/25'
                }`}
                style={active ? { backgroundColor: t.color } : undefined}
              >
                {t.name}
              </button>
            )
          })}
          {selectedTags.length > 0 && (
            <button
              type="button"
              onClick={() => setSelectedTags([])}
              className="shrink-0 px-3.5 py-1.5 rounded-full text-sm text-[#86868b] dark:text-[#98989d] hover:text-[#1d1d1f] dark:hover:text-[#f5f5f7] transition"
            >
              清除筛选
            </button>
          )}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-[#86868b] dark:text-[#98989d] py-20 text-center">加载中…</p>
      ) : (
        <div className="space-y-5">
          {data?.view === 'week' && (
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-[#2c2c2e] rounded-2xl border border-black/[0.04] dark:border-white/[0.08] shadow-sm p-5">
                <p className="text-xs text-[#86868b] dark:text-[#98989d]">打卡天数</p>
                <p className="text-2xl font-semibold mt-1">{data.checkinDays} 天</p>
              </div>
              <div className="bg-white dark:bg-[#2c2c2e] rounded-2xl border border-black/[0.04] dark:border-white/[0.08] shadow-sm p-5">
                <p className="text-xs text-[#86868b] dark:text-[#98989d]">总学习时长</p>
                <p className="text-2xl font-semibold mt-1">{data.totalHours} 小时</p>
              </div>
              <div className="bg-white dark:bg-[#2c2c2e] rounded-2xl border border-black/[0.04] dark:border-white/[0.08] shadow-sm p-5">
                <p className="text-xs text-[#86868b] dark:text-[#98989d] mb-3">技能时长分布</p>
                <SkillBreakdown breakdown={data.skillBreakdown} colorMap={colorMap} />
              </div>
            </div>
          )}

          {data?.view === 'month' && (
            <>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-[#2c2c2e] rounded-2xl border border-black/[0.04] dark:border-white/[0.08] shadow-sm p-5">
                  <p className="text-xs text-[#86868b] dark:text-[#98989d]">打卡天数</p>
                  <p className="text-2xl font-semibold mt-1">{data.checkinDays} 天</p>
                </div>
                <div className="bg-white dark:bg-[#2c2c2e] rounded-2xl border border-black/[0.04] dark:border-white/[0.08] shadow-sm p-5">
                  <p className="text-xs text-[#86868b] dark:text-[#98989d]">总学习时长</p>
                  <p className="text-2xl font-semibold mt-1">{data.totalHours} 小时</p>
                </div>
                <div className="bg-white dark:bg-[#2c2c2e] rounded-2xl border border-black/[0.04] dark:border-white/[0.08] shadow-sm p-5">
                  <p className="text-xs text-[#86868b] dark:text-[#98989d] mb-3">技能时长分布</p>
                  <SkillBreakdown breakdown={data.skillBreakdown} colorMap={colorMap} />
                </div>
              </div>
              <div className="bg-white dark:bg-[#2c2c2e] rounded-2xl border border-black/[0.04] dark:border-white/[0.08] shadow-sm p-5">
                <p className="text-sm font-medium mb-4">学习热力</p>
                <MonthCalendar month={data.month} calendar={data.calendar} />
              </div>
            </>
          )}

          {records.length === 0 ? (
            <p className="text-sm text-[#86868b] dark:text-[#98989d] py-16 text-center">该时段暂无打卡记录</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-5">
              {records.map((r) => (
                <RecordCard key={r.id} record={r} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
