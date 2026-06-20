## 1. 架构设计

- 前端展示层：Next.js 14+ (App Router), React Server Components, Tailwind CSS, shadcn/ui, Zustand, ECharts
- API服务层：Next.js Route Handlers (预约/排班/物资/会员/统计/认证API)
- 数据层：PostgreSQL + Prisma ORM

## 2. 技术栈说明

### 2.1 前端技术
- **框架**: Next.js 14+ (App Router, React Server Components)
- **UI组件库**: shadcn/ui (基于 Radix UI + Tailwind CSS)
- **样式方案**: Tailwind CSS 3.x
- **状态管理**: Zustand (轻量级客户端状态)
- **数据可视化**: ECharts 5.x (echarts-for-react)
- **图标库**: Lucide React
- **日期处理**: date-fns / dayjs
- **表单处理**: React Hook Form + Zod 校验
- **TypeScript**: 严格模式

### 2.2 后端与数据
- **API层**: Next.js Route Handlers (内置API路由)
- **ORM**: Prisma 5.x
- **数据库**: PostgreSQL 15+

## 3. 路由定义

| 路由路径 | 页面用途 |
|----------|----------|
| / | 工作台首页（数据概览） |
| /login | 登录页 |
| /appointments | 预约看板（日/周视图） |
| /appointments/list | 预约列表 |
| /appointments/new | 新建预约 |
| /schedule | 排班日历（月/周/日视图） |
| /schedule/settings | 排班设置 |
| /inventory | 物资库存总览 |
| /inventory/purchase | 采购入库 |
| /inventory/consume | 消耗出库 |
| /inventory/trace | 一物一码追溯 |
| /inventory/warnings | 库存预警 |
| /members | 会员档案列表 |
| /members/[id] | 会员详情 |
| /members/stored-value | 储值卡管理 |
| /members/installment | 分期付款管理 |
| /members/points | 积分管理 |
| /statistics | 数据统计分析 |
| /settings/clinics | 门店管理 |
| /settings/staff | 人员管理 |
| /settings/treatments | 治疗项目配置 |
