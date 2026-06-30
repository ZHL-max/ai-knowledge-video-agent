import {
  type ResearchNote,
  type ScriptDraft,
  type StoryboardScene,
  type VideoBrief
} from "../schema";

export interface ScriptAndStoryboard {
  script: ScriptDraft;
  storyboard: StoryboardScene[];
}

export interface LLMProvider {
  name: string;
  createScriptAndStoryboard(brief: VideoBrief, research: ResearchNote): Promise<ScriptAndStoryboard>;
}

export class TemplateLLMProvider implements LLMProvider {
  name = "template-llm";

  async createScriptAndStoryboard(brief: VideoBrief, research: ResearchNote): Promise<ScriptAndStoryboard> {
    const sourceUrls = research.sources.map((source) => source.url);
    const sourceAt = (index: number) => sourceUrls[index] ?? sourceUrls[0] ?? "https://openai.com/index/why-language-models-hallucinate/";
    const sections = [
      {
        id: "s1",
        title: "开场：它不是在骗你",
        narration:
          "你有没有遇到过这种情况：问 AI 一个问题，它回答得特别顺，甚至还给出人名、论文、年份。你一查，发现这些细节根本不存在。这个现象叫大模型幻觉。先记住一句话：幻觉不是 AI 在故意撒谎，而是它把听起来合理的内容，当成答案说了出来。",
        sourceUrls: [sourceAt(0)]
      },
      {
        id: "s2",
        title: "大模型到底在做什么",
        narration:
          "大模型的基本动作，是根据前面的文字预测后面最可能出现的文字。它学到的是语言里的模式、关联和表达习惯。这个能力让它能写文章、讲故事、整理知识，但也埋下了一个问题：最像答案的句子，不一定就是事实正确的句子。",
        sourceUrls: [sourceAt(0)]
      },
      {
        id: "s3",
        title: "为什么会一本正经地错",
        narration:
          "很多幻觉看起来很真，是因为模型擅长补全模式。你让它解释一个陌生概念，它会寻找相似的表达结构；你让它给出处，它可能生成一个看起来像论文标题的句子。语言形式越完整，我们越容易误以为内容也可靠。",
        sourceUrls: [sourceAt(1)]
      },
      {
        id: "s4",
        title: "哪些场景最容易翻车",
        narration:
          "幻觉特别容易出现在四类场景：第一，问题太新，训练数据里没有；第二，问题太含糊，上下文不够；第三，你要求它列具体数字、链接、论文；第四，你暗示它必须给答案。模型不一定会主动停下来问：我真的知道吗？",
        sourceUrls: [sourceAt(2)]
      },
      {
        id: "s5",
        title: "怎么降低幻觉",
        narration:
          "最有效的办法不是一句咒语，而是一套流程。先给可靠资料，再让模型只基于资料回答；让它标出来源；对关键数字和引用做二次核验；最后由人审一遍。也就是说，把 AI 当成会写草稿的助手，而不是永远正确的百科全书。",
        sourceUrls: [sourceAt(0), sourceAt(2)]
      },
      {
        id: "s6",
        title: "一个实用判断法",
        narration:
          "看到 AI 的回答，你可以问三个问题：它有没有给出可打开的来源？来源是否真的支持这句话？这件事是否需要最新信息或专业责任？如果三个问题里有一个答不上来，就不要直接转发或照做。",
        sourceUrls: [sourceAt(1)]
      },
      {
        id: "s7",
        title: "结尾：AI 的正确打开方式",
        narration:
          "所以，大模型幻觉的本质，是语言预测能力和事实校验能力之间的缝隙。它很会组织表达，但不天然等于事实机器。会用 AI 的人，不是盲目信它，也不是完全不用它，而是让它生成、让资料约束、让人来把关。",
        sourceUrls: [sourceAt(0), sourceAt(3)]
      }
    ] satisfies ScriptDraft["sections"];

    const script: ScriptDraft = {
      title: "大模型为什么会幻觉？",
      hook: "AI 回答得越自信，就一定越真实吗？",
      sections,
      closing: "关注这个系列，用更清醒的方式理解 AI。",
      hashtags: ["#AI科普", "#大模型", "#人工智能", "#知识科普", "#科技"],
      description:
        "大模型幻觉不是 AI 故意撒谎，而是语言预测与事实校验之间的错位。本期用 2-3 分钟解释它为什么会一本正经地说错，以及普通人如何降低风险。"
    };

    const durations = [18, 22, 23, 24, 25, 20, 22];
    let cursor = 0;
    const kinds: StoryboardScene["visualKind"][] = [
      "hook",
      "concept",
      "comparison",
      "warning",
      "process",
      "recap",
      "closing"
    ];
    const accents = ["#5EEAD4", "#FBBF24", "#A78BFA", "#FB7185", "#60A5FA", "#34D399", "#F97316"];

    const storyboard = sections.map((section, index) => {
      const scene: StoryboardScene = {
        id: `scene-${index + 1}`,
        sectionId: section.id,
        startSeconds: cursor,
        durationSeconds: durations[index] ?? 20,
        visualKind: kinds[index] ?? "concept",
        headline: section.title.replace(/^.*：/, ""),
        narration: section.narration,
        bullets: createBullets(index),
        accent: accents[index] ?? "#5EEAD4",
        sourceUrls: section.sourceUrls
      };
      cursor += scene.durationSeconds;
      return scene;
    });

    return { script, storyboard };
  }
}

export class OpenAICompatibleLLMProvider implements LLMProvider {
  name = "openai-compatible";

  constructor(
    private readonly options: {
      apiKey: string;
      baseUrl?: string;
      model?: string;
    }
  ) {}

  async createScriptAndStoryboard(brief: VideoBrief, research: ResearchNote): Promise<ScriptAndStoryboard> {
    const endpoint = `${this.options.baseUrl ?? "https://api.openai.com/v1"}/chat/completions`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.options.apiKey}`
      },
      body: JSON.stringify({
        model: this.options.model ?? "gpt-4.1-mini",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "你是短视频科普编导。只输出 JSON，字段为 script 与 storyboard。视频面向抖音，中文，轻松但可信。"
          },
          {
            role: "user",
            content: JSON.stringify({ brief, research }, null, 2)
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`LLM request failed: ${response.status} ${await response.text()}`);
    }
    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) throw new Error("LLM response did not include content.");
    return JSON.parse(content) as ScriptAndStoryboard;
  }
}

export function createLLMProviderFromEnv(): LLMProvider {
  const provider = process.env.LLM_PROVIDER ?? "mock";
  if (provider === "openai-compatible") {
    if (!process.env.LLM_API_KEY) {
      throw new Error("LLM_API_KEY is required when LLM_PROVIDER=openai-compatible.");
    }
    return new OpenAICompatibleLLMProvider({
      apiKey: process.env.LLM_API_KEY,
      baseUrl: process.env.LLM_BASE_URL,
      model: process.env.LLM_MODEL
    });
  }
  return new TemplateLLMProvider();
}

function createBullets(index: number): string[] {
  const bullets = [
    ["流畅不等于真实", "幻觉常常很自信", "先看来源再相信"],
    ["核心动作：预测下一个词", "语言模式很强", "事实校验要另做"],
    ["像论文不等于有论文", "像数字不等于真数字", "完整表达会放大信任"],
    ["新信息", "上下文不足", "具体引用和数字", "被迫给答案"],
    ["给资料", "标来源", "查关键事实", "人审后发布"],
    ["来源能打开吗", "来源支持吗", "是否需要最新信息"],
    ["让 AI 生成", "让资料约束", "让人把关"]
  ];
  return bullets[index] ?? ["事实先行", "结构化表达", "人工复核"];
}
