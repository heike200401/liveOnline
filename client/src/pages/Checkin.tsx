import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, errMsg } from '../api/client'
import { toast } from '../stores/toast'
import { dayjs } from '../utils/date'
import { prepareImage } from '../utils/image'
import type { SaveRecordPayload, Skill, Tag, TodayResponse } from '../types'

const DAILY_LIMIT = 8
const MAX_IMAGES = 9
const MAX_TAGS = 5

export default function Checkin() {
  const [today, setToday] = useState<TodayResponse | null>(null)
  const [skills, setSkills] = useState<Skill[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [hoursMap, setHoursMap] = useState<Record<string, string>>({})
  const [textContent, setTextContent] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const load = async () => {
    try {
      const [t, sk, tg] = await Promise.all([
        api.get<TodayResponse>('/daily-records/today'),
        api.get<Skill[]>('/skills'),
        api.get<Tag[]>('/tags'),
      ])
      setToday(t.data)
      setSkills(sk.data)
      setTags(tg.data)
      const rec = t.data.record
      if (rec) {
        setTextContent(rec.textContent)
        setImages(rec.images.map((i) => i.url))
        setSelectedTagIds(rec.tags.map((tag) => tag.id))
        const hm: Record<string, string> = {}
        for (const s of rec.skills) hm[s.skillId] = String(s.hours)
        setHoursMap(hm)
      } else {
        setTextContent('')
        setImages([])
        setSelectedTagIds([])
        setHoursMap({})
      }
    } catch (e) {
      toast.error(errMsg(e))
    } finally {
      setLoading(false)
    }
  }

  const total =
    Math.round(skills.reduce((sum, s) => sum + (parseFloat(hoursMap[s.id]) || 0), 0) * 100) / 100
  const overLimit = total > DAILY_LIMIT + 1e-9

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const room = MAX_IMAGES - images.length
    if (room <= 0) {
      toast.error(`最多上传 ${MAX_IMAGES} 张图片`)
      return
    }
    const list = Array.from(files).slice(0, room)
    setUploading(true)
    try {
      for (const f of list) {
        // 超过 5MB 的图片先自动压缩，避免上传 413
        const file = await prepareImage(f).catch((err) => {
          toast.error(err instanceof Error ? err.message : '图片处理失败')
          return null
        })
        if (!file) continue
        const fd = new FormData()
        fd.append('file', file)
        const { data } = await api.post<{ url: string }>('/upload/image', fd)
        setImages((prev) => (prev.length >= MAX_IMAGES ? prev : [...prev, data.url]))
      }
    } catch (e) {
      toast.error(errMsg(e))
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const addTag = async () => {
    const name = newTag.trim()
    if (!name) return
    try {
      const { data } = await api.post<Tag>('/tags', { name })
      setTags((prev) => [...prev, data])
      setSelectedTagIds((prev) =>
        prev.length >= MAX_TAGS || prev.includes(data.id) ? prev : [...prev, data.id],
      )
      setNewTag('')
    } catch (e) {
      toast.error(errMsg(e))
    }
  }

  const toggleTag = (id: string) => {
    setSelectedTagIds((prev) => {
      if (prev.includes(id)) return prev.filter((t) => t !== id)
      if (prev.length >= MAX_TAGS) {
        toast.error(`最多选择 ${MAX_TAGS} 个标签`)
        return prev
      }
      return [...prev, id]
    })
  }

  const submit = async () => {
    if (!today) return
    const text = textContent.trim()
    if (!text) return toast.error('请填写文字心得')
    if (text.length > 2000) return toast.error('文字心得最多 2000 字')
    if (images.length < 1) return toast.error('至少上传 1 张图片')
    if (selectedTagIds.length < 1) return toast.error('至少选择 1 个标签')
    if (overLimit) return toast.error(`今日学习总时长不可超过 ${DAILY_LIMIT} 小时`)

    const payload: SaveRecordPayload = {
      skillHours: skills.map((s) => ({
        skillId: s.id,
        hours: Math.round((parseFloat(hoursMap[s.id]) || 0) * 2) / 2,
      })),
      textContent: text,
      imageUrls: images,
      tagIds: selectedTagIds,
    }

    setSaving(true)
    try {
      const { status, isCheckinWindow, record } = today
      if (isCheckinWindow) {
        if (record) await api.put(`/daily-records/${record.id}`, payload)
        else await api.post('/daily-records', payload)
      } else if (status === 'submitted' && record) {
        await api.put(`/daily-records/${record.id}`, payload)
      } else {
        try {
          await api.post('/daily-records/draft', payload)
        } catch (e) {
          if (record && errMsg(e).includes('不能覆盖为草稿')) {
            await api.put(`/daily-records/${record.id}`, payload)
          } else {
            throw e
          }
        }
      }
      toast.success(isCheckinWindow ? '打卡提交成功 🎉' : '草稿已保存')
      await load()
    } catch (e) {
      toast.error(errMsg(e))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-sm text-[#86868b] dark:text-[#98989d] py-20 text-center">加载中…</p>
  if (!today) return <p className="text-sm text-[#86868b] dark:text-[#98989d] py-20 text-center">加载失败，请刷新重试</p>

  const isWindow = today.isCheckinWindow

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-baseline justify-between mb-2">
        <h1 className="text-3xl font-bold">每日打卡</h1>
        <span className="text-sm text-[#86868b] dark:text-[#98989d]">{dayjs(today.recordDate).format('YYYY年MM月DD日 dddd')}</span>
      </div>

      <div className="mt-4 space-y-5">
        {today.status === 'submitted' ? (
          <div className="rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-sm px-4 py-3">
            已提交，可随时修改
          </div>
        ) : !isWindow ? (
          <div className="rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 text-sm px-4 py-3">
            草稿编辑模式：正式打卡时间为每晚 23:00 - 次日 01:00，当前保存将作为草稿
            {today.status === 'draft' ? '（今日已有草稿）' : ''}
          </div>
        ) : (
          <div className="rounded-xl bg-[#0071e3]/10 border border-[#0071e3]/20 text-[#0071e3] dark:text-[#0a84ff] text-sm px-4 py-3">
            打卡窗口已开启（23:00 - 次日 01:00）
            {today.status === 'draft' ? '，今日已有草稿，可正式提交' : ''}
          </div>
        )}

        <div className="bg-white dark:bg-[#2c2c2e] rounded-2xl border border-black/[0.04] dark:border-white/[0.08] shadow-sm p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">学习时长</h2>
            <span
              className={`text-sm font-medium ${
                overLimit ? 'text-red-500' : 'text-[#6e6e73] dark:text-[#98989d]'
              }`}
            >
              今日共 {total} / {DAILY_LIMIT} 小时
            </span>
          </div>
          {skills.length === 0 ? (
            <p className="text-sm text-[#86868b] dark:text-[#98989d] py-4">
              还没有技能，
              <Link to="/skills" className="text-[#0071e3] dark:text-[#0a84ff] hover:underline">
                去创建
              </Link>
            </p>
          ) : (
            <div className="divide-y divide-black/[0.05] dark:divide-white/[0.08]">
              {skills.map((s) => (
                <div key={s.id} className="flex items-center gap-3 py-2.5">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                  <span className="text-sm flex-1 truncate">{s.name}</span>
                  <input
                    type="number"
                    min={0}
                    max={DAILY_LIMIT}
                    step={0.5}
                    placeholder="0"
                    value={hoursMap[s.id] ?? ''}
                    onChange={(e) =>
                      setHoursMap((m) => ({ ...m, [s.id]: e.target.value }))
                    }
                    className="w-24 px-3 py-1.5 text-sm text-right rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-[#1d1d1f] dark:text-[#f5f5f7] focus:outline-none focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/30 transition"
                  />
                  <span className="text-xs text-[#86868b] dark:text-[#98989d] w-9">小时</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-[#2c2c2e] rounded-2xl border border-black/[0.04] dark:border-white/[0.08] shadow-sm p-6">
          <h2 className="font-semibold mb-3">
            文字心得 <span className="text-red-500">*</span>
          </h2>
          <textarea
            rows={5}
            maxLength={2000}
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            placeholder="今天学到了什么？有什么收获与思考…"
            className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#1d1d1f] dark:text-[#f5f5f7] text-sm resize-none focus:outline-none focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/30 transition"
          />
          <p className="text-xs text-[#86868b] dark:text-[#98989d] mt-1.5 text-right">{textContent.length} / 2000</p>
        </div>

        <div className="bg-white dark:bg-[#2c2c2e] rounded-2xl border border-black/[0.04] dark:border-white/[0.08] shadow-sm p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">
              图片 <span className="text-red-500">*</span>
            </h2>
            <span className="text-xs text-[#86868b] dark:text-[#98989d]">
              {images.length} / {MAX_IMAGES} 张
            </span>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
            {images.map((url, i) => (
              <div key={url} className="relative group aspect-square">
                <img src={url} alt="" className="w-full h-full object-cover rounded-xl bg-black/[0.03]" />
                <button
                  type="button"
                  onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                >
                  ×
                </button>
              </div>
            ))}
            {images.length < MAX_IMAGES && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="aspect-square rounded-xl border border-dashed border-black/15 dark:border-white/[0.15] text-[#86868b] dark:text-[#98989d] text-xs flex flex-col items-center justify-center gap-1 hover:border-[#0071e3] dark:hover:border-[#0a84ff] hover:text-[#0071e3] dark:hover:text-[#0a84ff] transition disabled:opacity-50"
              >
                <span className="text-xl leading-none">＋</span>
                {uploading ? '上传中…' : '上传图片'}
              </button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>

        <div className="bg-white dark:bg-[#2c2c2e] rounded-2xl border border-black/[0.04] dark:border-white/[0.08] shadow-sm p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">
              标签 <span className="text-red-500">*</span>
            </h2>
            <span className="text-xs text-[#86868b] dark:text-[#98989d]">
              {selectedTagIds.length} / {MAX_TAGS} 个
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.map((t) => {
              const active = selectedTagIds.includes(t.id)
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => toggleTag(t.id)}
                  className={`px-3.5 py-1.5 rounded-full text-sm border transition ${
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
          </div>
          <div className="flex items-center gap-2 mt-4">
            <input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              placeholder="新建标签"
              maxLength={20}
              className="flex-1 px-4 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#1d1d1f] dark:text-[#f5f5f7] text-sm focus:outline-none focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/30 transition"
            />
            <button
              type="button"
              onClick={addTag}
              className="px-4 py-2 rounded-full text-sm text-[#0071e3] dark:text-[#0a84ff] hover:bg-[#0071e3]/10 transition"
            >
              ＋ 添加
            </button>
          </div>
        </div>

        <button
          type="button"
          disabled={saving}
          onClick={submit}
          className="w-full py-3 rounded-full bg-[#0071e3] text-white text-sm font-medium hover:bg-[#0077ed] dark:hover:bg-[#0a84ff] transition active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
        >
          {saving ? '保存中…' : isWindow ? '正式提交打卡' : '保存草稿'}
        </button>
      </div>
    </div>
  )
}
