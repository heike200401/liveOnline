import { useEffect, useState } from 'react'
import { api, errMsg } from '../api/client'
import type { Skill } from '../types'
import { toast } from '../stores/toast'
import Modal from './Modal'
import ColorPicker from './ColorPicker'

interface Props {
  open: boolean
  onClose: () => void
  onSaved: () => void
  skill?: Pick<Skill, 'id' | 'name' | 'description' | 'color'> | null
}

export default function SkillFormModal({ open, onClose, onSaved, skill }: Props) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState('#0071e3')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setName(skill?.name ?? '')
      setDescription(skill?.description ?? '')
      setColor(skill?.color ?? '#0071e3')
    }
  }, [open, skill])

  const submit = async () => {
    if (!name.trim()) return toast.error('请输入技能名称')
    setSaving(true)
    try {
      const payload = { name: name.trim(), description: description.trim(), color }
      if (skill) await api.put(`/skills/${skill.id}`, payload)
      else await api.post('/skills', payload)
      toast.success(skill ? '技能已更新' : '技能已创建')
      onSaved()
      onClose()
    } catch (e) {
      toast.error(errMsg(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={skill ? '编辑技能' : '新建技能'}>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-[#6e6e73] dark:text-[#98989d] mb-1.5">
            名称 <span className="text-red-500">*</span>
          </label>
          <input
            className="w-full px-4 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#1d1d1f] dark:text-[#f5f5f7] text-sm focus:outline-none focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/30 transition"
            value={name}
            maxLength={30}
            placeholder="例如：英语口语"
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#6e6e73] dark:text-[#98989d] mb-1.5">描述</label>
          <textarea
            className="w-full px-4 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#1d1d1f] dark:text-[#f5f5f7] text-sm resize-none focus:outline-none focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/30 transition"
            rows={3}
            maxLength={200}
            placeholder="简单描述这个技能（选填）"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#6e6e73] dark:text-[#98989d] mb-1.5">颜色</label>
          <ColorPicker value={color} onChange={setColor} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
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
  )
}
