import { AbsoluteFill, Audio, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { RenderManifest, StoryboardScene, SubtitleCue } from "@aivideo/core";

export const KnowledgeVideo = ({ manifest }: { manifest: RenderManifest }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const seconds = frame / fps;
  const scene = findScene(manifest.scenes, seconds);
  const cue = findCue(manifest.subtitles, seconds);
  const sceneProgress = scene
    ? Math.min(1, Math.max(0, (seconds - scene.startSeconds) / scene.durationSeconds))
    : 0;
  const entrance = spring({ frame, fps, config: { damping: 24, stiffness: 90 } });
  const sceneShift = interpolate(sceneProgress, [0, 1], [0, -80], { extrapolateRight: "clamp" });
  const progress = frame / Math.max(1, durationInFrames - 1);

  return (
    <AbsoluteFill
      style={{
        background: "#0B0F14",
        color: "#F7FAFC",
        fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
        overflow: "hidden"
      }}
    >
      {manifest.narration?.audioPublicPath ? <Audio src={staticFile(manifest.narration.audioPublicPath)} /> : null}
      <Background scene={scene} progress={sceneProgress} />
      <div
        style={{
          position: "absolute",
          inset: 70,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          opacity: entrance,
          transform: `translateY(${(1 - entrance) * 28}px)`
        }}
      >
        <Header manifest={manifest} scene={scene} progress={progress} />
        <main
          style={{
            transform: `translateY(${sceneShift}px)`,
            transition: "transform 120ms linear"
          }}
        >
          <SceneBody scene={scene} sceneProgress={sceneProgress} />
        </main>
        <Footer cue={cue} sourceName={sourceName(manifest, scene)} />
      </div>
    </AbsoluteFill>
  );
};

const Background = ({ scene, progress }: { scene?: StoryboardScene; progress: number }) => {
  const accent = scene?.accent ?? "#5EEAD4";
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 20% 10%, rgba(94,234,212,0.18), transparent 34%), linear-gradient(145deg, #0B0F14 0%, #151A22 54%, #101820 100%)"
        }}
      />
      <div
        style={{
          position: "absolute",
          left: -160,
          top: 260,
          width: 1320,
          height: 1320,
          border: `2px solid ${hexToRgba(accent, 0.25)}`,
          borderRadius: "50%",
          transform: `rotate(${progress * 18}deg) scale(${1 + progress * 0.04})`
        }}
      />
      <div
        style={{
          position: "absolute",
          right: -260,
          top: 680,
          width: 640,
          height: 640,
          background: hexToRgba(accent, 0.16),
          transform: `rotate(45deg) translateY(${progress * 80}px)`,
          borderRadius: 36
        }}
      />
    </AbsoluteFill>
  );
};

const Header = ({
  manifest,
  scene,
  progress
}: {
  manifest: RenderManifest;
  scene?: StoryboardScene;
  progress: number;
}) => {
  const accent = scene?.accent ?? "#5EEAD4";
  return (
    <header>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div style={{ fontSize: 30, letterSpacing: 0, color: "#D4DDE8", fontWeight: 700 }}>AI 知识普及</div>
        <div style={{ color: accent, fontSize: 26, fontWeight: 800 }}>{Math.round(progress * 100)}%</div>
      </div>
      <div style={{ height: 8, background: "rgba(255,255,255,0.11)", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ width: `${progress * 100}%`, height: "100%", background: accent }} />
      </div>
      <h1 style={{ fontSize: 56, lineHeight: 1.08, margin: "42px 0 0", letterSpacing: 0, maxWidth: 830 }}>
        {manifest.title}
      </h1>
    </header>
  );
};

const SceneBody = ({ scene, sceneProgress }: { scene?: StoryboardScene; sceneProgress: number }) => {
  if (!scene) return null;
  const accent = scene.accent;
  const pulse = interpolate(sceneProgress, [0, 0.12, 1], [0.94, 1, 1.04], { extrapolateRight: "clamp" });
  return (
    <section style={{ marginTop: 120 }}>
      <div
        style={{
          fontSize: 38,
          color: accent,
          fontWeight: 900,
          marginBottom: 28
        }}
      >
        {labelFor(scene.visualKind)}
      </div>
      <div
        style={{
          fontSize: 92,
          lineHeight: 1.02,
          fontWeight: 950,
          maxWidth: 870,
          letterSpacing: 0,
          transform: `scale(${pulse})`,
          transformOrigin: "left center"
        }}
      >
        {scene.headline}
      </div>
      <div style={{ marginTop: 82, display: "grid", gap: 24 }}>
        {scene.bullets.map((bullet, index) => (
          <div
            key={bullet}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 22,
              opacity: sceneProgress > index * 0.12 ? 1 : 0.18,
              transform: `translateX(${sceneProgress > index * 0.12 ? 0 : 24}px)`,
              transition: "all 120ms linear"
            }}
          >
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                background: accent,
                boxShadow: `0 0 32px ${hexToRgba(accent, 0.46)}`
              }}
            />
            <div style={{ fontSize: 42, lineHeight: 1.2, fontWeight: 800, color: "#E8EEF7" }}>{bullet}</div>
          </div>
        ))}
      </div>
    </section>
  );
};

const Footer = ({ cue, sourceName }: { cue?: SubtitleCue; sourceName: string }) => {
  return (
    <footer style={{ display: "grid", gap: 24 }}>
      <div
        style={{
          minHeight: 154,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "28px 34px",
          background: "rgba(8,12,18,0.74)",
          border: "1px solid rgba(255,255,255,0.14)",
          borderRadius: 22
        }}
      >
        <div style={{ fontSize: 42, lineHeight: 1.28, fontWeight: 850, textAlign: "center" }}>
          {cue?.text ?? ""}
        </div>
      </div>
      <div style={{ fontSize: 24, color: "#AAB7C7", display: "flex", justifyContent: "space-between" }}>
        <span>来源：{sourceName}</span>
        <span>人审后发布</span>
      </div>
    </footer>
  );
};

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

function labelFor(kind: StoryboardScene["visualKind"]) {
  const labels: Record<StoryboardScene["visualKind"], string> = {
    hook: "先抓重点",
    concept: "概念拆解",
    comparison: "误区对照",
    process: "解决流程",
    warning: "高风险场景",
    recap: "实用检查",
    closing: "一句话记住"
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
