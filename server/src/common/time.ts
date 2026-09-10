/**
 * 打卡时间窗口判断（北京时间 UTC+8）
 *
 * 正式打卡时段：每晚 23:00 ~ 次日 01:00
 * 其余时间为草稿编辑时段
 */

const BEIJING_OFFSET_MS = 8 * 60 * 60 * 1000;

/** 获取当前北京时间 */
export function nowBeijing(): Date {
  return new Date(Date.now() + BEIJING_OFFSET_MS);
}

/** 将北京时间 Date 格式化成本地日期（北京时间）YYYY-MM-DD */
export function beijingDateString(date: Date): string {
  const bj = new Date(date.getTime() + BEIJING_OFFSET_MS);
  return bj.toISOString().slice(0, 10);
}

/** 判断当前是否处于正式打卡时段（23:00 ~ 次日 01:00） */
export function isCheckinWindow(now: Date = new Date()): boolean {
  const bj = new Date(now.getTime() + BEIJING_OFFSET_MS);
  const hour = bj.getUTCHours();
  // 23:00 ~ 23:59，或 00:00 ~ 00:59
  return hour >= 23 || hour < 1;
}

/**
 * 计算「当前应打卡的目标日期」
 * 打卡窗口跨越午夜：23:00~次日01:00 期间，打卡归属于「当日 23:00 所在的那一天」。
 * 即：若当前处于 23:00~23:59 属当天；00:00~00:59 属前一天。
 */
export function currentCheckinDate(now: Date = new Date()): string {
  const bj = new Date(now.getTime() + BEIJING_OFFSET_MS);
  const hour = bj.getUTCHours();
  if (hour < 1) {
    // 午夜后，归属于前一天
    const prev = new Date(bj.getTime() - 24 * 60 * 60 * 1000);
    return prev.toISOString().slice(0, 10);
  }
  return bj.toISOString().slice(0, 10);
}

/** YYYY-MM-DD → Date（UTC 午夜，与 @db.Date 列的 UTC 截断一致，避免日期偏移） */
export function dateStringToUtc(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00Z`);
}