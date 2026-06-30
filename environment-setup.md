# PostTrust 环境变量与第三方服务配置

## 1. 文件用途

- `.env.example`：变量清单，可以进入版本控制，不含真实密钥。
- `.env.local`：本机开发配置，已经被 `.gitignore` 忽略；把占位符替换成真实值。
- Vercel：部署时在项目的 Environment Variables 中配置同名变量，不上传 `.env.local`。

所有没有 `NEXT_PUBLIC_` 前缀的变量只能在服务端读取。Gemini、Neon、Brevo、Stripe secret 和 webhook secret 都不能传到浏览器。

## 2. Gemini 2.5 Flash

1. 在 Google AI Studio 创建 API key。
2. 把 key 填入 `GEMINI_API_KEY`。
3. 保持 `GEMINI_MODEL=gemini-2.5-flash`。
4. 限制该 key 只能访问 Gemini API，并设置用量或账单告警。

官方文档：https://ai.google.dev/gemini-api/docs/api-key

模型文档：https://ai.google.dev/gemini-api/docs/models/gemini-2.5-flash

API key 只能由 Next.js 服务端调用。Google 官方明确不建议在生产网页客户端暴露 key。

## 3. Neon

1. 创建 Neon 项目和生产数据库。
2. 从 Neon 控制台复制 pooled connection string。
3. 填入 `DATABASE_URL`，保留 `sslmode=require`。
4. 开发和生产最好使用不同数据库或不同 branch。

官方文档：https://neon.com/docs/serverless/serverless-driver

建议首版迁移包含：`users`、`magic_links`、`sessions`、`credit_ledger`、`purchases`、`audits`。

## 4. Brevo

### 基础配置

1. 在 Brevo 验证发件域名和 sender。
2. 创建 API key，填入 `BREVO_API_KEY`。
3. 填写已验证的 `BREVO_SENDER_EMAIL` 和显示名称。
4. 创建营销联系人列表，把数字 ID 填入 `BREVO_CONTACT_LIST_ID`。

API key 官方说明：https://developers.brevo.com/docs/api-key-authentication

联系人接口：https://developers.brevo.com/reference/create-contact

### 邮件模板

创建并启用两个 transactional templates：

1. Magic Link 模板：包含 `{{params.magic_link}}` 和有效期说明。
2. Purchase 模板：包含套餐、增加次数和当前余额。

把模板数字 ID 分别填入：

- `BREVO_MAGIC_LINK_TEMPLATE_ID`
- `BREVO_PURCHASE_TEMPLATE_ID`

交易邮件文档：https://developers.brevo.com/docs/send-a-transactional-email

魔法链接邮件不等于营销订阅。只有用户明确勾选订阅后，才调用 Contacts API 把邮箱加入 `BREVO_CONTACT_LIST_ID`。

## 5. Stripe Payment Link

### 5.1 创建商品和价格

在 Stripe 测试模式创建：

| Product | Price type | Amount | 权益 |
| --- | --- | ---: | --- |
| Quick Fix | One time | $9 | 增加 3 次 |
| Voice Audit | One time | $29 | 增加 10 次并解锁风格分析 |
| Monthly Audit | Recurring monthly | $49/month | 每个成功账期获得 30 次 |

复制三个 `price_...` ID 到对应的 `STRIPE_PRICE_*` 变量。服务端只根据这些白名单 Price ID 判断权益，不能接受前端传来的任意次数或金额。

### 5.2 创建 Payment Links

为每个 Price 创建 Payment Link，然后：

1. 要求收集客户邮箱。
2. 在 `After payment` 中选择重定向到：

```text
https://你的域名/billing/success?session_id={CHECKOUT_SESSION_ID}
```

本地测试可以临时使用：

```text
http://localhost:3000/billing/success?session_id={CHECKOUT_SESSION_ID}
```

3. 把三个 `https://buy.stripe.com/...` 地址填入对应的 `NEXT_PUBLIC_STRIPE_LINK_*`。
4. 登录用户点击时，应用动态添加：

```text
?client_reference_id=<internal_user_id>
```

如果链接已经有查询参数，则使用 `&client_reference_id=...`。Stripe 会在完成事件中把该值放入 Checkout Session，供 webhook 关联 Neon 用户。

Payment Link URL 参数文档：https://docs.stripe.com/payment-links/url-parameters

付款后跳转文档：https://docs.stripe.com/payment-links/post-payment

### 5.3 配置 webhook

生产 endpoint：

```text
https://你的域名/api/webhooks/stripe
```

至少订阅：

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `invoice.paid`
- `customer.subscription.deleted`

从 Stripe webhook endpoint 详情复制 `whsec_...` 到 `STRIPE_WEBHOOK_SECRET`。

本地测试：

```powershell
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

把 Stripe CLI 输出的临时 `whsec_...` 填入本机 `.env.local`，重启开发服务器。

Webhook 必须读取原始请求体、验证 Stripe 签名并做幂等处理。官方履约说明：https://docs.stripe.com/checkout/fulfillment

### 5.4 权限发放规则

建议使用数据库事务：

1. 插入 Stripe Event ID；唯一键冲突表示该事件已经处理，直接返回 200。
2. 校验 `client_reference_id` 对应用户存在。
3. 查询 Session line items，匹配环境变量中的 Price ID。
4. 写入 `purchases`。
5. 在 `credit_ledger` 写入正数额度。
6. 提交事务后再异步发送 Brevo 购买通知。

审计扣次也使用数据库事务和负数 ledger 记录，避免两个并发请求使用同一次余额。

退款处理可以放在 MVP 后续，但上线收费前至少要有人工退款和人工冲正 ledger 的操作方式。

## 6. 生成 AUTH_SECRET

在 PowerShell 运行：

```powershell
$bytes = New-Object byte[] 32
[Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
[Convert]::ToBase64String($bytes)
```

把输出填入 `AUTH_SECRET`。生产环境与本机使用不同值；修改生产值会让现有会话失效。

## 7. 上线前检查

- `.env.local` 没有进入版本控制。
- Gemini key 仅服务端可见并已限制 API 范围。
- Neon 使用 SSL，数据库迁移已执行。
- Brevo sender 和模板已验证、启用。
- Stripe 先完整跑通 test mode，再替换为 live mode 的 key、Price、Payment Link 和 webhook secret。
- success page 不直接发放次数。
- webhook 重放不会重复增加次数。
- 魔法链接只保存哈希、15 分钟过期且只能使用一次。
- 分析事件不包含帖子正文、邮箱或支付标识。

