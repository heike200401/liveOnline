import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { errMsg, registerRequest } from '../api/client'
import { useAuthStore } from '../stores/auth'
import { toast } from '../stores/toast'

export default function Register() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password) return toast.error('请输入用户名和密码')
    if (password !== confirm) return toast.error('两次输入的密码不一致')
    setLoading(true)
    try {
      const data = await registerRequest(username.trim(), password)
      setAuth(data)
      toast.success('注册成功，已自动登录')
      navigate('/skills')
    } catch (err) {
      toast.error(errMsg(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white dark:bg-[#2c2c2e] rounded-2xl border border-black/[0.04] dark:border-white/[0.08] shadow-sm p-8">
        <h1 className="text-3xl font-bold text-center">创建账号</h1>
        <p className="text-sm text-[#6e6e73] dark:text-[#98989d] text-center mt-2 mb-8">开始养成你的技能树</p>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#6e6e73] dark:text-[#98989d] mb-1.5">用户名</label>
            <input
              className="w-full px-4 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#1d1d1f] dark:text-[#f5f5f7] text-sm focus:outline-none focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/30 transition"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="3-20 个字符"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#6e6e73] dark:text-[#98989d] mb-1.5">密码</label>
            <input
              type="password"
              className="w-full px-4 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#1d1d1f] dark:text-[#f5f5f7] text-sm focus:outline-none focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/30 transition"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="至少 6 位"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#6e6e73] dark:text-[#98989d] mb-1.5">确认密码</label>
            <input
              type="password"
              className="w-full px-4 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#1d1d1f] dark:text-[#f5f5f7] text-sm focus:outline-none focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/30 transition"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="再次输入密码"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-full bg-[#0071e3] text-white text-sm font-medium hover:bg-[#0077ed] dark:hover:bg-[#0a84ff] transition active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? '注册中…' : '注册'}
          </button>
        </form>
        <p className="text-sm text-[#6e6e73] dark:text-[#98989d] text-center mt-6">
          已有账号？
          <Link to="/login" className="text-[#0071e3] hover:underline ml-1">
            登录
          </Link>
        </p>
      </div>
    </div>
  )
}
