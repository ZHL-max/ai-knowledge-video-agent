# 开发说明

## 架构

- `packages/core`：schema、文件存储、流水线、服务商适配器。
- `packages/core/src/providers/creative-director.ts`：创意导演 agent，为每个分镜生成画风、构图、图解和流程箭头计划。
- `apps/api`：Fastify API，负责控制台请求和触发渲染。
- `apps/console`：React/Vite 本地控制台。
- `apps/renderer`：Remotion 视频模板和渲染脚本。

## 数据流

```text
VideoBrief
  -> ResearchNote
  -> ScriptDraft
  -> StoryboardScene[]
  -> CreativeDirection + VisualPlan
  -> NarrationAsset + SubtitleCue[]
  -> RenderManifest
  -> MP4/Cover
  -> PublishPackage
```

## 添加新服务商

在 `packages/core/src/providers/` 新增实现：

- `LLMProvider`
- `TTSProvider`
- `ResearchProvider`
- `PublisherProvider`

保持接口返回结构通过 Zod schema 校验。

## 测试

```bash
pnpm test
pnpm typecheck
pnpm build
```

测试默认使用 `MockTTSProvider`，不会产生真实云端调用。

## 渲染

```bash
pnpm sample
pnpm --filter @aivideo/renderer render:latest
```

输出：

```text
data/runs/<run_id>/output/video.mp4
data/runs/<run_id>/output/cover.png
```
