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
    return createShortScriptAndStoryboard(brief, research);

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

function createShortScriptAndStoryboard(brief: VideoBrief, research: ResearchNote): ScriptAndStoryboard {
  const sourceUrls = research.sources.map((source) => source.url);
  const sourceAt = (index: number) =>
    sourceUrls[index] ?? sourceUrls[0] ?? "https://openai.com/index/why-language-models-hallucinate/";
  const isHallucination = brief.topic.includes("幻觉") || brief.topic.toLowerCase().includes("hallucination");
  const sections = isHallucination ? hallucinationShortSections(sourceAt) : genericShortSections(brief.topic, sourceAt);
  const title = isHallucination ? "大模型为什么会幻觉？" : `${brief.topic}，一分钟讲清楚`;
  const durations = scaleDurations([9, 13, 13, 12, 14, 9], Math.min(90, Math.max(60, brief.durationTargetSeconds)));
  const layouts: StoryboardScene["layout"][] = [
    "question-pop",
    "token-factory",
    "truth-map",
    "risk-crossroads",
    "fix-pipeline",
    "recap-formula"
  ];
  const kinds: StoryboardScene["visualKind"][] = ["hook", "concept", "comparison", "warning", "process", "closing"];
  const accents = ["#FF5A5F", "#2563EB", "#F59E0B", "#9B5DE5", "#10B981", "#0EA5E9"];
  let cursor = 0;

  const storyboard = sections.map((section, index) => {
    const scene: StoryboardScene = {
      id: `scene-${index + 1}`,
      sectionId: section.id,
      startSeconds: round(cursor),
      durationSeconds: durations[index] ?? 10,
      visualKind: kinds[index] ?? "concept",
      layout: layouts[index] ?? "question-pop",
      headline: section.title,
      narration: section.narration,
      bullets: section.bullets,
      accent: accents[index] ?? "#2563EB",
      sourceUrls: section.sourceUrls,
      visualPlan: {
        metaphor: section.metaphor,
        composition: section.composition,
        mainIllustration: section.mainIllustration,
        motion: section.motion,
        flow: section.bullets,
        stickers: section.stickers
      }
    };
    cursor += scene.durationSeconds;
    return scene;
  });

  return {
    script: {
      title,
      hook: sections[0]?.narration ?? `用一分钟看懂：${brief.topic}`,
      sections: sections.map(({ bullets, metaphor, composition, mainIllustration, motion, stickers, ...section }) => section),
      closing: isHallucination ? "记住：让 AI 生成草稿，让资料约束边界，让人最后把关。" : `下一步可以把 ${brief.topic} 拆成更细的系列选题。`,
      hashtags: ["#AI科普", "#知识科普", "#科技", "#一分钟讲清楚"],
      description: isHallucination
        ? "用 60-90 秒解释大模型幻觉：为什么它会自信地编出内容，以及普通人怎么降低风险。"
        : `用 60-90 秒解释 ${brief.topic}，保留来源清单，先人审再发布。`
    },
    storyboard
  };
}

type ShortSection = ScriptDraft["sections"][number] & {
  bullets: string[];
  metaphor: string;
  composition: string;
  mainIllustration: string;
  motion: string;
  stickers: string[];
};

function hallucinationShortSections(sourceAt: (index: number) => string): ShortSection[] {
  return [
    {
      id: "s1",
      title: "自信不等于真实",
      narration: "你让 AI 找论文，它三秒给出作者、年份、链接。问题是，这条链路可能根本不存在。幻觉最危险的地方，不是胡说，而是说得太像真的。",
      bullets: ["提问", "自信回答", "来源断开"],
      metaphor: "一句自信回答像一条看似完整、实际断开的证据链。",
      composition: "中心放一个大问号，证据链从左到右断裂，红色警报从断点弹出。",
      mainIllustration: "断裂证据链",
      motion: "链条快速连接，最后一环啪地断开，警报文字弹出。",
      stickers: ["别急着信", "先查来源"],
      sourceUrls: [sourceAt(0)]
    },
    {
      id: "s2",
      title: "它在续写概率",
      narration: "大模型不是先查资料库再回答。它看到前文，会预测下一个最顺口的词。顺口能让答案很流畅，但不能保证事实存在。",
      bullets: ["前文", "概率", "下一个词"],
      metaphor: "模型像一台高速接词机器，沿着最高概率一路往前冲。",
      composition: "词块沿轨道向右滚动，概率柱快速跳动，最高柱被选中。",
      mainIllustration: "概率词轨道",
      motion: "词块加速滑动，概率柱上下跳动，选中的词被推到输出端。",
      stickers: ["顺口", "不等于事实"],
      sourceUrls: [sourceAt(0)]
    },
    {
      id: "s3",
      title: "两条线没对齐",
      narration: "所以要分清两条线：一条是语言概率，一条是证据链。幻觉就是概率线跑得很快，证据链没跟上。",
      bullets: ["概率线", "证据链", "错位"],
      metaphor: "两条赛道同时开跑，概率线冲到前面，证据链落在后面。",
      composition: "两条曲线并排，黄色概率线高速上扬，青色证据线停在后方。",
      mainIllustration: "双轨错位图",
      motion: "两个圆点同时出发，概率点超前，证据点停顿，错位区域变红。",
      stickers: ["像答案", "未核验"],
      sourceUrls: [sourceAt(1)]
    },
    {
      id: "s4",
      title: "这些题最容易翻车",
      narration: "最新消息、具体数字、论文链接、还有你逼它必须回答，最容易让 AI 翻车。遇到这些，先把警报灯打开。",
      bullets: ["新消息", "具体数字", "论文链接", "必须回答"],
      metaphor: "四个风险雷达同时亮起，提醒你先暂停。",
      composition: "中心是 AI 圆点，四个方向弹出风险雷达点。",
      mainIllustration: "四向风险雷达",
      motion: "四个风险点依次亮起，中心警报环快速扩散。",
      stickers: ["高风险", "先暂停"],
      sourceUrls: [sourceAt(2)]
    },
    {
      id: "s5",
      title: "用流程压住幻觉",
      narration: "降低幻觉的办法很朴素：给资料，限定范围，要求标来源，再由人复核。别让 AI 空口发挥。",
      bullets: ["给资料", "限范围", "标来源", "人复核"],
      metaphor: "把 AI 放进流水线，每一步都加一道约束。",
      composition: "四个节点连成一条快速流程线，最后出现通过标记。",
      mainIllustration: "四步约束流程",
      motion: "资料点沿线快速穿过四个节点，每过一站亮一次。",
      stickers: ["约束", "复核"],
      sourceUrls: [sourceAt(0), sourceAt(2)]
    },
    {
      id: "s6",
      title: "正确用法",
      narration: "记住一个公式：AI 负责生成草稿，资料负责约束边界，人负责最后把关。这样它才是助手，不是答案机器。",
      bullets: ["AI 草稿", "资料边界", "人把关", "好助手"],
      metaphor: "三个力合在一起，才把 AI 推向可靠助手。",
      composition: "三个圆点汇入最终答案点，中间用加号和等号连接。",
      mainIllustration: "可靠使用公式",
      motion: "三个圆点依次滑入，等号后最终点放大。",
      stickers: ["别盲信", "会用才香"],
      sourceUrls: [sourceAt(0), sourceAt(3)]
    }
  ];
}

function genericShortSections(topic: string, sourceAt: (index: number) => string): ShortSection[] {
  return [
    {
      id: "s1",
      title: "先抓住问题",
      narration: `${topic} 先别背概念。我们先问一个最简单的问题：它到底解决了什么麻烦？`,
      bullets: ["问题", "场景", "答案"],
      metaphor: "从一个问题点拉出整条解释线。",
      composition: "中心问题点向三处场景发散。",
      mainIllustration: "问题发散图",
      motion: "问题点弹出，三条线快速展开。",
      stickers: ["先看问题"],
      sourceUrls: [sourceAt(0)]
    },
    {
      id: "s2",
      title: "核心机制",
      narration: `${topic} 的核心，可以先看成一条输入到输出的链路。看懂链路，比死记定义更有用。`,
      bullets: ["输入", "处理", "输出"],
      metaphor: "一条从输入到输出的短链路。",
      composition: "三个节点从左到右连接。",
      mainIllustration: "输入输出链路",
      motion: "小点沿链路快速移动。",
      stickers: ["看链路"],
      sourceUrls: [sourceAt(1)]
    },
    {
      id: "s3",
      title: "为什么重要",
      narration: `它重要，是因为会改变成本、效率或判断方式。真正要看的不是名词，而是它改变了哪一步。`,
      bullets: ["成本", "效率", "判断"],
      metaphor: "三根指标柱同时变化。",
      composition: "三个指标点上下跳动。",
      mainIllustration: "变化指标",
      motion: "指标点依次升降，关键点变亮。",
      stickers: ["看变化"],
      sourceUrls: [sourceAt(2)]
    },
    {
      id: "s4",
      title: "常见误区",
      narration: `最常见的误区，是把一个工具当成万能答案。越是听起来神奇，越要回到边界和证据。`,
      bullets: ["万能化", "忽略边界", "缺证据"],
      metaphor: "万能光环被边界线切开。",
      composition: "中心光环被边界线分成两半。",
      mainIllustration: "边界切线",
      motion: "光环放大后被线切开。",
      stickers: ["看边界"],
      sourceUrls: [sourceAt(0)]
    },
    {
      id: "s5",
      title: "怎么使用",
      narration: `实用做法很简单：先给资料，再限定任务，最后人工检查关键结论。流程比一句口号可靠。`,
      bullets: ["给资料", "限任务", "人检查"],
      metaphor: "三步流程把结果压实。",
      composition: "三个流程节点依次亮起。",
      mainIllustration: "三步流程",
      motion: "节点逐个点亮，最后汇总。",
      stickers: ["流程优先"],
      sourceUrls: [sourceAt(1)]
    },
    {
      id: "s6",
      title: "一句话记住",
      narration: `一句话记住 ${topic}：别只看它叫什么，要看它解决什么、边界在哪、证据够不够。`,
      bullets: ["解决什么", "边界在哪", "证据够不够"],
      metaphor: "三个问题合成一个判断框架。",
      composition: "三个检查点汇入最后结论点。",
      mainIllustration: "三问判断",
      motion: "三个检查点依次汇入中心。",
      stickers: ["三问法"],
      sourceUrls: [sourceAt(2)]
    }
  ];
}

function scaleDurations(baseDurations: number[], targetSeconds: number) {
  const total = baseDurations.reduce((sum, value) => sum + value, 0);
  let cursor = 0;
  return baseDurations.map((duration, index) => {
    if (index === baseDurations.length - 1) return Math.max(1, round(targetSeconds - cursor));
    const scaled = round((duration / total) * targetSeconds);
    cursor += scaled;
    return scaled;
  });
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
              "你是短视频科普编导。只输出 JSON，字段为 script 与 storyboard。视频面向抖音，中文，60-90 秒，轻松、可信、图解驱动。每个 storyboard scene 只讲一个点，旁白短促，适合用开放画布、动态图形、箭头、节点和少量大字讲解，不要写成 2-3 分钟长稿。"
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

function round(value: number) {
  return Math.round(value * 100) / 100;
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
