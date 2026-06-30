# PostTrust Landing Page 需求文档

## 1. 页面目标

PostTrust 首页不是传统宣传页，而是可以立即使用的 LinkedIn Post 审计工具。

页面需要在一次访问中完成三件事：

1. 让目标用户在 5 秒内理解：这是检查 LinkedIn 内容是否像 AI 套话的工具。
2. 让用户不需要阅读长篇介绍，就能粘贴帖子并开始免费审计。
3. 在用户看到真实诊断价值后，引导其购买 3 次、10 次或月度 30 次审计。

主转化事件：提交第一篇 LinkedIn Post。

次转化事件：完成邮箱验证、查看结果、复制改写、购买次数。

## 2. 核心受众

首要受众是每周发布 1-3 次 LinkedIn 内容、但不喜欢高频社交的 B2B 创始人和独立顾问。他们通常用内容代替主动寒暄，希望帖子带来客户、合作或人才，但担心 AI 辅助写作让自己看起来像没有真实经验的“伪专家”。

页面不应面向“抓出谁用了 AI”的围观用户。所有表达都要围绕发布者自己的可信度、经验感和获客质量。

## 3. 核心定位与文案

建议品牌名：`PostTrust`

建议产品描述：`LinkedIn AI Slop Audit`

页面主要使用英文，因为用户生产的是英文 LinkedIn 内容；本文档使用中文解释。

### 首屏文案

H1：

> Make your LinkedIn post sound experienced, not AI-generated.

辅助文案：

> Paste a draft. PostTrust finds vague claims, recycled LinkedIn clichés, fake-expert signals, and missing evidence, then shows you how to make it sound like you.

输入框占位：

> Paste your LinkedIn post here...

主按钮：

> Audit my post

按钮下微文案：

> One full audit is free. No LinkedIn access required.

避免使用：`Humanize any AI text`、`Beat AI detectors`、`100% human score`。这些表达会把产品带到低信任的 AI 检测赛道，也无法兑现。

## 4. 页面结构

### 4.1 顶部导航

高度控制在 56-64px，保持工具感。

左侧：PostTrust 标志与名称。

右侧：

- `How it works`
- `Pricing`
- 未登录时显示 `Sign in`
- 已登录时显示剩余次数，例如 `8 audits left`，点击打开账号菜单

移动端只保留品牌、剩余次数和菜单图标。

### 4.2 首屏工具区

首屏采用单列、居中但不做夸张大标题。桌面端内容最大宽度约 880px，输入区是页面视觉中心。

从上到下：

1. 产品类别短标签：`LinkedIn AI Slop Audit`
2. H1 和一段辅助文案
3. 内容类型切换：`Post` / `Article`
4. LinkedIn Post 输入框
5. 可折叠的上下文设置
6. 主操作按钮
7. 隐私与免费额度微文案

`Post` 默认选中并完整可用。`Article` 显示 `Basic audit` 标记，只提供文章可信度检查，不承诺完整逐段改写。

输入框要求：

- 桌面端初始高度约 280px，移动端约 220px。
- 显示字符数，Post 建议上限 3,000 字符。
- 支持纯文本粘贴，不解析富文本和 LinkedIn URL。
- 少于 80 个字符时禁止提交并给出明确提示。
- 草稿自动保存在浏览器本地，邮箱验证跳转后可以恢复。

上下文设置默认折叠，避免首屏像问卷：

- `Who is this for?`：目标读者，可选输入
- `What should this post achieve?`：Awareness / Leads / Hiring / Launch / Conversation
- `Keep my tone`：默认开启

首屏底部需要露出下一部分标题或样例评分的一小部分，让用户知道下方仍有内容。

### 4.3 即时样例结果

该区域不放静态营销插画，而展示一段真实、可检查的短帖样例及其诊断。

左侧或上方显示原句：

> Success isn't about working harder. It's about working smarter and embracing the journey.

右侧或下方显示：

- `AI Slop Score: 82`
- `Generic claim`
- `No concrete experience`
- `LinkedIn cliché`

再给一行更具体的修改方向：

> Replace the universal lesson with the decision you made, what changed, and one number that proves it.

这里的目标是让用户理解评分不是“AI 概率”，而是可解释的信任风险。

### 4.4 评分维度

使用紧凑的六列或两行网格，不使用一组夸张营销卡片。

- Empty language
- Fake-expert signals
- LinkedIn clichés
- Missing lived experience
- Missing evidence
- Voice mismatch

每项只用一句结果导向说明，例如：

> Finds advice that sounds confident but says nothing testable.

### 4.5 工作方式

使用三步横向流程，移动端改为纵向：

1. `Paste your draft`
2. `See what weakens trust`
3. `Rewrite with real details`

不要声称可以证明文本由 AI 生成。页面必须明确：

> PostTrust evaluates writing signals, not authorship. A human can write generic copy, and AI can help produce specific copy.

### 4.6 目标用户场景

用四个短场景替代泛泛的 testimonial：

- A founder announcing a product decision
- A consultant turning project experience into a lead-generating post
- A ghostwriter checking whether a draft still sounds like the client
- A content lead reviewing posts before executive approval

早期没有真实客户证言时，不展示虚构头像、公司 Logo 或引语。

### 4.7 定价

定价区域展示三个可购买方案，Free 不需要单独做大卡片。

| 方案 | 价格 | 页面文案 | 权益 |
| --- | ---: | --- | --- |
| Quick Fix | $9 | Fix the posts you need to publish now | 3 次完整审计与改写 |
| Voice Audit | $29 | Build a repeatable standard for sounding like you | 个人风格分析 + 10 次优化 |
| Monthly Audit | $49/month | A pre-publish trust check for every working week | 每个成功账期 30 次审计 |

推荐突出 `Quick Fix`，因为它是最容易验证的首次付费，不要用视觉手段强推订阅。

按钮分别为：

- `Get 3 audits`
- `Build my voice profile`
- `Start monthly audits`

用户未登录时点击购买，先发送邮箱魔法链接；登录后跳转 Stripe Payment Link。链接动态附带当前用户的 `client_reference_id`。

### 4.8 FAQ

只回答购买前真实阻力：

1. `Is this an AI detector?`
   No. It identifies writing patterns that reduce trust and explains how to improve them.
2. `Will you invent personal stories for me?`
   No. Missing facts are requested or marked as placeholders; the rewrite must not fabricate experience.
3. `Do I need to connect LinkedIn?`
   No. Paste a draft; PostTrust does not require LinkedIn account access.
4. `What happens to my drafts?`
   Explain storage duration and deletion controls once implemented. Do not promise immediate deletion if audits are stored in Neon.
5. `Can I use my credits on another device?`
   Yes. Credits are attached to the verified email account.
6. `Does Article work the same way?`
   Article receives a basic trust audit in MVP; full Post rewriting is the primary experience.

### 4.9 页脚

保持简洁：品牌、Privacy、Terms、Contact、删除账号/数据入口。不要重复整套导航和营销文案。

## 5. 登录与首次审计流程

1. 用户粘贴帖子并点击 `Audit my post`。
2. 如果未登录，弹出轻量邮箱对话框；原稿留在页面且同步到 `localStorage`。
3. 用户输入邮箱，可选择一个默认不勾选的营销邮件同意框。
4. 页面显示 `Check your inbox`，并提供 60 秒后的重发操作。
5. Brevo 发送 15 分钟有效、仅可使用一次的登录链接。
6. 用户打开链接后回到首页，恢复草稿并自动开始首次免费审计。
7. 完成后进入 `/audit/[id]`。

登录邮件属于交易邮件。只有明确勾选营销同意的用户，才能加入 Brevo 营销联系人列表。

## 6. 支付流程

1. 已登录用户点击套餐按钮。
2. 前端从公开环境变量读取对应 Payment Link URL，并附加服务端用户 ID 作为 `client_reference_id`。
3. Stripe 托管收款，并在完成后重定向至 `/billing/success?session_id={CHECKOUT_SESSION_ID}`。
4. success page 显示 `Confirming your purchase...`，通过自己的 API 查询订单状态。
5. Stripe webhook 验签成功后，在 Neon 写入 purchase 和 credit ledger。
6. 页面检测到入账后显示新余额和 `Audit a post` 按钮。

前端不得自行增加余额，也不能只根据 success URL 判断支付成功。

## 7. 结果页到付费的衔接

免费结果应完整体现产品能力，但限制持续使用，而不是故意给出没有价值的半份报告。

免费首篇包含：

- 总分和置信度
- 六项维度分
- 最重要的 3 个问题及原文定位
- 一版保守真人改写
- 缺失事实问题清单

结果之后展示：

> You fixed this post. Keep the same standard for the next one.

主付费按钮：`Get 3 more audits for $9`

次按钮：`See all plans`

## 8. 视觉方向

关键词：可信、编辑感、安静、具体、工作导向。

建议色彩：

- 页面背景：近白灰 `#F7F8F6`
- 主文本：墨黑 `#171A18`
- 主操作：深绿 `#176B4D`
- 风险高亮：砖红 `#B5473C`
- 警告：琥珀 `#B7791F`
- 信息与链接：LinkedIn 邻近蓝但不仿冒品牌 `#2867B2`

不使用紫色渐变、发光球体、拟物 AI 机器人或大面积深蓝背景。评分与问题类型使用颜色、图标和文本共同表达，不能只依赖颜色。

字体可使用 Geist Sans；诊断原文片段可使用 Geist Mono。卡片圆角不超过 8px，页面区块保持无框，只有输入工具、结果项和定价方案使用边框。

## 9. 响应式要求

- 360px 宽度下按钮文字、套餐价格和评分标签不得溢出。
- 移动端主按钮固定为输入区内的自然文档流，不做遮挡内容的悬浮 CTA。
- 桌面端首屏在 768px 高度时仍需露出下一部分内容。
- 内容类型、发布目标等控件需要稳定尺寸，切换状态不能引发布局跳动。
- 所有交互元素最小触控区域为 44px。

## 10. 状态与错误

必须设计以下状态：

- 空输入、输入过短、超过字符限制
- 魔法链接发送中、已发送、频率受限、过期、已使用
- 审计排队、生成中、结构化输出校验失败、可重试
- 免费额度已用完
- Stripe 跳转中、等待 webhook、支付成功、支付失败或取消
- 次数扣减冲突与服务端重试
- Gemini、Neon、Brevo 暂时不可用

错误文案应告诉用户下一步，不显示供应商响应、堆栈或内部 ID。

## 11. 分析事件

- `landing_viewed`
- `draft_started`
- `audit_clicked`
- `magic_link_requested`
- `email_verified`
- `free_audit_completed`
- `result_viewed`
- `rewrite_copied`
- `pricing_viewed`
- `payment_link_clicked`
- `purchase_confirmed`

不得把帖子正文、邮箱、魔法链接或 Stripe Session ID 发送到分析平台。

## 12. MVP 验收标准

1. 新用户能在首页完成粘贴、邮箱验证和一次免费审计。
2. 用户无需连接 LinkedIn，也能理解产品用途和输出边界。
3. 登录跳转后草稿不丢失。
4. 三个付费按钮指向正确的 Stripe Payment Link，并携带当前用户关联 ID。
5. 只有验签通过且幂等处理成功的 webhook 才能增加次数。
6. 用户可在另一台设备通过同一邮箱登录并看到相同余额。
7. 页面在手机和桌面端无文本溢出、遮挡或布局跳动。

