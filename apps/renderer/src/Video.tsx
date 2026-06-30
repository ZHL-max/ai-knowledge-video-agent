import type { CSSProperties, ReactNode } from "react";
import {
  AbsoluteFill,
  Audio,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig
} from "remotion";
import type { RenderManifest, StoryboardScene, SubtitleCue, VisualLayout } from "@aivideo/core";

type Palette = {
  bg: string;
  soft: string;
  accent: string;
  secondary: string;
  ink: string;
};

const scenePalettes: Record<VisualLayout, Palette> = {
  "question-pop": { bg: "#FFF6D9", soft: "#DDF7FF", accent: "#FF6B6B", secondary: "#4D96FF", ink: "#263238" },
  "token-factory": { bg: "#EAF7FF", soft: "#FFF1B8", accent: "#4D96FF", secondary: "#FFB703", ink: "#263238" },
  "truth-map": { bg: "#FFF1F7", soft: "#E9FFE9", accent: "#FFB703", secondary: "#06D6A0", ink: "#263238" },
  "risk-crossroads": { bg: "#F5ECFF", soft: "#FFE7DE", accent: "#9B5DE5", secondary: "#FF6B6B", ink: "#263238" },
  "fix-pipeline": { bg: "#E9FFF6", soft: "#EAF7FF", accent: "#06D6A0", secondary: "#4D96FF", ink: "#263238" },
  checklist: { bg: "#FFF4FB", soft: "#EAF7FF", accent: "#F15BB5", secondary: "#00BBF9", ink: "#263238" },
  "recap-formula": { bg: "#EAF8FF", soft: "#FFF1B8", accent: "#00BBF9", secondary: "#FFB703", ink: "#263238" }
};

export const KnowledgeVideo = ({ manifest }: { manifest: RenderManifest }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const seconds = frame / fps;
  const scene = findScene(manifest.scenes, seconds);
  const cue = findCue(manifest.subtitles, seconds);
  const sceneProgress = scene
    ? Math.min(1, Math.max(0, (seconds - scene.startSeconds) / scene.durationSeconds))
    : 0;
  const entrance = spring({ frame, fps, config: { damping: 20, stiffness: 96 } });
  const totalProgress = frame / Math.max(1, durationInFrames - 1);
  const palette = paletteFor(scene);

  return (
    <AbsoluteFill
      style={{
        background: palette.bg,
        color: palette.ink,
        fontFamily:
          "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Microsoft YaHei, sans-serif",
        overflow: "hidden"
      }}
    >
      {manifest.narration?.audioPublicPath ? <Audio src={staticFile(manifest.narration.audioPublicPath)} /> : null}
      <BrightBackground scene={scene} palette={palette} progress={sceneProgress} />
      <div
        style={{
          position: "absolute",
          inset: 58,
          display: "grid",
          gridTemplateRows: "188px 1fr 246px",
          gap: 24,
          opacity: entrance,
          transform: `translateY(${(1 - entrance) * 34}px)`
        }}
      >
        <Header manifest={manifest} scene={scene} palette={palette} progress={totalProgress} />
        <IllustrationStage scene={scene} palette={palette} progress={sceneProgress} />
        <Footer cue={cue} scene={scene} palette={palette} sourceName={sourceName(manifest, scene)} />
      </div>
    </AbsoluteFill>
  );
};

const BrightBackground = ({
  scene,
  palette,
  progress
}: {
  scene?: StoryboardScene;
  palette: Palette;
  progress: number;
}) => {
  const wobble = Math.sin(progress * Math.PI * 2) * 18;
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(160deg, ${palette.bg} 0%, ${palette.soft} 100%)`
        }}
      />
      <ShapeBlob left={-120} top={-100} size={360} color={palette.secondary} opacity={0.18} rotate={progress * 12} />
      <ShapeBlob left={740} top={90} size={310} color={palette.accent} opacity={0.2} rotate={-progress * 16} />
      <ShapeBlob left={690} top={1420} size={460} color={palette.secondary} opacity={0.16} rotate={wobble} />
      <div
        style={{
          position: "absolute",
          left: 42,
          top: 1240,
          fontSize: 220,
          fontWeight: 950,
          color: hexToRgba(palette.accent, 0.08),
          transform: `rotate(${-10 + progress * 8}deg)`
        }}
      >
        {scene?.visualPlan?.stickers[0] ?? "AI"}
      </div>
    </AbsoluteFill>
  );
};

const Header = ({
  manifest,
  scene,
  palette,
  progress
}: {
  manifest: RenderManifest;
  scene?: StoryboardScene;
  palette: Palette;
  progress: number;
}) => {
  return (
    <header style={{ display: "grid", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 22px",
            background: "#FFFFFF",
            border: `4px solid ${palette.ink}`,
            borderRadius: 999,
            boxShadow: `8px 8px 0 ${hexToRgba(palette.ink, 0.16)}`,
            fontSize: 28,
            fontWeight: 950,
            letterSpacing: 0
          }}
        >
          <MiniSpark color={palette.accent} />
          AI 图解小课堂
        </div>
        <div style={{ fontSize: 28, fontWeight: 950, color: palette.ink }}>{Math.round(progress * 100)}%</div>
      </div>
      <div style={{ height: 18, borderRadius: 999, background: "#FFFFFF", border: `3px solid ${palette.ink}`, overflow: "hidden" }}>
        <div
          style={{
            width: `${progress * 100}%`,
            height: "100%",
            background: `linear-gradient(90deg, ${palette.accent}, ${palette.secondary})`
          }}
        />
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 22 }}>
        <h1
          style={{
            margin: 0,
            fontSize: 54,
            lineHeight: 1.05,
            fontWeight: 950,
            letterSpacing: 0,
            maxWidth: 760
          }}
        >
          {manifest.title}
        </h1>
        <div
          style={{
            padding: "10px 18px",
            borderRadius: 18,
            background: palette.accent,
            color: "#FFFFFF",
            border: `4px solid ${palette.ink}`,
            boxShadow: `6px 6px 0 ${hexToRgba(palette.ink, 0.16)}`,
            fontSize: 24,
            fontWeight: 950,
            whiteSpace: "nowrap"
          }}
        >
          {labelFor(scene?.visualKind ?? "hook")}
        </div>
      </div>
    </header>
  );
};

const IllustrationStage = ({
  scene,
  palette,
  progress
}: {
  scene?: StoryboardScene;
  palette: Palette;
  progress: number;
}) => {
  if (!scene) return null;
  const pop = spring({
    frame: Math.round(progress * 90),
    fps: 30,
    config: { damping: 16, stiffness: 130 }
  });

  return (
    <main
      style={{
        position: "relative",
        display: "grid",
        gridTemplateRows: "132px 1fr",
        gap: 28,
        minHeight: 0
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 18
        }}
      >
        <Mascot palette={palette} progress={progress} size={104} />
        <div
          style={{
            flex: 1,
            background: "#FFFFFF",
            border: `5px solid ${palette.ink}`,
            borderRadius: 30,
            padding: "22px 28px",
            boxShadow: `10px 10px 0 ${hexToRgba(palette.ink, 0.14)}`,
            transform: `scale(${0.96 + pop * 0.04})`
          }}
        >
          <div style={{ fontSize: 30, fontWeight: 900, color: palette.accent, marginBottom: 6 }}>这一幕看懂：</div>
          <div style={{ fontSize: 50, lineHeight: 1.05, fontWeight: 950, letterSpacing: 0 }}>{scene.headline}</div>
        </div>
      </div>

      <div
        style={{
          position: "relative",
          minHeight: 0,
          background: hexToRgba("#FFFFFF", 0.78),
          border: `5px solid ${palette.ink}`,
          borderRadius: 38,
          boxShadow: `14px 14px 0 ${hexToRgba(palette.ink, 0.14)}`,
          overflow: "hidden"
        }}
      >
        <SceneDiagram scene={scene} palette={palette} progress={progress} />
      </div>
    </main>
  );
};

const SceneDiagram = ({
  scene,
  palette,
  progress
}: {
  scene: StoryboardScene;
  palette: Palette;
  progress: number;
}) => {
  switch (scene.layout) {
    case "token-factory":
      return <TokenFactory scene={scene} palette={palette} progress={progress} />;
    case "truth-map":
      return <TruthMap scene={scene} palette={palette} progress={progress} />;
    case "risk-crossroads":
      return <RiskCrossroads scene={scene} palette={palette} progress={progress} />;
    case "fix-pipeline":
      return <FixPipeline scene={scene} palette={palette} progress={progress} />;
    case "checklist":
      return <ChecklistCards scene={scene} palette={palette} progress={progress} />;
    case "recap-formula":
      return <RecapFormula scene={scene} palette={palette} progress={progress} />;
    case "question-pop":
    default:
      return <QuestionPop scene={scene} palette={palette} progress={progress} />;
  }
};

const QuestionPop = ({ scene, palette, progress }: DiagramProps) => {
  const cardPop = interpolate(progress, [0, 0.22, 1], [0.72, 1.06, 1], { extrapolateRight: "clamp" });
  return (
    <DiagramShell palette={palette}>
      <div style={{ position: "absolute", left: 56, top: 78, width: 390 }}>
        <PhoneFrame palette={palette}>
          <ChatBubble text="AI，这篇论文靠谱吗？" color="#DDF7FF" delay={0.08} progress={progress} />
          <ChatBubble text="当然！作者、年份都有。" color="#FFF1B8" delay={0.22} progress={progress} align="right" />
          <ChatBubble text="等一下，来源呢？" color="#FFE1E1" delay={0.38} progress={progress} />
        </PhoneFrame>
      </div>
      <div
        style={{
          position: "absolute",
          right: 72,
          top: 108,
          width: 360,
          transform: `scale(${cardPop}) rotate(${-4 + progress * 5}deg)`
        }}
      >
        <PaperCard palette={palette} title="超像真的论文卡" lines={["作者：看起来很权威", "年份：2025", "链接：先别急着信"]} />
      </div>
      <Magnifier palette={palette} left={612} top={420} progress={progress} />
      <FlowStrip palette={palette} items={scene.visualPlan?.flow ?? scene.bullets} bottom={42} />
    </DiagramShell>
  );
};

const TokenFactory = ({ scene, palette, progress }: DiagramProps) => {
  const tokens = scene.visualPlan?.flow ?? scene.bullets;
  return (
    <DiagramShell palette={palette}>
      <div style={{ position: "absolute", left: 54, top: 70, width: 260 }}>
        <BigInputCard palette={palette} title="前文" body="用户问题 + 上下文" />
      </div>
      <Arrow palette={palette} left={330} top={190} width={170} progress={progress} />
      <div
        style={{
          position: "absolute",
          left: 508,
          top: 136,
          width: 330,
          height: 150,
          borderRadius: 34,
          border: `5px solid ${palette.ink}`,
          background: "#FFFFFF",
          boxShadow: `10px 10px 0 ${hexToRgba(palette.ink, 0.12)}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-around",
          overflow: "hidden"
        }}
      >
        {tokens.slice(0, 4).map((token, index) => (
          <Token key={token} text={token} color={index % 2 ? palette.secondary : palette.accent} progress={progress} index={index} />
        ))}
      </div>
      <Arrow palette={palette} left={842} top={190} width={120} progress={progress} />
      <div style={{ position: "absolute", right: 46, top: 86, width: 250 }}>
        <BigInputCard palette={palette} title="输出" body="最顺口的下一句" accent={palette.secondary} />
      </div>
      <Mascot palette={palette} progress={progress} size={132} left={410} top={390} />
      <Sticker palette={palette} text="顺口 ≠ 真实" left={585} top={430} rotate={-3} />
    </DiagramShell>
  );
};

const TruthMap = ({ scene, palette, progress }: DiagramProps) => {
  const dotX = interpolate(progress, [0, 0.35, 0.65, 1], [96, 382, 540, 724], { extrapolateRight: "clamp" });
  const dotY = interpolate(progress, [0, 0.35, 0.65, 1], [385, 205, 386, 208], { extrapolateRight: "clamp" });
  return (
    <DiagramShell palette={palette}>
      <Road palette={palette} left={70} top={160} color="#FFB703" label="像答案" />
      <Road palette={palette} left={550} top={160} color="#06D6A0" label="有证据" />
      <div
        style={{
          position: "absolute",
          left: dotX,
          top: dotY,
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: palette.accent,
          border: `5px solid ${palette.ink}`,
          boxShadow: `8px 8px 0 ${hexToRgba(palette.ink, 0.12)}`
        }}
      />
      <FlowStrip palette={palette} items={scene.visualPlan?.flow ?? scene.bullets} bottom={42} />
    </DiagramShell>
  );
};

const RiskCrossroads = ({ scene, palette, progress }: DiagramProps) => {
  const items = scene.visualPlan?.flow ?? scene.bullets;
  return (
    <DiagramShell palette={palette}>
      <div
        style={{
          position: "absolute",
          left: 410,
          top: 228,
          width: 190,
          height: 190,
          borderRadius: 44,
          background: palette.accent,
          border: `6px solid ${palette.ink}`,
          display: "grid",
          placeItems: "center",
          color: "#FFFFFF",
          fontSize: 72,
          fontWeight: 950,
          transform: `rotate(${Math.sin(progress * Math.PI) * 5}deg)`
        }}
      >
        !
      </div>
      {items.slice(0, 4).map((item, index) => {
        const positions = [
          { left: 92, top: 112, rotate: -9 },
          { left: 640, top: 106, rotate: 7 },
          { left: 90, top: 460, rotate: 8 },
          { left: 636, top: 462, rotate: -7 }
        ];
        const pos = positions[index] ?? { left: 92, top: 112, rotate: -9 };
        return (
          <SignPost
            key={item}
            palette={palette}
            text={item}
            left={pos.left}
            top={pos.top}
            rotate={pos.rotate}
            active={progress > index * 0.16}
          />
        );
      })}
      <Sticker palette={palette} text="看到警示牌：先查来源" left={320} top={560} rotate={0} />
    </DiagramShell>
  );
};

const FixPipeline = ({ scene, palette, progress }: DiagramProps) => {
  const items = scene.visualPlan?.flow ?? scene.bullets;
  return (
    <DiagramShell palette={palette}>
      <div style={{ position: "absolute", left: 46, top: 218, right: 46, display: "flex", alignItems: "center", gap: 18 }}>
        {items.slice(0, 4).map((item, index) => (
          <div key={item} style={{ display: "flex", alignItems: "center", gap: 18, flex: 1 }}>
            <FlowNode palette={palette} label={item} index={index + 1} active={progress > index * 0.16} />
            {index < Math.min(3, items.length - 1) ? <InlineArrow color={palette.secondary} /> : null}
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", left: 140, top: 92 }}>
        <PaperCard palette={palette} title="资料卡" lines={["可靠来源", "明确边界", "可复核"]} compact />
      </div>
      <Sticker palette={palette} text="流程比提示词更重要" left={460} top={500} rotate={-2} />
    </DiagramShell>
  );
};

const ChecklistCards = ({ scene, palette, progress }: DiagramProps) => {
  const items = scene.visualPlan?.flow ?? scene.bullets;
  return (
    <DiagramShell palette={palette}>
      <div style={{ position: "absolute", left: 52, top: 126, right: 52, display: "grid", gridTemplateColumns: "1fr", gap: 28 }}>
        {items.slice(0, 3).map((item, index) => (
          <CheckCard key={item} palette={palette} text={item} index={index + 1} active={progress > index * 0.2} />
        ))}
      </div>
      <Sticker palette={palette} text="有一项不确定，就先别转发" left={430} top={552} rotate={3} />
    </DiagramShell>
  );
};

const RecapFormula = ({ scene, palette, progress }: DiagramProps) => {
  const items = scene.visualPlan?.flow ?? scene.bullets;
  return (
    <DiagramShell palette={palette}>
      <div style={{ position: "absolute", left: 52, top: 180, right: 52, display: "flex", alignItems: "center", gap: 16 }}>
        {items.slice(0, 4).map((item, index) => (
          <FormulaPart key={item} palette={palette} label={item} index={index} active={progress > index * 0.16} />
        ))}
      </div>
      <Mascot palette={palette} progress={progress} size={150} left={440} top={430} />
      <Sticker palette={palette} text="会用 AI，比盲信 AI 更重要" left={298} top={590} rotate={-2} />
    </DiagramShell>
  );
};

type DiagramProps = {
  scene: StoryboardScene;
  palette: Palette;
  progress: number;
};

const DiagramShell = ({ palette, children }: { palette: Palette; children: ReactNode }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      background: `radial-gradient(circle at 18% 15%, ${hexToRgba(palette.secondary, 0.22)}, transparent 32%), radial-gradient(circle at 82% 20%, ${hexToRgba(palette.accent, 0.18)}, transparent 30%)`
    }}
  >
    {children}
  </div>
);

const Footer = ({
  cue,
  scene,
  palette,
  sourceName
}: {
  cue?: SubtitleCue;
  scene?: StoryboardScene;
  palette: Palette;
  sourceName: string;
}) => {
  return (
    <footer style={{ display: "grid", gridTemplateRows: "1fr 38px", gap: 14 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px 34px",
          background: "#FFFFFF",
          border: `5px solid ${palette.ink}`,
          borderRadius: 34,
          boxShadow: `10px 10px 0 ${hexToRgba(palette.ink, 0.14)}`
        }}
      >
        <div
          style={{
            fontSize: 38,
            lineHeight: 1.28,
            fontWeight: 900,
            textAlign: "center",
            letterSpacing: 0,
            color: palette.ink
          }}
        >
          {cue?.text ?? scene?.narration.slice(0, 36) ?? ""}
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 23, color: palette.ink, fontWeight: 800 }}>
        <span>来源：{sourceName}</span>
        <span>图解配合讲解</span>
      </div>
    </footer>
  );
};

const Mascot = ({
  palette,
  progress,
  size,
  left,
  top
}: {
  palette: Palette;
  progress: number;
  size: number;
  left?: number;
  top?: number;
}) => {
  const style: CSSProperties = {
    width: size,
    height: size,
    borderRadius: Math.round(size * 0.24),
    background: "#FFFFFF",
    border: `5px solid ${palette.ink}`,
    boxShadow: `${Math.round(size * 0.08)}px ${Math.round(size * 0.08)}px 0 ${hexToRgba(palette.ink, 0.14)}`,
    position: left === undefined ? "relative" : "absolute",
    left,
    top,
    transform: `translateY(${Math.sin(progress * Math.PI * 2) * 8}px) rotate(${Math.sin(progress * Math.PI) * 3}deg)`,
    display: "grid",
    placeItems: "center"
  };
  return (
    <div style={style}>
      <div
        style={{
          width: size * 0.72,
          height: size * 0.52,
          borderRadius: size * 0.18,
          background: palette.soft,
          border: `4px solid ${palette.ink}`,
          position: "relative"
        }}
      >
        <div style={{ ...eyeStyle(size, palette), left: size * 0.14 }} />
        <div style={{ ...eyeStyle(size, palette), right: size * 0.14 }} />
        <div
          style={{
            position: "absolute",
            left: "50%",
            bottom: size * 0.1,
            width: size * 0.18,
            height: size * 0.06,
            borderRadius: 999,
            background: palette.accent,
            transform: "translateX(-50%)"
          }}
        />
      </div>
    </div>
  );
};

const eyeStyle = (size: number, palette: Palette): CSSProperties => ({
  position: "absolute",
  top: size * 0.18,
  width: size * 0.1,
  height: size * 0.1,
  borderRadius: "50%",
  background: palette.ink
});

const PhoneFrame = ({ palette, children }: { palette: Palette; children: ReactNode }) => (
  <div
    style={{
      height: 520,
      borderRadius: 48,
      border: `6px solid ${palette.ink}`,
      background: "#FFFFFF",
      boxShadow: `12px 12px 0 ${hexToRgba(palette.ink, 0.14)}`,
      padding: 26,
      display: "grid",
      alignContent: "start",
      gap: 22
    }}
  >
    {children}
  </div>
);

const ChatBubble = ({
  text,
  color,
  progress,
  delay,
  align = "left"
}: {
  text: string;
  color: string;
  progress: number;
  delay: number;
  align?: "left" | "right";
}) => {
  const visible = progress > delay;
  return (
    <div
      style={{
        justifySelf: align,
        maxWidth: 292,
        padding: "16px 18px",
        borderRadius: 24,
        border: "4px solid #263238",
        background: color,
        fontSize: 25,
        fontWeight: 900,
        lineHeight: 1.16,
        opacity: visible ? 1 : 0,
        transform: `translateY(${visible ? 0 : 18}px) scale(${visible ? 1 : 0.92})`
      }}
    >
      {text}
    </div>
  );
};

const PaperCard = ({
  palette,
  title,
  lines,
  compact
}: {
  palette: Palette;
  title: string;
  lines: string[];
  compact?: boolean;
}) => (
  <div
    style={{
      borderRadius: compact ? 22 : 30,
      background: "#FFFFFF",
      border: `5px solid ${palette.ink}`,
      boxShadow: `10px 10px 0 ${hexToRgba(palette.ink, 0.14)}`,
      padding: compact ? 20 : 28
    }}
  >
    <div style={{ fontSize: compact ? 26 : 34, fontWeight: 950, color: palette.accent, marginBottom: 16 }}>{title}</div>
    {lines.map((line) => (
      <div key={line} style={{ fontSize: compact ? 21 : 26, lineHeight: 1.35, fontWeight: 800, marginTop: 8 }}>
        {line}
      </div>
    ))}
  </div>
);

const Magnifier = ({ palette, left, top, progress }: { palette: Palette; left: number; top: number; progress: number }) => (
  <div
    style={{
      position: "absolute",
      left: left + Math.sin(progress * Math.PI * 2) * 20,
      top,
      width: 138,
      height: 138,
      borderRadius: "50%",
      border: `10px solid ${palette.secondary}`,
      background: hexToRgba("#FFFFFF", 0.35),
      transform: `rotate(${18 + progress * 8}deg)`
    }}
  >
    <div
      style={{
        position: "absolute",
        right: -48,
        bottom: -28,
        width: 86,
        height: 18,
        borderRadius: 999,
        background: palette.secondary,
        border: `4px solid ${palette.ink}`
      }}
    />
  </div>
);

const BigInputCard = ({ palette, title, body, accent }: { palette: Palette; title: string; body: string; accent?: string }) => (
  <div
    style={{
      background: "#FFFFFF",
      border: `5px solid ${palette.ink}`,
      borderRadius: 28,
      padding: 24,
      minHeight: 170,
      boxShadow: `10px 10px 0 ${hexToRgba(palette.ink, 0.12)}`
    }}
  >
    <div style={{ fontSize: 28, fontWeight: 950, color: accent ?? palette.accent, marginBottom: 18 }}>{title}</div>
    <div style={{ fontSize: 30, lineHeight: 1.2, fontWeight: 900 }}>{body}</div>
  </div>
);

const Token = ({ text, color, progress, index }: { text: string; color: string; progress: number; index: number }) => {
  const offset = interpolate(progress, [0, 1], [-30, 28], { extrapolateRight: "clamp" });
  return (
    <div
      style={{
        minWidth: 76,
        padding: "14px 12px",
        borderRadius: 18,
        background: color,
        border: "4px solid #263238",
        color: "#FFFFFF",
        fontSize: 22,
        fontWeight: 950,
        textAlign: "center",
        transform: `translateX(${offset + index * 2}px) rotate(${index % 2 ? 5 : -5}deg)`
      }}
    >
      {text}
    </div>
  );
};

const Road = ({ palette, left, top, color, label }: { palette: Palette; left: number; top: number; color: string; label: string }) => (
  <div style={{ position: "absolute", left, top, width: 390, height: 280 }}>
    <div
      style={{
        position: "absolute",
        left: 76,
        top: 118,
        width: 270,
        height: 82,
        borderRadius: 999,
        background: color,
        border: `5px solid ${palette.ink}`,
        transform: "rotate(-16deg)"
      }}
    />
    <div
      style={{
        position: "absolute",
        left: 24,
        top: 18,
        padding: "20px 24px",
        borderRadius: 26,
        background: "#FFFFFF",
        border: `5px solid ${palette.ink}`,
        fontSize: 36,
        fontWeight: 950,
        boxShadow: `8px 8px 0 ${hexToRgba(palette.ink, 0.12)}`
      }}
    >
      {label}
    </div>
  </div>
);

const SignPost = ({
  palette,
  text,
  left,
  top,
  rotate,
  active
}: {
  palette: Palette;
  text: string;
  left: number;
  top: number;
  rotate: number;
  active: boolean;
}) => (
  <div
    style={{
      position: "absolute",
      left,
      top,
      width: 270,
      padding: "18px 20px",
      borderRadius: 22,
      background: active ? "#FFFFFF" : hexToRgba("#FFFFFF", 0.44),
      border: `5px solid ${palette.ink}`,
      color: palette.ink,
      fontSize: 32,
      fontWeight: 950,
      textAlign: "center",
      boxShadow: active ? `8px 8px 0 ${hexToRgba(palette.ink, 0.14)}` : "none",
      transform: `rotate(${rotate}deg) translateY(${active ? 0 : 24}px)`,
      opacity: active ? 1 : 0.42
    }}
  >
    {text}
  </div>
);

const FlowNode = ({ palette, label, index, active }: { palette: Palette; label: string; index: number; active: boolean }) => (
  <div
    style={{
      flex: 1,
      minHeight: 178,
      borderRadius: 30,
      background: active ? "#FFFFFF" : hexToRgba("#FFFFFF", 0.5),
      border: `5px solid ${palette.ink}`,
      boxShadow: active ? `8px 8px 0 ${hexToRgba(palette.ink, 0.13)}` : "none",
      display: "grid",
      placeItems: "center",
      padding: 16,
      transform: `translateY(${active ? 0 : 22}px)`
    }}
  >
    <div style={{ color: palette.accent, fontSize: 34, fontWeight: 950 }}>0{index}</div>
    <div style={{ fontSize: 31, lineHeight: 1.1, fontWeight: 950, textAlign: "center" }}>{label}</div>
  </div>
);

const InlineArrow = ({ color }: { color: string }) => (
  <div style={{ width: 42, height: 24, position: "relative", flex: "0 0 auto" }}>
    <div style={{ position: "absolute", left: 0, top: 8, width: 32, height: 8, borderRadius: 99, background: color }} />
    <div
      style={{
        position: "absolute",
        right: 0,
        top: 0,
        width: 0,
        height: 0,
        borderTop: "12px solid transparent",
        borderBottom: "12px solid transparent",
        borderLeft: `18px solid ${color}`
      }}
    />
  </div>
);

const CheckCard = ({ palette, text, index, active }: { palette: Palette; text: string; index: number; active: boolean }) => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "86px 1fr",
      gap: 22,
      alignItems: "center",
      padding: "22px 26px",
      background: active ? "#FFFFFF" : hexToRgba("#FFFFFF", 0.45),
      border: `5px solid ${palette.ink}`,
      borderRadius: 28,
      boxShadow: active ? `9px 9px 0 ${hexToRgba(palette.ink, 0.13)}` : "none",
      transform: `scale(${active ? 1 : 0.96})`
    }}
  >
    <div
      style={{
        width: 76,
        height: 76,
        borderRadius: "50%",
        background: active ? palette.accent : "#FFFFFF",
        border: `5px solid ${palette.ink}`,
        color: "#FFFFFF",
        display: "grid",
        placeItems: "center",
        fontSize: 42,
        fontWeight: 950
      }}
    >
      {active ? "✓" : index}
    </div>
    <div style={{ fontSize: 38, fontWeight: 950, lineHeight: 1.12 }}>{text}</div>
  </div>
);

const FormulaPart = ({ palette, label, index, active }: { palette: Palette; label: string; index: number; active: boolean }) => {
  const operators = ["", "+", "+", "="];
  return (
    <>
      {index > 0 ? <div style={{ fontSize: 54, fontWeight: 950, color: palette.ink }}>{operators[index]}</div> : null}
      <div
        style={{
          flex: 1,
          minHeight: 150,
          borderRadius: 28,
          background: index === 3 ? palette.secondary : "#FFFFFF",
          border: `5px solid ${palette.ink}`,
          boxShadow: active ? `8px 8px 0 ${hexToRgba(palette.ink, 0.14)}` : "none",
          display: "grid",
          placeItems: "center",
          padding: 14,
          opacity: active ? 1 : 0.35,
          transform: `translateY(${active ? 0 : 30}px)`
        }}
      >
        <div style={{ fontSize: index === 3 ? 34 : 30, fontWeight: 950, textAlign: "center", lineHeight: 1.12 }}>{label}</div>
      </div>
    </>
  );
};

const FlowStrip = ({ palette, items, bottom }: { palette: Palette; items: string[]; bottom: number }) => (
  <div
    style={{
      position: "absolute",
      left: 42,
      right: 42,
      bottom,
      display: "flex",
      alignItems: "center",
      gap: 12
    }}
  >
    {items.slice(0, 4).map((item, index) => (
      <div key={item} style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
        <div
          style={{
            flex: 1,
            minHeight: 82,
            borderRadius: 22,
            background: "#FFFFFF",
            border: `4px solid ${palette.ink}`,
            display: "grid",
            placeItems: "center",
            padding: 10,
            fontSize: 26,
            fontWeight: 950,
            textAlign: "center",
            lineHeight: 1.1
          }}
        >
          {item}
        </div>
        {index < Math.min(3, items.length - 1) ? <InlineArrow color={palette.accent} /> : null}
      </div>
    ))}
  </div>
);

const Sticker = ({
  palette,
  text,
  left,
  top,
  rotate
}: {
  palette: Palette;
  text: string;
  left: number;
  top: number;
  rotate: number;
}) => (
  <div
    style={{
      position: "absolute",
      left,
      top,
      padding: "16px 22px",
      borderRadius: 999,
      background: palette.accent,
      color: "#FFFFFF",
      border: `5px solid ${palette.ink}`,
      boxShadow: `8px 8px 0 ${hexToRgba(palette.ink, 0.14)}`,
      fontSize: 28,
      lineHeight: 1.1,
      fontWeight: 950,
      transform: `rotate(${rotate}deg)`
    }}
  >
    {text}
  </div>
);

const Arrow = ({
  palette,
  left,
  top,
  width,
  progress
}: {
  palette: Palette;
  left: number;
  top: number;
  width: number;
  progress: number;
}) => (
  <div style={{ position: "absolute", left, top, width, height: 44 }}>
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 16,
        width: width * Math.min(1, progress * 1.8),
        height: 10,
        borderRadius: 999,
        background: palette.accent
      }}
    />
    <div
      style={{
        position: "absolute",
        right: 0,
        top: 2,
        width: 0,
        height: 0,
        borderTop: "22px solid transparent",
        borderBottom: "22px solid transparent",
        borderLeft: `30px solid ${palette.accent}`,
        opacity: progress > 0.18 ? 1 : 0
      }}
    />
  </div>
);

const MiniSpark = ({ color }: { color: string }) => (
  <div style={{ width: 28, height: 28, position: "relative" }}>
    <div style={{ position: "absolute", left: 12, top: 0, width: 6, height: 28, borderRadius: 99, background: color }} />
    <div style={{ position: "absolute", left: 0, top: 12, width: 28, height: 6, borderRadius: 99, background: color }} />
  </div>
);

const ShapeBlob = ({
  left,
  top,
  size,
  color,
  opacity,
  rotate
}: {
  left: number;
  top: number;
  size: number;
  color: string;
  opacity: number;
  rotate: number;
}) => (
  <div
    style={{
      position: "absolute",
      left,
      top,
      width: size,
      height: size,
      borderRadius: `${size * 0.3}px ${size * 0.45}px ${size * 0.22}px ${size * 0.5}px`,
      background: color,
      opacity,
      transform: `rotate(${rotate}deg)`
    }}
  />
);

function findScene(scenes: StoryboardScene[], seconds: number) {
  return scenes.find((scene) => seconds >= scene.startSeconds && seconds < scene.startSeconds + scene.durationSeconds) ?? scenes.at(-1);
}

function findCue(cues: SubtitleCue[], seconds: number) {
  return cues.find((cue) => seconds >= cue.startSeconds && seconds < cue.endSeconds) ?? cues.at(-1);
}

function sourceName(manifest: RenderManifest, scene?: StoryboardScene) {
  const firstUrl = scene?.sourceUrls[0];
  return manifest.sources.find((source) => source.url === firstUrl)?.publisher ?? manifest.sources[0]?.publisher ?? "来源清单";
}

function paletteFor(scene?: StoryboardScene): Palette {
  if (!scene) return scenePalettes["question-pop"];
  return scenePalettes[scene.layout] ?? scenePalettes["question-pop"];
}

function labelFor(kind: StoryboardScene["visualKind"]) {
  const labels: Record<StoryboardScene["visualKind"], string> = {
    hook: "先抓人",
    concept: "看机制",
    comparison: "拆误区",
    process: "走流程",
    warning: "亮警灯",
    recap: "拿工具",
    closing: "记公式"
  };
  return labels[kind];
}

function hexToRgba(hex: string, alpha: number) {
  const clean = hex.replace("#", "");
  const r = Number.parseInt(clean.slice(0, 2), 16);
  const g = Number.parseInt(clean.slice(2, 4), 16);
  const b = Number.parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
