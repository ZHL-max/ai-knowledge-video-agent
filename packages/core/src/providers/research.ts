import { nowIso, type ResearchNote, type Source, type VideoBrief } from "../schema";

export interface ResearchProvider {
  name: string;
  collect(brief: VideoBrief): Promise<ResearchNote>;
}

const hallucinationSources: Source[] = [
  {
    title: "Why language models hallucinate",
    publisher: "OpenAI",
    url: "https://openai.com/index/why-language-models-hallucinate/",
    notes: "Explains hallucination as a mismatch between training objectives and factual correctness."
  },
  {
    title: "What are AI hallucinations?",
    publisher: "IBM Think",
    url: "https://www.ibm.com/think/topics/ai-hallucinations",
    notes: "Gives practical definitions, causes, examples, and mitigation methods."
  },
  {
    title: "What are AI hallucinations?",
    publisher: "Google Cloud",
    url: "https://cloud.google.com/discover/what-are-ai-hallucinations",
    notes: "Summarizes why generative AI can produce confident but inaccurate responses."
  },
  {
    title: "Language Models Can Say What They Know",
    publisher: "arXiv",
    url: "https://arxiv.org/abs/2207.05221",
    notes: "Research reference for model confidence, calibration, and knowing when an answer may be unreliable."
  }
];

export class StaticResearchProvider implements ResearchProvider {
  name = "static-research";

  async collect(brief: VideoBrief): Promise<ResearchNote> {
    const isHallucination = brief.topic.includes("幻觉") || brief.topic.toLowerCase().includes("hallucination");

    if (!isHallucination) {
      return {
        topic: brief.topic,
        summary:
          "MVP 默认研究器会为非样片主题生成一份可替换的基础研究记录。正式运营时应切换到联网搜索或手动来源录入。",
        claims: [
          "每条知识视频都应该先记录来源，再生成脚本。",
          "AI 生成的解释需要经过人工审核后再发布。",
          "抖音发布接口应作为人审后的显式动作，而不是后台自动触发。"
        ],
        sources: hallucinationSources.slice(0, 3),
        checkedAt: nowIso()
      };
    }

    return {
      topic: brief.topic,
      summary:
        "大模型幻觉不是模型在主动撒谎，而是语言模型在按概率生成下一个词时，把听起来合理但缺少事实支撑的内容也流畅地说了出来。常见原因包括训练目标偏向预测文本、检索或上下文不足、问题本身含糊，以及模型缺少可靠的不确定性表达。降低幻觉需要来源约束、检索增强、结构化核验和人工审核共同配合。",
      claims: [
        "幻觉的核心表现是内容流畅、语气自信，但事实、来源或推理链不可靠。",
        "语言模型主要学习预测文本分布，这个目标不等同于保证每个事实陈述正确。",
        "当问题缺少上下文、涉及新信息或要求编造细节时，幻觉风险会上升。",
        "检索增强、引用来源、要求模型表达不确定性和人工复核都能降低风险，但不能彻底消除风险。"
      ],
      sources: hallucinationSources,
      checkedAt: nowIso()
    };
  }
}
