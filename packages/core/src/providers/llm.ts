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
    const sourceAt = (index: number) =>
      sourceUrls[index] ?? sourceUrls[0] ?? "https://openai.com/index/why-language-models-hallucinate/";

    const sections = [
      {
        id: "s1",
        title: "开场：它不是在骗你",
        narration:
          "你问 AI 一个问题，它啪一下给出答案，甚至还顺手编出论文、作者和年份。听起来很真，对吧？但你一查，可能根本没有这篇论文。这就是大模型幻觉。它不是故意骗你，而是把最像答案的句子，说得太像真的了。",
        sourceUrls: [sourceAt(0)]
      },
      {
        id: "s2",
        title: "机制：它在接文字龙",
        narration:
          "先把 AI 想成一个超级会接话的文字接龙高手。它看到前面的词，就预测后面最可能出现什么词。问题是，顺口不等于真实。它能把一句话接得很漂亮，但这件事到底有没有发生，还需要另一套事实检查。",
        sourceUrls: [sourceAt(0)]
      },
      {
        id: "s3",
        title: "误区：像答案不等于有证据",
        narration:
          "幻觉最迷人的地方，是它长得很像答案。格式完整，语气自信，甚至数字都很整齐。可知识科普不能只看它像不像，还要看证据链。一个说法如果没有可靠来源支撑，再流畅也只能先放进待核验区。",
        sourceUrls: [sourceAt(1)]
      },
      {
        id: "s4",
        title: "高危：四种问题最容易翻车",
        narration:
          "哪几类问题最容易让 AI 翻车？第一，刚发生的新消息；第二，问题太含糊；第三，要求列具体数字、链接、论文；第四，你逼它必须给答案。遇到这些场景，就要把警报灯打开：先别转发，先查来源。",
        sourceUrls: [sourceAt(2)]
      },
      {
        id: "s5",
        title: "流程：四步降低幻觉",
        narration:
          "降低幻觉，不靠一句神奇提示词，而靠流程。第一，先给可靠资料；第二，限定它只能基于资料回答；第三，让它把来源标出来；第四，关键结论由人复核。把 AI 放进流程里，它才更像助手，不像瞎猜机器。",
        sourceUrls: [sourceAt(0), sourceAt(2)]
      },
      {
        id: "s6",
        title: "工具：三问检查卡",
        narration:
          "普通人怎么快速判断？拿出三张检查卡。第一，来源能打开吗？第二，来源真的支持这句话吗？第三，这件事需要最新信息或专业责任吗？只要有一张卡打叉，就不要直接照做，更不要直接发给别人。",
        sourceUrls: [sourceAt(1)]
      },
      {
        id: "s7",
        title: "结尾：正确打开 AI",
        narration:
          "所以，大模型幻觉不是玄学，而是语言预测和事实核验之间的缺口。正确打开方式是：让 AI 生成草稿，让资料约束边界，让人来把关。记住这个公式，你就能更安心地用 AI，而不是被它牵着走。",
        sourceUrls: [sourceAt(0), sourceAt(3)]
      }
    ] satisfies ScriptDraft["sections"];

    const script: ScriptDraft = {
      title: "大模型为什么会幻觉？",
      hook: "AI 回答得越自信，就一定越真实吗？",
      sections,
      closing: "关注这个系列，用更清醒、更好玩的方式理解 AI。",
      hashtags: ["#AI科普", "#大模型", "#人工智能", "#知识科普", "#科技"],
      description:
        "AI 有时会把听起来很合理的内容说得像真的。本期用图解和流程箭头讲清楚：大模型为什么会幻觉，以及普通人如何快速降低风险。"
    };

    const durations = [18, 22, 23, 24, 25, 20, 22];
    const kinds: StoryboardScene["visualKind"][] = [
      "hook",
      "concept",
      "comparison",
      "warning",
      "process",
      "recap",
      "closing"
    ];
    const accents = ["#FF6B6B", "#4D96FF", "#FFB703", "#9B5DE5", "#06D6A0", "#F15BB5", "#00BBF9"];
    let cursor = 0;

    const storyboard = sections.map((section, index) => {
      const scene: StoryboardScene = {
        id: `scene-${index + 1}`,
        sectionId: section.id,
        startSeconds: cursor,
        durationSeconds: durations[index] ?? 20,
        visualKind: kinds[index] ?? "concept",
        layout: "question-pop",
        headline: section.title.replace(/^.*：/, ""),
        narration: section.narration,
        bullets: createBullets(index),
        accent: accents[index] ?? "#4D96FF",
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
              "你是短视频科普编导。只输出 JSON，字段为 script 与 storyboard。视频面向抖音，中文，轻松、可信、图解驱动。每个 storyboard scene 必须适合用亮色图形、流程箭头和可爱卡片讲解。"
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
    ["像真的", "不一定是真的", "先查来源"],
    ["前文", "预测下一个词", "拼成一句话"],
    ["听起来合理", "格式很完整", "证据要另查"],
    ["新消息", "问题模糊", "数字/链接/论文", "必须回答"],
    ["给资料", "限范围", "标来源", "人复核"],
    ["来源能打开吗", "真的支持吗", "需要最新信息吗"],
    ["AI 生成", "资料约束", "人来把关"]
  ];
  return bullets[index] ?? ["图解", "流程", "复核"];
}
