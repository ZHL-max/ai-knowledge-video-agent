import type {
  ScriptDraft,
  StoryboardScene,
  VideoBrief,
  VisualLayout,
  VisualPlan
} from "../schema";

export type CreativeDirection = {
  visualThesis: string;
  palette: string[];
  pacing: string;
  referenceNotes: string[];
};

export type CreativeDirectorOutput = {
  direction: CreativeDirection;
  storyboard: StoryboardScene[];
};

export interface CreativeDirectorAgent {
  name: string;
  plan(input: {
    brief: VideoBrief;
    script: ScriptDraft;
    storyboard: StoryboardScene[];
  }): Promise<CreativeDirectorOutput>;
}

const sceneLayouts: VisualLayout[] = [
  "question-pop",
  "token-factory",
  "truth-map",
  "risk-crossroads",
  "fix-pipeline",
  "checklist",
  "recap-formula"
];

const visualPlans: VisualPlan[] = [
  {
    metaphor: "AI 像一个很会接话的聊天框，突然吐出一张假的论文卡片。",
    composition: "左侧手机聊天，右侧放大镜和弹出的假论文卡，中间用醒目问号连接。",
    mainIllustration: "手机聊天气泡 + 假论文卡 + 放大镜",
    motion: "气泡弹入，论文卡啪地弹出，放大镜轻轻扫过并出现问号。",
    flow: ["提问", "自信回答", "看起来像真的", "查来源"],
    stickers: ["等等", "像真的", "先别信"]
  },
  {
    metaphor: "大模型像一条词语传送带，在猜下一个最顺口的词。",
    composition: "输入框在左，彩色词块沿传送带移动，右侧拼成句子。",
    mainIllustration: "词块传送带",
    motion: "词块逐个滑动，箭头把问题推向下一词预测。",
    flow: ["前文", "预测", "下一个词", "一句话"],
    stickers: ["不是查百科", "是在接龙"]
  },
  {
    metaphor: "一边是听起来合理，一边是证据支持，二者不是同一条路。",
    composition: "画面中间分成两条彩色路线，左边通向笑脸气泡，右边通向证据夹。",
    mainIllustration: "双路线地图",
    motion: "小圆点先走向像答案路线，再被箭头拉回证据路线。",
    flow: ["像答案", "不等于", "有证据", "才可靠"],
    stickers: ["形式很完整", "事实要另查"]
  },
  {
    metaphor: "幻觉高发场景像四个岔路口警示牌。",
    composition: "中心是 AI 小助手，四个方向箭头分别指向新信息、模糊问题、具体数字、被迫回答。",
    mainIllustration: "四向路牌",
    motion: "四个警示牌依次竖起，最后汇聚成一个注意标记。",
    flow: ["新信息", "问题模糊", "要数字", "必须回答"],
    stickers: ["高危", "要复核"]
  },
  {
    metaphor: "防幻觉是一条生产线：资料进来，答案出去，中间必须过检查站。",
    composition: "从左到右放四个大节点，用粗箭头连接成流水线。",
    mainIllustration: "四步流程管道",
    motion: "资料卡沿箭头通过四个节点，每过一站盖一个通过章。",
    flow: ["给资料", "限范围", "标来源", "人复核"],
    stickers: ["流程比咒语有用", "别跳过审核"]
  },
  {
    metaphor: "普通用户只要拿出三张检查卡，就能快速判断风险。",
    composition: "三张卡片像抽卡一样排开，每张都有一个大勾和问题。",
    mainIllustration: "三张检查卡",
    motion: "卡片依次翻开，勾选时出现轻微弹跳。",
    flow: ["来源能打开吗", "真的支持吗", "需要最新信息吗"],
    stickers: ["三问法", "转发前看一眼"]
  },
  {
    metaphor: "正确使用 AI 是一个公式：AI 生成 + 资料约束 + 人类把关 = 好助手。",
    composition: "四个彩色积木块组成公式，最后合成一个亮色结论牌。",
    mainIllustration: "公式积木",
    motion: "积木块依次落下，等号后弹出好助手徽章。",
    flow: ["AI 生成", "资料约束", "人类把关", "好助手"],
    stickers: ["别盲信", "会用才香"]
  }
];

const accents = ["#FF6B6B", "#4D96FF", "#FFB703", "#9B5DE5", "#06D6A0", "#F15BB5", "#00BBF9"];

export class BrightExplainerDirector implements CreativeDirectorAgent {
  name = "bright-explainer-director";

  async plan(input: {
    brief: VideoBrief;
    script: ScriptDraft;
    storyboard: StoryboardScene[];
  }): Promise<CreativeDirectorOutput> {
    return {
      direction: {
        visualThesis:
          "用亮色卡通图解把抽象的大模型幻觉讲成一场轻松的闯关说明，每句话都配一个可见动作。",
        palette: ["#FFF7D6", "#7BDFF2", "#FF6B6B", "#06D6A0", "#9B5DE5", "#263238"],
        pacing:
          "前 3 秒制造冲突，每 15-25 秒换一个主图解，所有解释都靠箭头、卡片、流程和检查表推进。",
        referenceNotes: [
          "参考优秀动画讲解视频的单场景单观点原则：每个画面只服务一个 takeaway。",
          "参考短视频静音观看习惯：保留大字幕，但让字幕成为图解的补充，而不是主画面。",
          "参考信息图动画：流程箭头比长段文字更容易解释因果和步骤。"
        ]
      },
      storyboard: input.storyboard.map((scene, index) => ({
        ...scene,
        layout: scene.layout ?? sceneLayouts[index] ?? "question-pop",
        accent: accents[index] ?? scene.accent,
        visualPlan: scene.visualPlan ?? visualPlans[index] ?? visualPlans[0]
      }))
    };
  }
}
