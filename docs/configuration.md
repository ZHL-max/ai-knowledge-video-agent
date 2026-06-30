# 配置说明

## 环境变量

复制 `.env.example`：

```bash
Copy-Item .env.example .env
```

## LLM

默认使用模板化脚本生成器，便于稳定复现样片。

```text
LLM_PROVIDER=mock
```

后续接入 OpenAI-compatible 服务时使用：

```text
LLM_PROVIDER=openai-compatible
LLM_BASE_URL=https://api.openai.com/v1
LLM_API_KEY=...
LLM_MODEL=gpt-4.1-mini
```

## TTS

开发默认：

```text
TTS_PROVIDER=edge
TTS_VOICE=zh-CN-XiaoxiaoNeural
TTS_RATE=-4%
```

如果 Edge 在线语音在当前网络返回 403 或连接失败，系统会自动生成同等时长的静音测试音频，保证脚本、字幕和渲染流程可继续验证。正式运营建议接入稳定的云端 TTS。

测试用：

```text
TTS_PROVIDER=mock
```

OpenAI TTS：

```text
TTS_PROVIDER=openai
OPENAI_API_KEY=...
OPENAI_TTS_MODEL=gpt-4o-mini-tts
OPENAI_TTS_VOICE=alloy
```

## 数据目录

默认：

```text
AKVA_DATA_DIR=./data/runs
```

该目录不提交 Git。

## 密钥原则

- `.env` 不提交。
- 不把 token 写进 README、脚本、测试或样例。
- 抖音 access token、GitHub token、LLM/TTS key 只保存在本机环境变量或 `.env`。
