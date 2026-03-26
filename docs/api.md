# API 文档

所有接口返回统一 JSON 格式：

```json
{
  "ok": true,
  "data": <响应数据>,
  "error": null
}
```

错误时：

```json
{
  "ok": false,
  "data": null,
  "error": "错误信息"
}
```

---

## Health

### GET /health

检查服务状态。

**响应示例：**

```json
{
  "ok": true,
  "data": {
    "status": "ok",
    "timestamp": "2024-01-01T03:00:00.000Z"
  },
  "error": null
}
```

---

## Games

### GET /games/search?keyword=xxx&limit=20

搜索 Steam 游戏（CN 区）。

**参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `keyword` | string | ✅ | 关键词 |
| `limit` | number | ❌ | 最大返回数量（默认 20，最大 50） |

**响应示例：**

```json
{
  "ok": true,
  "data": [
    { "appid": 730, "name": "Counter-Strike 2" },
    { "appid": 570, "name": "Dota 2" }
  ],
  "error": null
}
```

---

## Watchlist

### GET /watchlist

获取所有监控记录。

**响应示例：**

```json
{
  "ok": true,
  "data": [
    {
      "id": 1,
      "gameId": 1,
      "game": {
        "id": 1,
        "steamAppId": 730,
        "name": "Counter-Strike 2",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      },
      "enabled": true,
      "discountThreshold": 50,
      "priceThresholdEnabled": false,
      "priceThresholdCents": null,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "error": null
}
```

---

### POST /watchlist

添加游戏监控。

**请求体：**

```json
{
  "steamAppId": 730,
  "name": "Counter-Strike 2",
  "discountThreshold": 50,
  "priceThresholdEnabled": false,
  "priceThresholdCents": null
}
```

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `steamAppId` | number | ✅ | - | Steam AppID |
| `name` | string | ✅ | - | 游戏名称 |
| `discountThreshold` | number | ❌ | 50 | 折扣阈值 (0-100) |
| `priceThresholdEnabled` | boolean | ❌ | false | 是否启用价格阈值 |
| `priceThresholdCents` | number | ❌ | null | 价格阈值（分） |

---

### PATCH /watchlist/:id

更新监控配置。

**请求体（均为可选）：**

```json
{
  "enabled": true,
  "discountThreshold": 30,
  "priceThresholdEnabled": true,
  "priceThresholdCents": 15000
}
```

---

### DELETE /watchlist/:id

删除监控。

**响应：**

```json
{
  "ok": true,
  "data": null,
  "error": null
}
```

---

## Prices

### POST /prices/refresh/:watchId

手动刷新某个监控的价格，并生成价格快照。如果触发阈值则产生通知。

**响应示例：**

```json
{
  "ok": true,
  "data": {
    "id": 1,
    "gameId": 1,
    "currency": "CNY",
    "finalCents": 12800,
    "initialCents": 25800,
    "discountPercent": 50,
    "isFree": false,
    "status": "OK",
    "fetchedAt": "2024-01-01T03:00:00.000Z"
  },
  "error": null
}
```

**价格状态 (status)：**

| 值 | 说明 |
|----|------|
| `OK` | 正常价格 |
| `FREE` | 免费游戏 |
| `NO_PRICE` | 无价格信息 |
| `UNAVAILABLE` | 游戏不可用/下架 |

---

### GET /prices/history/:gameId?days=30

获取游戏历史价格记录。

**参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `days` | number | ❌ | 查询天数（默认 30） |

**响应示例：**

```json
{
  "ok": true,
  "data": [
    {
      "id": 1,
      "gameId": 1,
      "currency": "CNY",
      "finalCents": 12800,
      "initialCents": 25800,
      "discountPercent": 50,
      "isFree": false,
      "status": "OK",
      "fetchedAt": "2024-01-01T03:00:00.000Z"
    }
  ],
  "error": null
}
```

---

## Notifications

### GET /notifications

获取所有通知（最近 100 条）。

**通知类型：**

| type | 说明 |
|------|------|
| `DISCOUNT_REACHED` | 折扣达到阈值 |
| `PRICE_BELOW` | 价格低于阈值 |
| `ERROR` | 抓取错误 |

**响应示例：**

```json
{
  "ok": true,
  "data": [
    {
      "id": 1,
      "watchId": 1,
      "type": "DISCOUNT_REACHED",
      "message": "Counter-Strike 2 discount reached 50% (threshold: 50%)",
      "readAt": null,
      "createdAt": "2024-01-01T03:00:00.000Z"
    }
  ],
  "error": null
}
```

---

### POST /notifications/:id/read

标记通知为已读。

---

## Admin（仅内网）

以下接口通过 `AdminIpGuard` 保护，仅允许 `127.0.0.1`、`::1` 以及 RFC1918 私网段访问。从公网访问返回 403。

### GET /admin/overview

获取系统概览：最近任务运行、错误列表、审计日志。

**响应示例：**

```json
{
  "ok": true,
  "data": {
    "recentJobRuns": [
      {
        "id": 1,
        "jobName": "DAILY_PRICE_CHECK",
        "startedAt": "2024-01-01T03:00:00.000Z",
        "finishedAt": "2024-01-01T03:00:05.000Z",
        "status": "SUCCESS",
        "error": null,
        "statsJson": "{\"success\":5,\"failed\":0,\"errors\":[]}"
      }
    ],
    "recentErrors": [],
    "recentAuditLogs": [
      {
        "id": 1,
        "action": "WATCH_CREATED",
        "metaJson": "{\"watchId\":1,\"steamAppId\":730,\"name\":\"Counter-Strike 2\"}",
        "ip": "127.0.0.1",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  },
  "error": null
}
```

---

### POST /admin/trigger-daily

手动触发每日价格抓取任务。

**响应：**

```json
{
  "ok": true,
  "data": {
    "triggered": true,
    "timestamp": "2024-01-01T03:00:00.000Z"
  },
  "error": null
}
```

---

## 限流

所有接口全局限流：60 次请求/分钟/IP。超出返回 429 Too Many Requests。
