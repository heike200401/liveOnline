# 技能树养成（Skill Tree）

一款技能树可视化 + 每日打卡养成的前后端分离网页应用。通过每日学习打卡点亮技能进度，追踪从「未入门」到「精通」的成长历程。

## 功能特性

- **技能树**：输入技能名称创建技能，进度条实时展示学习时长与阶段（入门 30h / 小成 100h / 熟练 300h / 精通 600h）
- **每日收获打卡**：23:00 ~ 次日 01:00 打卡窗口；任意时间可保存草稿，凌晨 1 点系统自动提交草稿
- **打卡内容**：文字心得（必填）+ 图片（必填，1~9 张，超 5MB 自动压缩）+ 标签（必填，1~5 个）
- **标签系统**：自由创建彩色标签，支持多标签筛选
- **三种视图**：日 / 周 / 月（月视图含打卡日历热力图）
- **学习激励**：单日学习总和上限 8 小时；当日未打卡则所有技能扣减 6 小时进度（不可补签）
- **打卡可编辑**：已提交记录不限次数修改，学习时长变化自动同步技能进度
- **苹果风 UI**：亮 / 暗色模式（跟随系统 + 手动切换）、流畅动效、响应式布局

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 18、TypeScript、Vite 5、Tailwind CSS、Framer Motion、Recharts、React Router、Axios |
| 后端 | NestJS 11、TypeScript、Prisma ORM、Passport JWT、Multer |
| 数据库 | PostgreSQL 16 |
| 图表/统计 | Recharts（折线图、饼图）、CSS 日历热力图 |

## 环境要求

- Node.js >= 20
- PostgreSQL >= 16（服务名 `postgresql-x64-16`，默认自动启动）

## 快速开始

### 1. 创建数据库

```sql
CREATE DATABASE skill_tree;
```

### 2. 配置环境变量

`server/.env`：

```env
DATABASE_URL="postgresql://postgres:<密码>@localhost:5432/skill_tree?schema=public"
JWT_SECRET="<自定义密钥>"
PORT=3000
```

### 3. 安装依赖并初始化

```bash
# 根目录（前端依赖）
npm install

# 后端
cd server
npm install
npx prisma migrate dev   # 执行数据库迁移并生成 Prisma Client
```

### 4. 启动

```bash
# 回到根目录，一键启动前后端
cd ..
npm run dev
```

- 前端：http://localhost:5173
- 后端：http://localhost:3000/api

### 一键启动（推荐）

双击桌面 **`Start-SkillTree.bat`**：自动确保数据库服务运行 → 启动前后端 → 10 秒后自动打开浏览器。关闭窗口或 `Ctrl+C` 即可停止全部服务。（注：批处理脚本需为纯 ASCII 内容，cmd.exe 会按 GBK 代码页解析 .bat，UTF-8 中文会导致脚本秒退）

## 项目结构

```
liveOnline/
├── client/                  # 前端（React + Vite）
│   └── src/
│       ├── pages/           # 登录/注册/技能树/打卡/收获/统计/标签等页面
│       ├── components/      # Modal、ProgressBar、TagChip 等通用组件
│       ├── layouts/         # AppLayout（导航 + 主题切换）
│       ├── hooks/           # useTheme 暗色模式管理
│       └── utils/           # 日期、图片压缩等工具
├── server/                  # 后端（NestJS）
│   └── src/
│       ├── auth/            # 注册 / 登录 / JWT
│       ├── skills/          # 技能 CRUD + 阶段计算
│       ├── daily-records/   # 打卡 / 草稿 / 衰减检查
│       ├── tags/            # 标签 CRUD
│       ├── upload/          # 图片上传（multer，单张 ≤5MB）
│       ├── stats/           # 日/周/月统计
│       └── common/          # 时区工具、异常过滤器
├── docs/PRD.md              # 产品需求文档
└── package.json             # 根启动脚本（concurrently）
```

## 核心业务规则

- **阶段判定**：累计学习时长 `0+ 未入门`、`30+ 入门`、`100+ 小成`、`300+ 熟练`、`600+ 精通`
- **每日上限**：单日所有技能学习时长总和 ≤ 8 小时（步进 0.5h）
- **衰减机制**：每日凌晨 1:00 定时检查前一天，若无打卡记录则所有技能扣减 6 小时（最低扣至 0），不可补签；有草稿则自动提交后再判断
- **打卡窗口**：23:00 ~ 次日 01:00 可正式打卡；窗口外可编辑并保存草稿，凌晨 1:00 自动提交
- **必填校验**：文字心得 1~2000 字、图片 1~9 张、标签 1~5 个
- **记录可编辑**：已提交记录不限次数修改，学习时长变化实时同步技能累计时长

## 常见问题

- **修改 Tailwind 配置后样式不生效**：重启 dev server（Tailwind 在 Windows 下可能不监听配置文件变更）
- **图片上传报 413**：单张图片超过 5MB；前端已做自动压缩，仍超限请手动压缩后再上传
- **端口占用**：前端 5173 / 后端 3000，可在 `client/vite.config.ts` 与 `server/.env` 中调整
- **浏览器直接访问图片 404**：上传文件通过 `http://localhost:3000/static/uploads/<文件名>` 访问
