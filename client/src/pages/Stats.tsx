import { useEffect, useState } from 'react'
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { api, errMsg } from '../api/client'
import { toast } from '../stores/toast'
import { dayjs } from '../utils/date'
import type { OverviewStats, PeriodStats, Skill } from '../types'

const PALETTE = ['#0071e3', '#34c759', '#ff9500', '#af52de', '#ff2d55', '#00c7be', '#ffcc00', '#8e8e93']

function StatCard({ label, value, suffix }: { label: string; value: number | string; suffix?: string }) {
  return (
    <div className="bg-white dark:bg-[#2c2c2e] rounded-2xl border border-black/[0.04] dark:border-white/[0.08] shadow-sm p-5">
      <p className="text-xs text-[#86868b] dark:text-[#98989d]">{label}</p>
      <p className="text-2xl font-semibold mt-1.5">
        {value}
        {suffix && <span className="text-xs text-[#6e6e73] dark:text-[#98989d] font-normal ml-1">{suffix}</span>}
      </p>
    </div>
  )
}

function PeriodPie({ stats, colorMap }: { stats: PeriodStats; colorMap: Record<string, string> }) {
  let fallback = 0
  const pieData = Object.entries(stats.skillBreakdown)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({
      name,
      value,
      color: colorMap[name] ?? PALETTE[fallback++ % PALETTE.length],
    }))

  const title = stats.period === 'week' ? '本周' : '本月'

  return (
    <div className="bg-white dark:bg-[#2c2c2e] rounded-2xl border border-black/[0.04] dark:border-white/[0.08] shadow-sm p-6">
      <div className="flex items-baseline justify-between">
        <h2 className="font-semibold">{title}概览</h2>
        <span className="text-xs text-[#86868b] dark:text-[#98989d]">
          {stats.startDate} ~ {stats.endDate}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div>
          <p className="text-xs text-[#86868b] dark:text-[#98989d]">总学习时长</p>
          <p className="text-xl font-semibold mt-1">{stats.totalHours} 小时</p>
        </div>
        <div>
          <p className="text-xs text-[#86868b] dark:text-[#98989d]">打卡天数</p>
          <p className="text-xl font-semibold mt-1">{stats.checkinDays} 天</p>
        </div>
      </div>
      <div className="mt-4">
        {pieData.length === 0 ? (
          <p className="text-sm text-[#86868b] dark:text-[#98989d] py-10 text-center">{title}暂无学习数据</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                strokeWidth={0}
              >
                {pieData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v: number, name: string) => [`${v} 小时`, name]}
                contentStyle={{
                  borderRadius: 12,
                  border: '1px solid var(--tooltip-border)',
                  backgroundColor: 'var(--tooltip-bg)',
                  color: 'var(--tooltip-text)',
                  fontSize: 12,
                }}
                itemStyle={{ color: 'var(--tooltip-text)' }}
                labelStyle={{ color: 'var(--tooltip-text)' }}
              />
              <Legend
                iconType="circle"
                wrapperStyle={{ fontSize: 12, color: 'var(--chart-tick)' }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

export default function Stats() {
  const [overview, setOverview] = useState<OverviewStats | null>(null)
  const [weekStats, setWeekStats] = useState<PeriodStats | null>(null)
  const [monthStats, setMonthStats] = useState<PeriodStats | null>(null)
  const [colorMap, setColorMap] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get<OverviewStats>('/stats/overview'),
      api.get<PeriodStats>('/daily-records/stats', { params: { period: 'week' } }),
      api.get<PeriodStats>('/daily-records/stats', { params: { period: 'month' } }),
      api.get<Skill[]>('/skills'),
    ])
      .then(([o, w, m, s]) => {
        setOverview(o.data)
        setWeekStats(w.data)
        setMonthStats(m.data)
        const map: Record<string, string> = {}
        for (const skill of s.data) map[skill.name] = skill.color
        setColorMap(map)
      })
      .catch((e) => toast.error(errMsg(e)))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-sm text-[#86868b] dark:text-[#98989d] py-20 text-center">加载中…</p>

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">统计概览</h1>

      {overview && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard label="技能数" value={overview.skillCount} suffix="个" />
          <StatCard label="总学习时长" value={overview.totalHours} suffix="小时" />
          <StatCard label="打卡天数" value={overview.checkinDays} suffix="天" />
          <StatCard label="记录数" value={overview.totalRecords} suffix="条" />
          <StatCard label="标签数" value={overview.tagsCount} suffix="个" />
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-5 mt-6">
        {weekStats && <PeriodPie stats={weekStats} colorMap={colorMap} />}
        {monthStats && <PeriodPie stats={monthStats} colorMap={colorMap} />}
      </div>

      <p className="text-xs text-[#86868b] dark:text-[#98989d] mt-6 text-center">
        数据更新于 {dayjs().format('YYYY-MM-DD HH:mm')}
      </p>
    </div>
  )
}
