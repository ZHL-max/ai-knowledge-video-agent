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
const muted = "rgba(23,33,43,0.38)";
const grid = "rgba(23,33,43,0.09)";
const gridStrong = "rgba(23,33,43,0.22)";

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
        background: "#F7FBFF",
        color: ink,
        fontFamily:
          "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Microsoft YaHei, sans-serif",
        overflow: "hidden"
      }}
    >
      {manifest.narration?.audioPublicPath ? <Audio src={staticFile(manifest.narration.audioPublicPath)} /> : null}
      <OpenCanvas scene={scene} progress={sceneProgress} />
      <PlainCaption cue={cue} />
    </AbsoluteFill>
  );
};

const OpenCanvas = ({ scene, progress }: { scene?: StoryboardScene; progress: number }) => {
  if (!scene) return null;
  const accent = scene.accent || "#2F80ED";
  return (
    <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0 }}>
      <defs>
        <pattern id="fine-grid" width="80" height="80" patternUnits="userSpaceOnUse">
          <path d="M 80 0 L 0 0 0 80" fill="none" stroke={grid} strokeWidth="2" />
        </pattern>
        <pattern id="major-grid" width="320" height="320" patternUnits="userSpaceOnUse">
          <rect width="320" height="320" fill="url(#fine-grid)" />
          <path d="M 320 0 L 0 0 0 320" fill="none" stroke={gridStrong} strokeWidth="2" />
        </pattern>
      </defs>
      <rect width="1080" height="1920" fill={sceneBg(scene.visualKind)} />
      <rect width="1080" height="1920" fill="url(#major-grid)" opacity="0.8" />
      <path d="M 540 112 L 540 1476" stroke={gridStrong} strokeWidth="3" strokeDasharray="12 12" />
      <path d="M 88 820 L 992 820" stroke={gridStrong} strokeWidth="3" strokeDasharray="12 12" />
      <SceneDiagram scene={scene} progress={progress} accent={accent} />
    </svg>
  );
};

const SceneDiagram = ({
  scene,
  progress,
  accent
}: {
  scene: StoryboardScene;
  progress: number;
  accent: string;
}) => {
  switch (scene.layout) {
    case "token-factory":
      return <TokenSchematic scene={scene} progress={progress} accent={accent} />;
    case "truth-map":
      return <TruthSchematic scene={scene} progress={progress} accent={accent} />;
    case "risk-crossroads":
      return <RiskSchematic scene={scene} progress={progress} accent={accent} />;
    case "fix-pipeline":
      return <PipelineSchematic scene={scene} progress={progress} accent={accent} />;
    case "checklist":
      return <ChecklistSchematic scene={scene} progress={progress} accent={accent} />;
    case "recap-formula":
      return <FormulaSchematic scene={scene} progress={progress} accent={accent} />;
    case "question-pop":
    default:
      return <HallucinationSchematic scene={scene} progress={progress} accent={accent} />;
  }
};

const HallucinationSchematic = ({ scene, progress, accent }: DiagramProps) => {
  const leftAngle = interpolate(progress, [0, 1], [-4, -22]);
  const rightAngle = interpolate(progress, [0, 1], [3, 16]);
  const error = Math.round(interpolate(progress, [0, 1], [-2, -20]));
  return (
    <g>
      <text x="344" y="520" fontSize="33" fontWeight="850" fill="#FF7043">
        ! 来源警报 !
      </text>
      <LineGrow x1={540} y1={720} x2={310} y2={590} progress={progress} stroke={ink} />
      <LineGrow x1={540} y1={720} x2={786} y2={596} progress={progress} stroke={ink} />
      <circle cx="310" cy="590" r="48" fill="none" stroke="#1DC9E8" strokeWidth="6" />
      <circle cx="786" cy="596" r="48" fill="none" stroke="#1DC9E8" strokeWidth="6" />
      <g transform={`translate(392 690) rotate(${leftAngle})`}>
        <line x1="12" y1="58" x2="340" y2="58" stroke={ink} strokeWidth="8" strokeLinecap="round" />
        <line x1="42" y1="34" x2="310" y2="82" stroke={accent} strokeWidth="7" strokeLinecap="round" opacity="0.3" />
        <text x="72" y="36" fontSize="30" fontWeight="850" fill={ink}>
          像答案
        </text>
      </g>
      <g transform={`translate(548 692) rotate(${rightAngle})`} opacity={progress > 0.35 ? 1 : 0.25}>
        <path d="M0 0 L178 46" stroke={accent} strokeWidth="8" strokeLinecap="round" />
        <path d="M180 46 l-28 -23 l9 32 z" fill={accent} />
      </g>
      <TextPop x={322} y={930} progress={progress} delay={0.18} color={ink} size={50}>
        Error:
      </TextPop>
      <TextPop x={526} y={930} progress={progress} delay={0.32} color="#FFB703" size={54}>
        {`${error}.00°`}
      </TextPop>
      <FlowWords items={scene.visualPlan?.flow ?? scene.bullets} y={1166} progress={progress} accent={accent} />
    </g>
  );
};

const TokenSchematic = ({ scene, progress, accent }: DiagramProps) => {
  const items = scene.visualPlan?.flow ?? scene.bullets;
  const movingX = interpolate(progress, [0, 1], [250, 760], { extrapolateRight: "clamp" });
  return (
    <g>
      <text x="120" y="520" fontSize="38" fontWeight="850" fill={ink}>
        前文
      </text>
      <text x="732" y="520" fontSize="38" fontWeight="850" fill={ink}>
        输出
      </text>
      <LineGrow x1={190} y1={720} x2={860} y2={720} progress={progress} stroke={accent} width={9} />
      <ArrowHead x={860} y={720} color={accent} />
      {items.slice(0, 4).map((item, index) => (
        <g key={item} opacity={progress > index * 0.16 ? 1 : 0.18}>
          <circle cx={220 + index * 190} cy={720 + Math.sin(index) * 26} r="44" fill="rgba(255,255,255,0.68)" stroke={accent} strokeWidth="5" />
          <text x={220 + index * 190} y={728 + Math.sin(index) * 26} textAnchor="middle" fontSize="25" fontWeight="850" fill={ink}>
            {item}
          </text>
        </g>
      ))}
      <circle cx={movingX} cy="720" r="16" fill="#FFB703" />
      <text x="238" y="940" fontSize="42" fontWeight="850" fill={ink}>
        不是查百科
      </text>
      <text x="572" y="940" fontSize="42" fontWeight="850" fill="#FF7043">
        是预测下一个词
      </text>
    </g>
  );
};

const TruthSchematic = ({ scene, progress, accent }: DiagramProps) => {
  const dotX = interpolate(progress, [0, 0.48, 1], [188, 454, 780], { extrapolateRight: "clamp" });
  const dotY = interpolate(progress, [0, 0.48, 1], [720, 585, 722], { extrapolateRight: "clamp" });
  return (
    <g>
      <path d="M160 720 C260 560 390 535 520 640" fill="none" stroke="#FFB703" strokeWidth="10" strokeLinecap="round" />
      <path d="M160 720 C330 850 602 850 880 660" fill="none" stroke="#2DD4BF" strokeWidth="10" strokeLinecap="round" />
      <text x="174" y="520" fontSize="42" fontWeight="850" fill="#FFB703">
        像答案
      </text>
      <text x="730" y="520" fontSize="42" fontWeight="850" fill="#2DD4BF">
        有证据
      </text>
      <text x="430" y="650" fontSize="34" fontWeight="850" fill={ink}>
        ≠
      </text>
      <circle cx={dotX} cy={dotY} r="24" fill={accent} />
      <FlowWords items={["格式完整", "语气自信", "仍要核验"]} y={1080} progress={progress} accent={accent} />
    </g>
  );
};

const RiskSchematic = ({ scene, progress, accent }: DiagramProps) => {
  const items = scene.visualPlan?.flow ?? scene.bullets;
  const targets = [
    { x: 252, y: 548 },
    { x: 790, y: 548 },
    { x: 252, y: 932 },
    { x: 790, y: 932 }
  ];
  return (
    <g>
      <circle cx="540" cy="740" r="76" fill="none" stroke={accent} strokeWidth="8" />
      <text x="540" y="758" textAnchor="middle" fontSize="48" fontWeight="900" fill={accent}>
        AI
      </text>
      {items.slice(0, 4).map((item, index) => {
        const target = targets[index] ?? { x: 252, y: 548 };
        return (
          <g key={item} opacity={progress > index * 0.14 ? 1 : 0.18}>
            <LineGrow x1={540} y1={740} x2={target.x} y2={target.y} progress={progress} stroke={ink} width={4} />
            <circle cx={target.x} cy={target.y} r="38" fill="none" stroke="#FF7043" strokeWidth="6" />
            <text x={target.x} y={target.y + 88} textAnchor="middle" fontSize="32" fontWeight="850" fill={ink}>
              {item}
            </text>
          </g>
        );
      })}
      <text x="354" y="1144" fontSize="42" fontWeight="850" fill="#FF7043">
        这些场景：先别急着信
      </text>
    </g>
  );
};

const PipelineSchematic = ({ scene, progress, accent }: DiagramProps) => {
  const items = scene.visualPlan?.flow ?? scene.bullets;
  return (
    <g>
      <LineGrow x1={150} y1={700} x2={930} y2={700} progress={progress} stroke={accent} width={10} />
      <ArrowHead x={930} y={700} color={accent} />
      {items.slice(0, 4).map((item, index) => {
        const x = 170 + index * 235;
        return (
          <g key={item} opacity={progress > index * 0.16 ? 1 : 0.2}>
            <circle cx={x} cy="700" r="52" fill="rgba(255,255,255,0.76)" stroke={ink} strokeWidth="5" />
            <text x={x} y="708" textAnchor="middle" fontSize="34" fontWeight="900" fill={accent}>
              {index + 1}
            </text>
            <text x={x} y="815" textAnchor="middle" fontSize="34" fontWeight="850" fill={ink}>
              {item}
            </text>
          </g>
        );
      })}
      <text x="232" y="1040" fontSize="42" fontWeight="850" fill={ink}>
        防幻觉靠流程，不靠一句咒语
      </text>
    </g>
  );
};

const ChecklistSchematic = ({ scene, progress, accent }: DiagramProps) => {
  const items = scene.visualPlan?.flow ?? scene.bullets;
  return (
    <g>
      {items.slice(0, 3).map((item, index) => {
        const y = 560 + index * 168;
        const active = progress > index * 0.2;
        return (
          <g key={item} opacity={active ? 1 : 0.24}>
            <circle cx="250" cy={y} r="42" fill="none" stroke={active ? accent : muted} strokeWidth="8" />
            <path d={`M230 ${y} l16 18 l34 -42`} fill="none" stroke={accent} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
            <text x="328" y={y + 12} fontSize="42" fontWeight="850" fill={ink}>
              {item}
            </text>
          </g>
        );
      })}
      <text x="292" y="1160" fontSize="40" fontWeight="850" fill="#FF7043">
        有一项不确定，就不要直接转发
      </text>
    </g>
  );
};

const FormulaSchematic = ({ scene, progress, accent }: DiagramProps) => {
  const items = scene.visualPlan?.flow ?? scene.bullets;
  const labels = items.slice(0, 4);
  return (
    <g>
      {labels.map((item, index) => {
        const x = 150 + index * 245;
        const active = progress > index * 0.16;
        return (
          <g key={item} opacity={active ? 1 : 0.22}>
            {index > 0 ? (
              <text x={x - 78} y="724" textAnchor="middle" fontSize="56" fontWeight="900" fill={ink}>
                {index === labels.length - 1 ? "=" : "+"}
              </text>
            ) : null}
            <circle cx={x} cy="700" r={index === labels.length - 1 ? 68 : 58} fill="none" stroke={index === labels.length - 1 ? accent : ink} strokeWidth="6" />
            <text x={x} y="706" textAnchor="middle" fontSize="30" fontWeight="850" fill={index === labels.length - 1 ? accent : ink}>
              {item}
            </text>
          </g>
        );
      })}
      <text x="278" y="1030" fontSize="42" fontWeight="850" fill={ink}>
        让 AI 生成，让资料约束，让人把关
      </text>
    </g>
  );
};

const PlainCaption = ({ cue }: { cue?: SubtitleCue }) => {
  const lines = splitCaption(cue?.text ?? "");
  return (
    <div
      style={{
        position: "absolute",
        left: 92,
        right: 92,
        bottom: 260,
        color: ink,
        fontSize: 36,
        lineHeight: 1.18,
        fontWeight: 850,
        textAlign: "center",
        letterSpacing: 0,
        minHeight: 92,
        textShadow: "0 2px 0 rgba(255,255,255,0.86), 0 8px 18px rgba(23,33,43,0.12)"
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
  const maxChars = 13;
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

type DiagramProps = {
  scene: StoryboardScene;
  progress: number;
  accent: string;
};

const FlowWords = ({
  items,
  y,
  progress,
  accent
}: {
  items: string[];
  y: number;
  progress: number;
  accent: string;
}) => (
  <g>
    {items.slice(0, 4).map((item, index) => {
      const x = 170 + index * 245;
      const active = progress > index * 0.16;
      return (
        <g key={item} opacity={active ? 1 : 0.2}>
          <text x={x} y={y} textAnchor="middle" fontSize="34" fontWeight="850" fill={index === items.length - 1 ? accent : ink}>
            {item}
          </text>
          {index < items.length - 1 ? <LineGrow x1={x + 74} y1={y - 12} x2={x + 170} y2={y - 12} progress={progress} stroke={accent} width={5} /> : null}
        </g>
      );
    })}
  </g>
);

const TextPop = ({
  x,
  y,
  progress,
  delay,
  color,
  size,
  children
}: {
  x: number;
  y: number;
  progress: number;
  delay: number;
  color: string;
  size: number;
  children: string | number;
}) => {
  const local = Math.max(0, Math.min(1, (progress - delay) / 0.22));
  const scale = spring({ frame: Math.round(local * 18), fps: 30, config: { damping: 12, stiffness: 150 } });
  return (
    <text x={x} y={y} fontSize={size} fontWeight="900" fill={color} opacity={local > 0 ? 1 : 0} transform={`scale(${0.8 + scale * 0.2})`}>
      {children}
    </text>
  );
};

const LineGrow = ({
  x1,
  y1,
  x2,
  y2,
  progress,
  stroke,
  width = 4
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  progress: number;
  stroke: string;
  width?: number;
}) => {
  const px = x1 + (x2 - x1) * Math.min(1, progress * 1.35);
  const py = y1 + (y2 - y1) * Math.min(1, progress * 1.35);
  return <line x1={x1} y1={y1} x2={px} y2={py} stroke={stroke} strokeWidth={width} strokeLinecap="round" />;
};

const ArrowHead = ({ x, y, color }: { x: number; y: number; color: string }) => (
  <path d={`M${x} ${y} l-32 -20 v40 z`} fill={color} />
);

function sceneBg(kind: StoryboardScene["visualKind"]) {
  const colors: Record<StoryboardScene["visualKind"], string> = {
    hook: "#F7FBFF",
    concept: "#F9FCF5",
    comparison: "#FFF9F3",
    process: "#F5FFFA",
    warning: "#FFF8F5",
    recap: "#F8FAFF",
    closing: "#FBFFF7"
  };
  return colors[kind];
}

function findScene(scenes: StoryboardScene[], seconds: number) {
  return scenes.find((scene) => seconds >= scene.startSeconds && seconds < scene.startSeconds + scene.durationSeconds) ?? scenes.at(-1);
}

function findCue(cues: SubtitleCue[], seconds: number) {
  return cues.find((cue) => seconds >= cue.startSeconds && seconds < cue.endSeconds) ?? cues.at(-1);
}
