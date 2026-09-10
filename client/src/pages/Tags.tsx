import { useEffect, useState } from 'react'
import { api, errMsg } from '../api/client'
import { toast } from '../stores/toast'
import { dayjs } from '../utils/date'
import type { Tag } from '../types'
import Modal from '../components/Modal'
import ColorPicker from '../components/ColorPicker'

export default function Tags() {
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Tag | null>(null)
  const [name, setName] = useState('')
  const [color, setColor] = useState('#0071e3')
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Tag | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const load = async () => {
    try {
      const { data } = await api.get<Tag[]>('/tags')
      setTags(data)
    } catch (e) {
      toast.error(errMsg(e))
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setEditing(null)
    setName('')
    setColor('#0071e3')
    setFormOpen(true)
  }

  const openEdit = (t: Tag) => {
    setEditing(t)
    setName(t.name)
    setColor(t.color)
    setFormOpen(true)
  }

  const submit = async () => {
    if (!name.trim()) return toast.error('请输入标签名称')
    setSaving(true)
    try {
      if (editing) await api.put(`/tags/${editing.id}`, { name: name.trim(), color })
      else await api.post('/tags', { name: name.trim(), color })
      toast.success(editing ? '标签已更新' : '标签已创建')
      setFormOpen(false)
      await load()
    } catch (e) {
      toast.error(errMsg(e))
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.delete(`/tags/${deleteTarget.id}`)
      toast.success('标签已删除')
      setDeleteTarget(null)
      await load()
    } catch (e) {
      toast.error(errMsg(e))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">标签管理</h1>
        <button
          type="button"
          onClick={openCreate}
          className="px-5 py-2 rounded-full bg-[#0071e3] text-white text-sm font-medium hover:bg-[#0077ed] dark:hover:bg-[#0a84ff] transition active:scale-[0.98]"
        >
          新建标签
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-[#86868b] dark:text-[#98989d] py-20 text-center">加载中…</p>
      ) : tags.length === 0 ? (
        <p className="text-sm text-[#86868b] dark:text-[#98989d] py-20 text-center">还没有标签，点击右上角创建</p>
      ) : (
        <div className="bg-white dark:bg-[#2c2c2e] rounded-2xl border border-black/[0.04] dark:border-white/[0.08] shadow-sm divide-y divide-black/[0.05] dark:divide-white/[0.08]">
          {tags.map((t) => (
            <div key={t.id} className="flex items-center gap-3 px-5 py-3.5">
              <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
              <span className="text-sm font-medium flex-1 truncate">{t.name}</span>
              <span className="text-xs text-[#86868b] dark:text-[#98989d] hidden sm:inline">
                创建于 {dayjs(t.createdAt).format('YYYY-MM-DD')}
              </span>
              <button
                type="button"
                onClick={() => openEdit(t)}
                className="px-3 py-1.5 rounded-full text-xs text-[#0071e3] dark:text-[#0a84ff] hover:bg-[#0071e3]/10 transition"
              >
                重命名
              </button>
              <button
                type="button"
                onClick={() => setDeleteTarget(t)}
                className="px-3 py-1.5 rounded-full text-xs text-red-500 hover:bg-red-500/10 transition"
              >
                删除
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? '重命名标签' : '新建标签'}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#6e6e73] dark:text-[#98989d] mb-1.5">
              名称 <span className="text-red-500">*</span>
            </label>
            <input
              className="w-full px-4 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#1d1d1f] dark:text-[#f5f5f7] text-sm focus:outline-none focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/30 transition"
              value={name}
              maxLength={20}
              placeholder="例如：刷题、阅读"
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), submit())}
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#6e6e73] dark:text-[#98989d] mb-1.5">颜色</label>
            <ColorPicker value={color} onChange={setColor} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="px-4 py-2 rounded-full text-sm text-[#6e6e73] dark:text-[#98989d] hover:bg-black/5 dark:hover:bg-white/10 transition"
            >
              取消
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={submit}
              className="px-5 py-2 rounded-full bg-[#0071e3] text-white text-sm font-medium hover:bg-[#0077ed] dark:hover:bg-[#0a84ff] transition active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
            >
              {saving ? '保存中…' : '保存'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={deleteTarget !== null} onClose={() => setDeleteTarget(null)} title="删除标签">
        <p className="text-sm text-[#424245] dark:text-[#c7c7cc]">
          确定删除标签「{deleteTarget?.name}」吗？该标签将从所有相关打卡记录中移除，此操作不可恢复。
        </p>
        <div className="flex justify-end gap-2 mt-6">
          <button
            type="button"
            onClick={() => setDeleteTarget(null)}
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
