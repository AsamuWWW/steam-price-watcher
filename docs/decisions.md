# 架构决策记录

## 1. 使用 Steam 官方 Store 接口（CN 区）

**决策**：使用 `store.steampowered.com` 的公开接口获取价格数据。

**理由**：
- Steam 官方接口稳定、免费、不依赖第三方数据源
- `appdetails?appids=<id>&cc=cn` 接口返回 CN 区人民币定价，符合需求
- 数据直接来源于 Steam，价格准确且实时

**接口**：
- 搜索：`/search/suggest?term=<keyword>&cc=cn&l=schinese`（HTML 解析）+ `/api/storesearch/`（JSON fallback）
- 价格：`/api/appdetails?appids=<id>&cc=cn&filters=price_overview`

**限制**：
- Steam API 无官方 SLA，可能偶发超时/限流
- 针对此情况：SteamClient 设置 10s 超时，搜索接口提供 fallback

---

## 2. 数据库选择：SQLite + Prisma

**决策**：使用 SQLite 作为数据库，Prisma 作为 ORM。

**理由**：
- 项目部署场景为 VPS 单机，无分布式需求
- SQLite 零运维、文件存储、Docker volume 持久化
- Prisma 提供类型安全的数据访问，支持迁移管理
- 对于每日一次的价格抓取，SQLite 性能完全满足需求

**取舍**：
- 若未来需要高并发写入或多实例部署，需迁移至 PostgreSQL（Prisma 支持无缝切换）

---

## 3. 管理员访问控制：IP 白名单

**决策**：使用 `AdminIpGuard` 限制管理接口仅允许内网 IP 访问。

**允许的 IP 范围**：
- `127.0.0.1`、`::1`（本机）
- `10.0.0.0/8`（RFC1918 A 类私网）
- `172.16.0.0/12`（RFC1918 B 类私网）
- `192.168.0.0/16`（RFC1918 C 类私网）

**理由**：
- 管理接口包含敏感操作（触发任务、查看审计日志），需要额外保护
- IP 白名单实现简单、无需用户认证，适合 VPS 内网运维场景
- 比 HTTP Basic Auth 更适合自动化脚本调用（curl 触发每日任务）

**取舍**：
- 不适用于需要远程管理的场景（可通过 VPN 或 SSH 隧道绕过限制）
- 若部署在 NAT 后方，需注意 X-Forwarded-For 头的可信度

---

## 4. 限流策略

**决策**：使用 `@nestjs/throttler` 全局限流 60 req/min/IP。

**理由**：
- 防止滥用（爬虫、DDoS）
- Steam 本身对频繁请求有限制，后端限流可减少不必要的 Steam API 请求
- 60 次/分钟对正常用户使用完全充足

---

## 5. 通知去重逻辑

**决策**：同一 Watch 的同类型通知，24 小时内只触发一次。

**理由**：
- 避免每次定时任务都重复推送已知的折扣/低价通知
- 通过查询 `createdAt >= now - 24h` 的相同 watchId + type 通知实现

---

## 6. 邮件通知预留扩展点

**决策**：当前不实现邮件发送，但在 `.env.example` 中预留 SMTP 配置，PricesService 中通知创建后可扩展邮件发送。

**理由**：
- 避免过早引入邮件发送的复杂性（需要配置 SMTP 服务）
- 站内通知已满足基本需求
- 未来可在 NotificationsService 的 `markRead` 前后加入邮件发送逻辑

---

## 7. 前端架构：Vite + React + TailwindCSS + Recharts

**决策**：使用 Recharts 代替 ECharts。

**理由**：
- Recharts 基于 React 组件，API 更符合 React 生态
- Bundle size 更小，SSR 友好
- 功能满足价格曲线展示需求（双 Y 轴、折线图）

**取舍**：
- ECharts 功能更丰富（热力图、K 线图等），如有复杂图表需求可替换

---

## 8. Docker 部署策略

**后端**：
- 多阶段构建（Node.js builder → production）
- 启动前运行 `prisma migrate deploy`（若使用 migrations）或 `prisma db push`
- 挂载 `./data` 目录持久化 SQLite 数据库

**前端**：
- 多阶段构建：npm build → nginx 静态托管
- nginx 反向代理 `/api/` 到后端服务
- 暴露 5173 端口（与开发环境一致）

**取舍**：
- 使用 `prisma db push` 而非 `prisma migrate deploy` 更简单，但不支持增量迁移历史；生产环境建议使用 migrations
