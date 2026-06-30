# Contributing

## Commit 风格

使用简洁、明确的提交信息：

```text
feat: add douyin publish package export
fix: keep subtitles within video safe area
docs: explain tts provider configuration
test: cover storyboard timing validation
```

## 代码要求

- 结构化数据必须经过 Zod 校验。
- 新增外部服务接入必须提供 mock 或无密钥测试路径。
- 不提交 `.env`、token、账号凭据或生成视频资产。
- UI 改动需要在桌面和移动宽度下检查文字不重叠。

## 发布前检查

```bash
pnpm test
pnpm typecheck
pnpm build
```
