# 使用手册

## 1. 启动

```bash
pnpm install
Copy-Item .env.example .env
pnpm dev
```

浏览器打开 `http://127.0.0.1:5173`。

## 2. 创建视频任务

在左侧输入选题，例如：

```text
大模型为什么会幻觉
```

点击 `+` 创建任务。

## 3. 生成内容

点击 `生成`，系统会依次创建：

- 资料与来源清单
- 脚本
- 分镜
- 配音资产
- 字幕时间线
- 发布包草稿

生成结果保存在 `data/runs/<run_id>/`。

## 4. 渲染视频

点击 `渲染`，系统调用 Remotion 输出：

```text
data/runs/<run_id>/output/video.mp4
data/runs/<run_id>/output/cover.png
```

## 5. 审核

发布前检查：

- 来源链接是否真实可打开
- 脚本是否有夸大、误导或未支撑结论
- 字幕是否遮挡画面
- 标题、简介、话题是否符合账号定位

## 6. 发布

未配置抖音凭据时，使用：

```text
data/runs/<run_id>/publish-package/
```

其中包含标题、简介、话题和来源清单。

配置抖音凭据后，点击 `抖音确认` 会在你确认后调用官方发布接口。
