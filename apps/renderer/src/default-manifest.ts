import type { RenderManifest } from "@aivideo/core";

export const defaultManifest: RenderManifest = {
  runId: "preview",
  title: "大模型为什么会幻觉？",
  platform: "douyin",
  width: 1080,
  height: 1920,
  fps: 30,
  durationSeconds: 12,
  scenes: [
    {
      id: "preview-scene",
      sectionId: "preview",
      startSeconds: 0,
      durationSeconds: 12,
      visualKind: "hook",
      layout: "question-pop",
      headline: "流畅不等于真实",
      narration: "AI 回答得越自信，就一定越真实吗？",
      bullets: ["先看来源", "再看结论", "最后人审"],
      accent: "#5EEAD4",
      sourceUrls: ["https://openai.com/index/why-language-models-hallucinate/"]
    }
  ],
  subtitles: [
    {
      startSeconds: 0,
      endSeconds: 12,
      text: "AI 回答得越自信，就一定越真实吗？"
    }
  ],
  sources: [
    {
      title: "Why language models hallucinate",
      publisher: "OpenAI",
      url: "https://openai.com/index/why-language-models-hallucinate/",
      notes: "Preview source"
    },
    {
      title: "What are AI hallucinations?",
      publisher: "IBM Think",
      url: "https://www.ibm.com/think/topics/ai-hallucinations",
      notes: "Preview source"
    },
    {
      title: "What are AI hallucinations?",
      publisher: "Google Cloud",
      url: "https://cloud.google.com/discover/what-are-ai-hallucinations",
      notes: "Preview source"
    }
  ],
  createdAt: new Date().toISOString()
};
