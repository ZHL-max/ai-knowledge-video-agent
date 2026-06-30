import {
  AbsoluteFill,
  Audio,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig
} from "remotion";
import type { RenderManifest, StoryboardScene, SubtitleCue } from "@aivideo/core";

const ink = "#17212B";
const paper = "#FFF7EA";
const softInk = "rgba(23,33,43,0.16)";

export const KnowledgeVideo = ({ manifest }: { manifest: RenderManifest }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const seconds = frame / fps;
  const scene = findScene(manifest.scenes, seconds);
  const cue = findCue(manifest.subtitles, seconds);
  const sceneProgress = scene
    ? Math.min(1, Math.max(0, (seconds - scene.startSeconds) / scene.durationSeconds))
    : 0;

  return (
    <AbsoluteFill
      style={{
        background: paper,
        color: ink,
        fontFamily:
          "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Microsoft YaHei, sans-serif",
        overflow: "hidden"
      }}
    >
      {manifest.narration?.audioPublicPath ? <Audio src={staticFile(manifest.narration.audioPublicPath)} /> : null}
      <IllustratedCanvas scene={scene} progress={sceneProgress} />
      <PlainCaption cue={cue} />
    </AbsoluteFill>
  );
};

const IllustratedCanvas = ({ scene, progress }: { scene?: StoryboardScene; progress: number }) => {
  if (!scene) return null;
  const palette = paletteFor(scene);
  return (
    <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0 }}>
      <defs>
        <pattern id="paper-specks" width="120" height="120" patternUnits="userSpaceOnUse">
          <circle cx="18" cy="24" r="2" fill="rgba(23,33,43,0.06)" />
          <circle cx="74" cy="68" r="1.6" fill="rgba(23,33,43,0.05)" />
          <circle cx="106" cy="32" r="1.4" fill="rgba(23,33,43,0.045)" />
        </pattern>
        <filter id="soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="12" stdDeviation="12" floodColor="#17212B" floodOpacity="0.13" />
        </filter>
      </defs>

      <rect width="1080" height="1920" fill={palette.bg} />
      <rect width="1080" height="1920" fill="url(#paper-specks)" />
      <path d="M80 1390 C260 1324 432 1330 560 1374 C704 1424 844 1416 1010 1354" fill="none" stroke={softInk} strokeWidth="5" />

      <ScenePicture scene={scene} progress={progress} palette={palette} />
    </svg>
  );
};

const ScenePicture = ({ scene, progress, palette }: DiagramProps) => {
  switch (scene.layout) {
    case "token-factory":
      return <ProbabilityMachine scene={scene} progress={progress} palette={palette} />;
    case "truth-map":
      return <EvidenceAnchor scene={scene} progress={progress} palette={palette} />;
    case "risk-crossroads":
      return <RiskRadar scene={scene} progress={progress} palette={palette} />;
    case "fix-pipeline":
      return <GuardrailPipeline scene={scene} progress={progress} palette={palette} />;
    case "recap-formula":
      return <ReliableFormula scene={scene} progress={progress} palette={palette} />;
    case "checklist":
      return <GuardrailPipeline scene={scene} progress={progress} palette={palette} />;
    case "question-pop":
    default:
      return <BrokenSourceChain scene={scene} progress={progress} palette={palette} />;
  }
};

const BrokenSourceChain = ({ scene, progress, palette }: DiagramProps) => {
  const chain = Math.min(1, progress * 2.8);
  const crack = springValue(progress, 0.4);
  const answerTilt = interpolate(progress, [0, 1], [-8, 5]);
  return (
    <g>
      <SceneTitle scene={scene} color={palette.hot} />
      <QuestionMark x={226} y={560} color={palette.blue} progress={progress} />
      <LanguageEngine x={390} y={500} color={palette.blue} hot={palette.hot} progress={progress} />

      <MovingDot x1={282} y1={650} x2={442} y2={662} progress={chain} color={palette.blue} />
      <path d="M286 650 C340 624 388 628 442 662" fill="none" stroke={palette.blue} strokeWidth="9" strokeLinecap="round" strokeDasharray={`${chain * 240} 240`} />

      <g transform={`translate(628 574) rotate(${answerTilt})`} filter="url(#soft-shadow)">
        <path d="M0 34 C54 -2 168 -6 236 28 C280 50 282 112 230 142 C160 182 44 162 10 118 C-10 92 -10 56 0 34Z" fill="#FFFFFF" stroke={ink} strokeWidth="6" />
        <text x="54" y="78" fontSize="36" fontWeight="900" fill={ink}>
          像答案
        </text>
        <text x="46" y="118" fontSize="25" fontWeight="800" fill={palette.hot}>
          但来源断开
        </text>
      </g>

      <g opacity={crack}>
        <path d="M720 760 l34 38 l-22 28 l40 44" fill="none" stroke={palette.hot} strokeWidth="8" strokeLinecap="round" />
        <text x="344" y="1030" fontSize="42" fontWeight="900" fill={palette.hot}>
          不是胡说最吓人，是说得太像真的
        </text>
      </g>

      <FlowText items={scene.bullets} y={1210} palette={palette} progress={progress} />
    </g>
  );
};

const ProbabilityMachine = ({ scene, progress, palette }: DiagramProps) => {
  const phase = loop(progress, 3);
  const selectedX = interpolate(phase, [0, 1], [230, 840]);
  const bars = [0.35, 0.62, 0.86, 0.46, 0.7];
  return (
    <g>
      <SceneTitle scene={scene} color={palette.blue} />
      <path d="M172 712 C280 604 400 600 518 700 C630 794 756 788 900 662" fill="none" stroke={palette.blue} strokeWidth="14" strokeLinecap="round" />
      <MovingDot x1={178} y1={710} x2={898} y2={662} progress={phase} color={palette.hot} />
      {["前文", "候选词", "概率", "输出"].map((label, index) => (
        <TokenBubble key={label} x={190 + index * 220} y={690 + Math.sin(index) * 42} text={label} color={index === 2 ? palette.hot : palette.blue} active={progress > index * 0.1} />
      ))}

      <g transform="translate(246 920)">
        <text x="0" y="0" fontSize="34" fontWeight="900" fill={ink}>
          概率选择器
        </text>
        {bars.map((height, index) => {
          const h = 170 * height * (0.55 + 0.45 * Math.sin((progress * 4 + index * 0.35) * Math.PI) ** 2);
          const x = 20 + index * 92;
          return (
            <g key={index}>
              <rect x={x} y={210 - h} width="54" height={h} rx="27" fill={index === 2 ? palette.hot : palette.blue} opacity={index === 2 ? 1 : 0.72} />
              <circle cx={x + 27} cy={230} r="8" fill={ink} opacity="0.28" />
            </g>
          );
        })}
      </g>

      <path d={`M${selectedX} 642 C${selectedX + 40} 600 ${selectedX + 80} 602 ${selectedX + 118} 638`} fill="none" stroke={palette.hot} strokeWidth="8" strokeLinecap="round" opacity="0.8" />
      <text x="314" y="1234" fontSize="46" fontWeight="900" fill={ink}>
        它先追求顺口，不等于先验证事实
      </text>
    </g>
  );
};

const EvidenceAnchor = ({ scene, progress, palette }: DiagramProps) => {
  const smooth = loop(progress, 1.8);
  const anchorDrop = springValue(progress, 0.32);
  const balloonY = 560 - Math.sin(progress * Math.PI * 2) * 16;
  return (
    <g>
      <SceneTitle scene={scene} color={palette.gold} />
      <path d="M174 780 C320 610 486 604 610 706 C724 800 820 758 910 610" fill="none" stroke={palette.gold} strokeWidth="13" strokeLinecap="round" />
      <circle cx={interpolate(smooth, [0, 1], [172, 610])} cy={interpolate(smooth, [0, 1], [780, 706])} r="28" fill={palette.gold} />
      <path d="M172 824 C310 930 520 940 704 824 C780 776 838 704 898 620" fill="none" stroke={palette.green} strokeWidth="13" strokeLinecap="round" />
      <circle cx={898} cy={620} r="22" fill={palette.green} opacity={0.9} />

      <g transform={`translate(640 ${balloonY})`}>
        <path d="M0 74 C30 8 152 -8 210 36 C276 86 240 180 146 186 C60 192 -28 142 0 74Z" fill="#FFFFFF" stroke={ink} strokeWidth="6" />
        <text x="54" y="94" fontSize="36" fontWeight="900" fill={palette.gold}>
          像答案
        </text>
      </g>

      <g transform={`translate(286 ${1030 - anchorDrop * 96})`} opacity={0.35 + anchorDrop * 0.65}>
        <path d="M76 0 v102" stroke={palette.green} strokeWidth="8" strokeLinecap="round" />
        <path d="M24 58 C30 124 122 124 128 58" fill="none" stroke={palette.green} strokeWidth="8" strokeLinecap="round" />
        <circle cx="76" cy="32" r="32" fill="#FFFFFF" stroke={palette.green} strokeWidth="8" />
        <text x="152" y="48" fontSize="40" fontWeight="900" fill={ink}>
          证据锚点
        </text>
      </g>

      <text x="246" y="1240" fontSize="44" fontWeight="900" fill={ink}>
        幻觉 = 概率跑太快，证据没跟上
      </text>
    </g>
  );
};

const RiskRadar = ({ scene, progress, palette }: DiagramProps) => {
  const pulse = loop(progress, 3);
  const items = [
    { text: "新消息", x: 245, y: 520, icon: "clock" },
    { text: "具体数字", x: 780, y: 520, icon: "hash" },
    { text: "论文链接", x: 245, y: 940, icon: "doc" },
    { text: "必须回答", x: 780, y: 940, icon: "bang" }
  ];
  return (
    <g>
      <SceneTitle scene={scene} color={palette.hot} />
      <circle cx="540" cy="740" r={112 + pulse * 90} fill="none" stroke={palette.purple} strokeWidth="8" opacity={0.25 * (1 - pulse)} />

      {items.map((item, index) => {
        const active = progress > index * 0.08;
        return (
          <path
            key={`ray-${item.text}`}
            d={`M540 740 L${item.x} ${item.y}`}
            stroke={ink}
            strokeWidth="6"
            strokeLinecap="round"
            opacity={active ? 0.82 : 0.16}
          />
        );
      })}

      <circle cx="540" cy="740" r="94" fill="#FFFFFF" stroke={palette.purple} strokeWidth="8" />
      <path d="M504 704 L576 776" stroke={palette.hot} strokeWidth="12" strokeLinecap="round" />
      <path d="M576 704 L504 776" stroke={palette.hot} strokeWidth="12" strokeLinecap="round" />
      <circle cx="540" cy="740" r="14" fill={palette.purple} />

      {items.map((item, index) => {
        const active = progress > index * 0.08;
        return (
          <g key={item.text} opacity={active ? 1 : 0.18}>
            <RiskIcon x={item.x} y={item.y} icon={item.icon} color={palette.hot} />
            <text x={item.x} y={item.y + 92} textAnchor="middle" fontSize="34" fontWeight="900" fill={ink}>
              {item.text}
            </text>
          </g>
        );
      })}

      <text x="304" y="1190" fontSize="48" fontWeight="900" fill={palette.hot}>
        这些题，先暂停再查
      </text>
    </g>
  );
};

const GuardrailPipeline = ({ scene, progress, palette }: DiagramProps) => {
  const phase = loop(progress, 2.4);
  const x = interpolate(phase, [0, 1], [152, 928]);
  const items = scene.bullets.slice(0, 4);
  return (
    <g>
      <SceneTitle scene={scene} color={palette.green} />
      <path d="M150 730 C322 618 470 846 620 734 C752 636 834 654 930 724" fill="none" stroke={palette.green} strokeWidth="14" strokeLinecap="round" />
      <circle cx={x} cy={730 + Math.sin(phase * Math.PI * 2) * 58} r="22" fill={palette.gold} />
      {items.map((item, index) => {
        const nodeX = 160 + index * 246;
        const active = progress > index * 0.08;
        return (
          <g key={item} opacity={active ? 1 : 0.22}>
            <circle cx={nodeX} cy="730" r="58" fill="#FFFFFF" stroke={index === items.length - 1 ? palette.hot : palette.green} strokeWidth="8" />
            <text x={nodeX} y="742" textAnchor="middle" fontSize="30" fontWeight="900" fill={ink}>
              {index + 1}
            </text>
            <text x={nodeX} y="846" textAnchor="middle" fontSize="35" fontWeight="900" fill={ink}>
              {item}
            </text>
          </g>
        );
      })}

      <g transform="translate(304 1038)">
        <path d="M0 72 C108 0 340 0 460 76" fill="none" stroke={palette.blue} strokeWidth="10" strokeLinecap="round" />
        <path d="M462 76 l-42 -28 l12 48 z" fill={palette.blue} />
        <text x="56" y="154" fontSize="43" fontWeight="900" fill={ink}>
          让答案先过流程，再进入发布
        </text>
      </g>
    </g>
  );
};

const ReliableFormula = ({ scene, progress, palette }: DiagramProps) => {
  const labels = scene.bullets.slice(0, 4);
  const fallbackPoint = { x: 540, y: 520 };
  return (
    <g>
      <SceneTitle scene={scene} color={palette.blue} />
      <path d="M540 520 L228 940 L852 940 Z" fill="rgba(255,255,255,0.6)" stroke={softInk} strokeWidth="5" />
      {labels.slice(0, 3).map((label, index) => {
        const points = [
          fallbackPoint,
          { x: 228, y: 940 },
          { x: 852, y: 940 }
        ];
        const point = points[index] ?? fallbackPoint;
        const active = progress > index * 0.12;
        return (
          <g key={label} opacity={active ? 1 : 0.2}>
            <circle cx={point.x} cy={point.y} r="72" fill="#FFFFFF" stroke={[palette.blue, palette.green, palette.gold][index]} strokeWidth="8" />
            <text x={point.x} y={point.y + 12} textAnchor="middle" fontSize="31" fontWeight="900" fill={ink}>
              {label}
            </text>
          </g>
        );
      })}
      <g opacity={springValue(progress, 0.45)}>
        <circle cx="540" cy="760" r="92" fill={palette.blue} />
        <text x="540" y="748" textAnchor="middle" fontSize="35" fontWeight="900" fill="#FFFFFF">
          可靠
        </text>
        <text x="540" y="790" textAnchor="middle" fontSize="35" fontWeight="900" fill="#FFFFFF">
          助手
        </text>
      </g>
      <text x="222" y="1192" fontSize="45" fontWeight="900" fill={ink}>
        草稿、资料、人审，缺一环都别直接信
      </text>
    </g>
  );
};

const SceneTitle = ({ scene, color }: { scene: StoryboardScene; color: string }) => (
  <g>
    <text x="76" y="156" fontSize="52" fontWeight="950" fill={ink}>
      {scene.headline}
    </text>
    <path d="M78 184 C210 164 302 166 428 184" fill="none" stroke={color} strokeWidth="9" strokeLinecap="round" opacity="0.75" />
  </g>
);

const QuestionMark = ({ x, y, color, progress }: { x: number; y: number; color: string; progress: number }) => (
  <g transform={`translate(${x} ${y}) rotate(${Math.sin(progress * Math.PI * 2) * 6})`}>
    <circle cx="0" cy="0" r="80" fill="#FFFFFF" stroke={color} strokeWidth="9" />
    <text x="0" y="30" textAnchor="middle" fontSize="104" fontWeight="950" fill={color}>
      ?
    </text>
  </g>
);

const LanguageEngine = ({ x, y, color, hot, progress }: { x: number; y: number; color: string; hot: string; progress: number }) => {
  const spin = progress * Math.PI * 2;
  return (
    <g transform={`translate(${x} ${y})`} filter="url(#soft-shadow)">
      <path d="M28 80 C20 24 86 -8 160 18 C236 44 284 110 248 170 C210 234 94 226 42 174 C20 152 18 116 28 80Z" fill="#FFFFFF" stroke={ink} strokeWidth="7" />
      <circle cx="104" cy="106" r="38" fill="none" stroke={color} strokeWidth="8" />
      <circle cx="180" cy="106" r="38" fill="none" stroke={hot} strokeWidth="8" />
      <path d={`M104 106 L${104 + Math.cos(spin) * 32} ${106 + Math.sin(spin) * 32}`} stroke={ink} strokeWidth="6" strokeLinecap="round" />
      <path d={`M180 106 L${180 + Math.cos(-spin * 0.7) * 32} ${106 + Math.sin(-spin * 0.7) * 32}`} stroke={ink} strokeWidth="6" strokeLinecap="round" />
      <text x="76" y="190" fontSize="28" fontWeight="900" fill={ink}>
        语言工厂
      </text>
    </g>
  );
};

const TokenBubble = ({ x, y, text, color, active }: { x: number; y: number; text: string; color: string; active: boolean }) => (
  <g opacity={active ? 1 : 0.2}>
    <circle cx={x} cy={y} r="58" fill="#FFFFFF" stroke={color} strokeWidth="8" />
    <text x={x} y={y + 11} textAnchor="middle" fontSize="27" fontWeight="900" fill={ink}>
      {text}
    </text>
  </g>
);

const RiskIcon = ({ x, y, icon, color }: { x: number; y: number; icon: string; color: string }) => (
  <g transform={`translate(${x} ${y})`}>
    <circle cx="0" cy="0" r="52" fill="#FFFFFF" stroke={color} strokeWidth="8" />
    {icon === "clock" ? (
      <>
        <circle cx="0" cy="0" r="24" fill="none" stroke={ink} strokeWidth="6" />
        <path d="M0 0 L0 -16 M0 0 L16 10" stroke={ink} strokeWidth="6" strokeLinecap="round" />
      </>
    ) : null}
    {icon === "hash" ? (
      <text x="0" y="16" textAnchor="middle" fontSize="54" fontWeight="950" fill={ink}>
        #
      </text>
    ) : null}
    {icon === "doc" ? (
      <>
        <path d="M-18 -28 H12 L28 -12 V30 H-18 Z" fill="none" stroke={ink} strokeWidth="6" strokeLinejoin="round" />
        <path d="M12 -28 V-12 H28" fill="none" stroke={ink} strokeWidth="6" />
      </>
    ) : null}
    {icon === "bang" ? (
      <text x="0" y="20" textAnchor="middle" fontSize="70" fontWeight="950" fill={ink}>
        !
      </text>
    ) : null}
  </g>
);

const FlowText = ({ items, y, palette, progress }: { items: string[]; y: number; palette: Palette; progress: number }) => (
  <g>
    {items.slice(0, 4).map((item, index) => {
      const x = 180 + index * 255;
      const active = progress > index * 0.1;
      return (
        <g key={item} opacity={active ? 1 : 0.2}>
          <text x={x} y={y} textAnchor="middle" fontSize="34" fontWeight="900" fill={index === items.length - 1 ? palette.hot : ink}>
            {item}
          </text>
          {index < items.length - 1 ? <path d={`M${x + 70} ${y - 10} H${x + 170}`} stroke={palette.hot} strokeWidth="6" strokeLinecap="round" /> : null}
        </g>
      );
    })}
  </g>
);

const MovingDot = ({ x1, y1, x2, y2, progress, color }: { x1: number; y1: number; x2: number; y2: number; progress: number; color: string }) => (
  <circle cx={x1 + (x2 - x1) * progress} cy={y1 + (y2 - y1) * progress} r="18" fill={color} />
);

const PlainCaption = ({ cue }: { cue?: SubtitleCue }) => {
  const lines = splitCaption(cue?.text ?? "");
  return (
    <div
      style={{
        position: "absolute",
        left: 86,
        right: 86,
        bottom: 300,
        color: ink,
        fontSize: 38,
        lineHeight: 1.16,
        fontWeight: 880,
        textAlign: "center",
        letterSpacing: 0,
        minHeight: 96,
        textShadow: "0 2px 0 rgba(255,255,255,0.92), 0 8px 18px rgba(23,33,43,0.12)"
      }}
    >
      {lines.map((line) => (
        <div key={line}>{line}</div>
      ))}
    </div>
  );
};

function splitCaption(text: string) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return [];
  const maxChars = 14;
  const clauses = clean.split(/[，。！？；,.;!?]+/).map((part) => part.trim()).filter(Boolean);
  const lines = clauses.length > 1 ? clauses.flatMap((part) => chunkCaption(part, maxChars)) : chunkCaption(clean, maxChars);
  return lines.slice(0, 2);
}

function chunkCaption(text: string, maxChars: number) {
  const chars = Array.from(text);
  return Array.from({ length: Math.ceil(chars.length / maxChars) }, (_, index) =>
    chars.slice(index * maxChars, (index + 1) * maxChars).join("")
  ).filter(Boolean);
}

type Palette = {
  bg: string;
  blue: string;
  hot: string;
  green: string;
  gold: string;
  purple: string;
};

type DiagramProps = {
  scene: StoryboardScene;
  progress: number;
  palette: Palette;
};

function paletteFor(scene: StoryboardScene): Palette {
  const palettes: Record<StoryboardScene["visualKind"], Palette> = {
    hook: { bg: "#FFF7EA", blue: "#1DC9E8", hot: "#FF5A5F", green: "#12B886", gold: "#F59E0B", purple: "#9B5DE5" },
    concept: { bg: "#F4FAFF", blue: "#2563EB", hot: "#FF7043", green: "#10B981", gold: "#F59E0B", purple: "#8B5CF6" },
    comparison: { bg: "#FFF9F1", blue: "#0EA5E9", hot: "#F97316", green: "#2DD4BF", gold: "#F5B800", purple: "#A855F7" },
    warning: { bg: "#FFF4EE", blue: "#0284C7", hot: "#FF5A5F", green: "#14B8A6", gold: "#F59E0B", purple: "#9B5DE5" },
    process: { bg: "#F2FFF8", blue: "#0EA5E9", hot: "#F97316", green: "#10B981", gold: "#F5B800", purple: "#8B5CF6" },
    recap: { bg: "#F8FAFF", blue: "#2563EB", hot: "#FF5A5F", green: "#10B981", gold: "#F59E0B", purple: "#9B5DE5" },
    closing: { bg: "#F8FAFF", blue: "#0EA5E9", hot: "#FF5A5F", green: "#10B981", gold: "#F59E0B", purple: "#8B5CF6" }
  };
  return palettes[scene.visualKind];
}

function springValue(progress: number, delay: number) {
  const local = Math.max(0, Math.min(1, (progress - delay) / 0.3));
  return spring({ frame: Math.round(local * 24), fps: 30, config: { damping: 13, stiffness: 160 } });
}

function loop(progress: number, cycles: number) {
  return (Math.max(0, progress) * cycles) % 1;
}

function findScene(scenes: StoryboardScene[], seconds: number) {
  return scenes.find((scene) => seconds >= scene.startSeconds && seconds < scene.startSeconds + scene.durationSeconds) ?? scenes.at(-1);
}

function findCue(cues: SubtitleCue[], seconds: number) {
  return cues.find((cue) => seconds >= cue.startSeconds && seconds < cue.endSeconds) ?? cues.at(-1);
}
