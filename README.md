# Steam 价格监控 (Steam Price Watcher)

一个自托管的 Steam 游戏价格监控网站，支持 CN 区官方价格、折扣 & 价格阈值通知、历史价格曲线。

## 功能特性

- 🔍 **游戏搜索**：从 Steam 官方接口搜索游戏（CN 区）
- 📋 **监控列表**：添加/编辑/启停/删除游戏监控
- 💰 **价格抓取**：每日自动抓取 + 手动刷新，支持失败重试记录
- 📈 **历史曲线**：展示历史现价/原价/折扣
- 🔔 **站内通知**：折扣 ≥ 阈值 或 价格 ≤ 阈值时产生通知
- 🛡️ **管理面板**：任务运行情况、抓取错误、审计日志（仅内网访问）
- ⚡ **限流保护**：全局 60 req/min/IP

## 项目结构

```
steam-price-watcher/
  backend/          # NestJS + Prisma + SQLite
  frontend/         # Vite + React + TailwindCSS + Recharts
  docs/             # API 文档与架构决策
  docker-compose.yml
```

## 本地开发

### 前置要求

- Node.js 20+
- npm 10+

### 后端

```bash
cd backend
cp .env.example .env
npm install
npx prisma db push
npm run start:dev
# 运行于 http://localhost:4000
```

### 前端

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
# 运行于 http://localhost:5173
```

## 环境变量

### 后端 (`backend/.env`)

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `DATABASE_URL` | `file:./data/dev.db` | SQLite 数据库路径 |
| `PORT` | `4000` | 后端监听端口 |
| `CORS_ORIGIN` | `http://localhost:5173` | 允许的前端来源 |
| `STEAM_CC` | `cn` | Steam 国家/地区代码 |
| `STEAM_LANGUAGE` | `schinese` | Steam 语言 |
| `DAILY_CRON` | `0 3 * * *` | 每日任务 cron 表达式 |
| `THROTTLE_TTL` | `60000` | 限流时间窗口 (ms) |
| `THROTTLE_LIMIT` | `60` | 时间窗口内最大请求数 |
| `SMTP_HOST` | - | SMTP 服务器（预留，暂不实现） |
| `SMTP_PORT` | - | SMTP 端口（预留） |
| `SMTP_USER` | - | SMTP 用户名（预留） |
| `SMTP_PASS` | - | SMTP 密码（预留） |
| `NOTIFY_EMAIL` | - | 通知邮箱（预留） |

### 前端 (`frontend/.env`)

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `VITE_API_BASE_URL` | `http://localhost:4000` | 后端 API 地址 |

## 生产部署（Docker）

```bash
# 复制并修改环境变量
cp backend/.env.example backend/.env

# 构建并启动
docker compose up --build -d

# 后端: http://<your-server-ip>:4000
# 前端: http://<your-server-ip>:5173
```

数据库文件持久化在 `./data/` 目录。

## 手动触发每日任务

管理员可通过内网 HTTP 请求手动触发每日价格抓取任务：

```bash
# 仅在服务器本机执行（内网限制）
curl -X POST http://localhost:4000/admin/trigger-daily
```

或通过系统 cron（示例）：

```cron
0 3 * * * curl -s -X POST http://localhost:4000/admin/trigger-daily >> /var/log/steam-watcher-cron.log 2>&1
```

## 管理面板

管理面板 (`/admin`) 仅允许内网访问（127.0.0.1、::1、RFC1918 私网段）。
从公网访问 `/admin/overview` 将返回 403。

## API 文档

详见 [docs/api.md](docs/api.md)

## 架构决策

详见 [docs/decisions.md](docs/decisions.md)
