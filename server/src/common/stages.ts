/**
 * 技能阶段定义（累计小时数阈值）
 */
export const STAGES = [
  { name: '未入门', min: 0 },
  { name: '入门', min: 30 },
  { name: '小成', min: 100 },
  { name: '熟练', min: 300 },
  { name: '精通', min: 600 },
] as const;

export type StageName = (typeof STAGES)[number]['name'];

/**
 * 根据累计小时数判定当前阶段
 */
export function getStage(totalHours: number): { name: string; index: number } {
  let index = 0;
  for (let i = 0; i < STAGES.length; i++) {
    if (totalHours >= STAGES[i].min) {
      index = i;
    }
  }
  return { name: STAGES[index].name, index };
}

/**
 * 获取「当前阶段 → 下一阶段」的进度（0~1）
 * 到达精通后返回 1（满格）
 */
export function getProgress(totalHours: number): number {
  const { index } = getStage(totalHours);
  if (index >= STAGES.length - 1) {
    return 1;
  }
  const curMin = STAGES[index].min;
  const nextMin = STAGES[index + 1].min;
  return Math.min(1, Math.max(0, (totalHours - curMin) / (nextMin - curMin)));
}

/** 单日学习时长上限（小时） */
export const DAILY_HOURS_LIMIT = 8;

/** 每日衰减量（小时） */
export const DECAY_HOURS = 6;

/** 最小录入精度（小时） */
export const HOURS_STEP = 0.5;