import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { api, errMsg } from '../api/client'
import { toast } from '../stores/toast'
import { dayjs } from '../utils/date'
import type { Skill, SkillStats } from '../types'
import ProgressBar from '../components/ProgressBar'
import SkillFormModal from '../components/SkillFormModal'
import Modal from '../components/Modal'

export default function SkillDetail() {
  const { id } = useParams<{ id: string }>()
  const [stats, setStats] = useState<SkillStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (id) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get<SkillStats>(`/stats/skill/${id}`)
      setStats(data)
    } catch (e) {
      toast.error(errMsg(e))
    } finally {
      setLoading(false)
    }
  }

  const remove = async () => {
    setDeleting(true)
    try {
      await api.delete(`/skills/${id}`)
      toast.success('技能已删除')
      navigate('/skills')
    } catch (e) {
      toast.error(errMsg(e))
      setDeleting(false)
    }
  }

  if (loading) return <p className="text-sm text-[#86868b] dark:text-[#98989d] py-20 text-center">加载中…</p>
  if (!stats) return <p className="text-sm text-[#86868b] dark:text-[#98989d] py-20 text-center">技能不存在</p>

  const trend = [...stats.trend].reverse()

  return (
    <div>
      <Link to="/skills" className="text-sm text-[#0071e3] dark:text-[#0a84ff] hover:underline">
        ← 返回技能树
      </Link>

      <div className="mt-4 bg-white dark:bg-[#2c2c2e] rounded-2xl border border-black/[0.04] dark:border-white/[0.08] shadow-sm p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="w-4 h-4 rounded-full" style={{ backgroundColor: stats.color }} />
            <div>
              <h1 className="text-3xl font-bold">{stats.name}</h1>
              {stats.description && (
                <p className="text-sm text-[#6e6e73] dark:text-[#98989d] mt-1">{stats.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="px-4 py-2 rounded-full text-sm text-[#0071e3] dark:text-[#0a84ff] hover:bg-[#0071e3]/10 transition"
            >
              编辑
            </button>
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              className="px-4 py-2 rounded-full text-sm text-red-500 hover:bg-red-500/10 transition"
            >
              删除
            </button>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div>
            <p className="text-xs text-[#86868b] dark:text-[#98989d]">阶段</p>
            <p className="text-lg font-semibold mt-1">{stats.stage}</p>
          </div>
          <div>
            <p className="text-xs text-[#86868b] dark:text-[#98989d]">累计时长</p>
            <p className="text-lg font-semibold mt-1">
              {stats.totalHours}
              <span className="text-xs text-[#6e6e73] dark:text-[#98989d] font-normal ml-1">小时</span>
            </p>
          </div>
          <div>
            <p className="text-xs text-[#86868b] dark:text-[#98989d]">阶段进度</p>
            <div className="mt-2.5">
              <ProgressBar value={stats.progress} />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-white dark:bg-[#2c2c2e] rounded-2xl border border-black/[0.04] dark:border-white/[0.08] shadow-sm p-6">
        <h2 className="font-semibold mb-4">学习趋势</h2>
        {trend.length === 0 ? (
          <p className="text-sm text-[#86868b] dark:text-[#98989d] py-12 text-center">暂无学习记录</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={trend} margin={{ top: 8, right: 16, bottom: 0, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(134,134,139,0.2)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: 'var(--chart-tick)' }}
                tickFormatter={(v: string) => dayjs(v).format('MM-DD')}
              />
              <YAxis tick={{ fontSize: 11, fill: 'var(--chart-tick)' }} width={48} />
              <Tooltip
                formatter={(v: number, name: string) => [`${v} 小时`, name === 'totalHours' ? '累计时长' : name]}
                labelFormatter={(v) => String(v)}
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
              <Line
                type="monotone"
                dataKey="totalHours"
                stroke="#0071e3"
                strokeWidth={2}
                dot={{ r: 2.5, fill: '#0071e3' }}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {trend.length > 0 && (
        <div className="mt-6 bg-white dark:bg-[#2c2c2e] rounded-2xl border border-black/[0.04] dark:border-white/[0.08] shadow-sm p-6">
          <h2 className="font-semibold mb-3">学习记录</h2>
          <div className="divide-y divide-black/[0.05] dark:divide-white/[0.08]">
            {trend.map((t) => (
              <div key={t.date} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-[#424245] dark:text-[#c7c7cc]">{dayjs(t.date).format('YYYY年MM月DD日')}</span>
                <span className="flex items-center gap-3">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-black/[0.05] dark:bg-white/[0.08] text-[#6e6e73] dark:text-[#98989d]">
                    {t.stage}
                  </span>
                  <span className="font-medium">+{t.hours}h</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <SkillFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={load}
        skill={stats as unknown as Skill}
      />

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="删除技能">
        <p className="text-sm text-[#424245] dark:text-[#c7c7cc]">
          确定删除技能「{stats.name}」吗？该技能的所有学习记录与累计时长将一并移除，此操作不可恢复。
        </p>
        <div className="flex justify-end gap-2 mt-6">
          <button
            type="button"
            onClick={() => setDeleteOpen(false)}
            className="px-4 py-2 rounded-full text-sm text-[#6e6e73] dark:text-[#98989d] hover:bg-black/5 dark:hover:bg-white/10 transition"
          >
            取消
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={remove}
            className="px-5 py-2 rounded-full bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
          >
            {deleting ? '删除中…' : '确认删除'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
