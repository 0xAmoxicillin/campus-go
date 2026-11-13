# 本地封面图资源（covers/）

本目录存放「校园行」前端所用的全部卡片封面图，**均为本地静态文件，运行时零外部 http(s) 请求**（与 README 一致：离线可用、不依赖任何外部图床）。

- 格式：WebP，约 1200×640，单张 ≤ 120 KB，合计 ≈ 1.7 MB。
- 来源：真实照片，来自 [Pexels](https://www.pexels.com/)（Pexels License，免费可商用、无需署名）。所有图片均为自由许可的真实摄影作品，非 AI 生成、非插画。
- 语义：M1 阶段即采用随机真实照片配卡片的呈现（用户记忆中的「picsum」质感），因此本批封面只求「照片质感」，不要求与标题一一对应。

## 文件名清单与来源（25 张）

> pid 为 Pexels 图片 ID，可经 `https://www.pexels.com/photo/<slug>-<pid>/` 溯源。

| 文件名 | Pexels ID | 主题 |
| --- | --- | --- |
| campus-open-day.webp | 1766838 | 校园开放日 |
| campus-ride.webp | 1779487 | 骑行 |
| campus-hack.webp | 434807 | 代码 / 技术 |
| campus-music.webp | 1766839 | 音乐现场 |
| campus-launch.webp | 3184321 | 活动启动 |
| campus-guide.webp | 210318 | 指南 / 引导 |
| campus-story.webp | 3184338 | 故事 / 记录 |
| campus-scenery.webp | 1438075 | 风景 |
| campus-lab.webp | 936130 | 实验室 |
| campus-reading.webp | 326519 | 阅读 |
| campus-club.webp | 3184339 | 社团 |
| campus-city.webp | 936150 | 城市 |
| lab-tour.webp | 936130 | 实验室参观（后端 seed） |
| ginkgo-ride.webp | 1779487 | 银杏骑行（后端 seed） |
| hack-night.webp | 434807 | 通宵黑客松（后端 seed） |
| newyear-concert.webp | 1766839 | 跨年音乐会（后端 seed） |
| signup-guide.webp | 210318 | 报名指南（后端 seed） |
| behind-scenes.webp | 3184338 | 幕后故事（后端 seed） |
| city-orienteering.webp | 936150 | 城市定向（后端 seed） |
| post-signup.webp | 1766838 | 资讯·报名（后端 seed） |
| post-behind.webp | 3184338 | 资讯·幕后（后端 seed） |
| post-ginkgo.webp | 1438075 | 资讯·银杏（后端 seed） |
| post-lab-review.webp | 936130 | 资讯·实验室回顾（后端 seed） |
| post-hack-preview.webp | 434807 | 资讯·黑客松预告（后端 seed） |
| post-volunteer.webp | 3184321 | 资讯·志愿者（后端 seed） |

## 引用覆盖

这 25 个文件名共同覆盖：

- 前端 mock 的 7 条 `coverUrl`（`mockData.ts`：`campus-open-day / campus-ride / campus-hack / campus-music / campus-launch / campus-guide / campus-story`）
- 官网新增板块引用的 8 个 `campus-*`（`HomePage.tsx` 的 `gallery`）
- 后端 seed 的 13 条 `coverUrl`（`lab-tour / ginkgo-ride / hack-night / newyear-concert / signup-guide / behind-scenes / city-orienteering / post-signup / post-behind / post-ginkgo / post-lab-review / post-hack-preview / post-volunteer`）

前端代码中 `apps/web/src` 不得出现任何 http(s) 图片引用；封面失败时的优雅降级由 `CoverImage` 组件处理。
