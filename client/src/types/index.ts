export interface User {
  id: string
  username: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: User
}

export interface Skill {
  id: string
  name: string
  description: string | null
  color: string
  totalHours: number
  stage: string
  progress: number
  lastStudyDate: string | null
  createdAt: string
}

export interface SkillTrendPoint {
  date: string
  hours: number
  totalHours: number
  stage: string
}

export interface SkillStats {
  id: string
  name: string
  color: string
  description: string | null
  totalHours: number
  stage: string
  progress: number
  trend: SkillTrendPoint[]
}

export interface RecordSkill {
  skillId: string
  name: string
  color: string
  hours: number
}

export interface RecordImage {
  id: string
  url: string
}

export interface RecordTag {
  id: string
  name: string
  color: string
}

export interface DailyRecord {
  id: string
  recordDate: string
  totalHours: number
  textContent: string
  status: 'draft' | 'submitted'
  skills: RecordSkill[]
  images: RecordImage[]
  tags: RecordTag[]
}

export type TodayStatus = 'none' | 'draft' | 'submitted'

export interface TodayResponse {
  recordDate: string
  status: TodayStatus
  isCheckinWindow: boolean
  record: DailyRecord | null
}

export interface SkillHourInput {
  skillId: string
  hours: number
}

export interface SaveRecordPayload {
  skillHours: SkillHourInput[]
  textContent: string
  imageUrls: string[]
  tagIds: string[]
}

export interface DayViewResponse {
  view: 'day'
  date: string
  records: DailyRecord[]
}

export interface WeekViewResponse {
  view: 'week'
  date: string
  weekStart: string
  weekEnd: string
  checkinDays: number
  totalHours: number
  skillBreakdown: Record<string, number>
  records: DailyRecord[]
}

export interface MonthViewResponse {
  view: 'month'
  date: string
  month: string
  checkinDays: number
  totalHours: number
  skillBreakdown: Record<string, number>
  calendar: Record<string, number>
  records: DailyRecord[]
}

export type RecordsViewResponse = DayViewResponse | WeekViewResponse | MonthViewResponse

export interface Tag {
  id: string
  name: string
  color: string
  createdAt: string
}

export interface OverviewStats {
  skillCount: number
  totalHours: number
  checkinDays: number
  totalRecords: number
  tagsCount: number
}

export interface PeriodStats {
  period: 'week' | 'month'
  startDate: string
  endDate: string
  checkinDays: number
  totalHours: number
  skillBreakdown: Record<string, number>
}
