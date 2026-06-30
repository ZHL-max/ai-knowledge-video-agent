import fs from "node:fs/promises";
import path from "node:path";
import fse from "fs-extra";
import {
  nowIso,
  publishPackageSchema,
  renderManifestSchema,
  runRecordSchema,
  type PublishPackage,
  type RenderManifest,
  type RunRecord,
  type StoryboardScene,
  type SubtitleCue,
  type VideoBrief
} from "../schema";
import { FileRunStore } from "../storage/file-store";
import { createLLMProviderFromEnv, type LLMProvider } from "../providers/llm";
import { StaticResearchProvider, type ResearchProvider } from "../providers/research";
import { createTTSProviderFromEnv, type TTSProvider } from "../providers/tts";
import { createPublisherFromEnv, ManualPublisher, type PublisherProvider } from "../providers/publisher";
import { BrightExplainerDirector, type CreativeDirectorAgent } from "../providers/creative-director";

export type ProviderBundle = {
  research: ResearchProvider;
  llm: LLMProvider;
  creativeDirector: CreativeDirectorAgent;
  tts: TTSProvider;
  publisher: PublisherProvider;
};

export function createDefaultProviders(): ProviderBundle {
  return {
    research: new StaticResearchProvider(),
    llm: createLLMProviderFromEnv(),
    creativeDirector: new BrightExplainerDirector(),
    tts: createTTSProviderFromEnv(),
    publisher: createPublisherFromEnv()
  };
}

export class VideoPipeline {
  constructor(
    private readonly store: FileRunStore,
    private readonly providers: ProviderBundle = createDefaultProviders()
  ) {}

  async createRun(input: Partial<VideoBrief> & { topic: string }): Promise<RunRecord> {
    const id = createRunId(input.topic);
    const brief: VideoBrief = {
      id,
      topic: input.topic,
      audience: input.audience ?? "对 AI 与科技感兴趣的抖音用户",
      tone: input.tone ?? "轻松、可信、节奏明确",
      platform: "douyin",
      aspectRatio: "9:16",
      durationTargetSeconds: input.durationTargetSeconds ?? 80,
      createdAt: nowIso()
    };
    const run = runRecordSchema.parse({
      id,
      stage: "brief",
      brief,
      updatedAt: nowIso()
    });
    return this.store.saveRun(run);
  }

  async generateAll(runId: string): Promise<RunRecord> {
    let run = await this.store.readRun(runId);
    const research = await this.providers.research.collect(run.brief);
    await this.store.saveResearch(run.id, research);
    run = await this.store.saveRun({ ...run, research, stage: "research" });

    const { script, storyboard: rawStoryboard } = await this.providers.llm.createScriptAndStoryboard(run.brief, research);
    const creative = await this.providers.creativeDirector.plan({
      brief: run.brief,
      script,
      storyboard: rawStoryboard
    });
    const storyboard = creative.storyboard;
    validateStoryboardTiming(storyboard, run.brief.durationTargetSeconds);
    await this.store.saveScript(run.id, script);
    await this.store.saveStoryboard(run.id, storyboard);
    run = await this.store.saveRun({ ...run, script, storyboard, stage: "storyboard" });

    const narrationText = storyboard.map((scene) => scene.narration).join("\n\n");
    const narration = await this.providers.tts.synthesize({
      runId: run.id,
      text: narrationText,
      outputDir: this.store.paths(run.id).audioDir
    });
    const timedStoryboard = retimeStoryboardToDuration(storyboard, narration.durationSeconds);
    validateStoryboardTiming(timedStoryboard, run.brief.durationTargetSeconds);
    await this.store.saveStoryboard(run.id, timedStoryboard);
    run = await this.store.saveRun({ ...run, storyboard: timedStoryboard, stage: "narration" });

    const manifest = renderManifestSchema.parse({
      runId: run.id,
      title: script.title,
      platform: "douyin",
      width: 1080,
      height: 1920,
      fps: 30,
      durationSeconds: storyboardEnd(timedStoryboard),
      scenes: timedStoryboard,
      subtitles: buildSubtitles(timedStoryboard),
      narration,
      creativeDirection: creative.direction,
      sources: research.sources,
      createdAt: nowIso()
    });
    await this.store.saveManifest(run.id, manifest);
    run = await this.store.saveRun({ ...run, manifest, stage: "manifest" });

    const pkg = await this.createPublishPackage(run.id);
    run = await this.store.saveRun({ ...run, publishPackage: pkg, stage: "packaged" });
    return run;
  }

  async createPublishPackage(runId: string): Promise<PublishPackage> {
    const run = await this.store.readRun(runId);
    if (!run.script || !run.research) {
      throw new Error("Script and research are required before creating a publish package.");
    }
    const paths = this.store.paths(runId);
    await fse.ensureDir(paths.packageDir);
    const videoPath = path.join(paths.outputDir, "video.mp4");
    const coverPath = path.join(paths.outputDir, "cover.png");
    const sourcesPath = path.join(paths.packageDir, "sources.md");
    const captionPath = path.join(paths.packageDir, "caption.md");
    const hasVideo = await exists(videoPath);
    const hasCover = await exists(coverPath);

    await fs.writeFile(
      sourcesPath,
      [
        `# 来源清单 - ${run.script.title}`,
        "",
        ...run.research.sources.map((source, index) => `${index + 1}. [${source.title}](${source.url}) - ${source.publisher}\n   ${source.notes}`),
        ""
      ].join("\n"),
      "utf8"
    );

    await fs.writeFile(
      captionPath,
      [
        `# ${run.script.title}`,
        "",
        run.script.description,
        "",
        run.script.hashtags.join(" "),
        "",
        "## 发布前检查",
        "- 已人工审核脚本、分镜、字幕、来源清单",
        "- 已确认视频画面无文字遮挡",
        "- 已确认账号发布行为由操作者主动触发",
        ""
      ].join("\n"),
      "utf8"
    );

    const pkg = publishPackageSchema.parse({
      runId,
      title: run.script.title,
      description: run.script.description,
      hashtags: run.script.hashtags,
      videoPath: hasVideo ? videoPath : undefined,
      coverPath: hasCover ? coverPath : undefined,
      sourcesPath,
      captionPath,
      readyForManualPublish: true,
      createdAt: nowIso()
    });
    await this.store.savePublishPackage(runId, pkg);
    return pkg;
  }

  async publish(runId: string, confirm: boolean) {
    const run = await this.store.readRun(runId);
    const pkg = run.publishPackage ?? (await this.createPublishPackage(runId));
    const publisher = this.providers.publisher.isConfigured() ? this.providers.publisher : new ManualPublisher();
    const result = await publisher.publish(pkg, { confirm });
    await this.store.savePublishResult(runId, result);
    await this.store.saveRun({ ...run, publishPackage: pkg, publishResult: result, stage: result.status === "submitted" ? "published" : run.stage });
    return result;
  }
}

export function buildSubtitles(storyboard: StoryboardScene[]): SubtitleCue[] {
  const cues: SubtitleCue[] = [];
  for (const scene of storyboard) {
    const chunks = splitChineseSubtitle(scene.narration);
    const slot = scene.durationSeconds / chunks.length;
    chunks.forEach((text, index) => {
      const startSeconds = round(scene.startSeconds + index * slot);
      cues.push({
        startSeconds,
        endSeconds: round(scene.startSeconds + Math.min(scene.durationSeconds, (index + 1) * slot)),
        text
      });
    });
  }
  return cues;
}

export function validateStoryboardTiming(storyboard: StoryboardScene[], targetSeconds: number) {
  if (storyboard.length === 0) throw new Error("Storyboard cannot be empty.");
  const end = storyboardEnd(storyboard);
  const shortForm = targetSeconds <= 100;
  const minSeconds = shortForm ? 60 : Math.max(60, targetSeconds - 40);
  const maxSeconds = shortForm ? 90 : Math.min(240, targetSeconds + 40);
  if (end < minSeconds || end > maxSeconds) {
    throw new Error(`Storyboard duration ${end}s is outside the expected ${minSeconds}-${maxSeconds}s range.`);
  }
  storyboard.forEach((scene, index) => {
    if (index === 0 && scene.startSeconds !== 0) {
      throw new Error("First scene must start at 0 seconds.");
    }
    const previous = storyboard[index - 1];
    if (previous && Math.abs(scene.startSeconds - (previous.startSeconds + previous.durationSeconds)) > 0.01) {
      throw new Error(`Scene ${scene.id} does not start after the previous scene.`);
    }
    if (scene.sourceUrls.length === 0) {
      throw new Error(`Scene ${scene.id} must include at least one source URL.`);
    }
  });
}

export function storyboardEnd(storyboard: StoryboardScene[]) {
  return Math.max(...storyboard.map((scene) => scene.startSeconds + scene.durationSeconds));
}

export function retimeStoryboardToDuration(storyboard: StoryboardScene[], durationSeconds: number) {
  const originalEnd = storyboardEnd(storyboard);
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0 || originalEnd <= 0) return storyboard;
  const scale = durationSeconds / originalEnd;
  let cursor = 0;
  return storyboard.map((scene, index) => {
    const isLast = index === storyboard.length - 1;
    const nextDuration = isLast ? round(durationSeconds - cursor) : round(scene.durationSeconds * scale);
    const retimedScene = {
      ...scene,
      startSeconds: round(cursor),
      durationSeconds: Math.max(0.1, nextDuration)
    };
    cursor += retimedScene.durationSeconds;
    return retimedScene;
  });
}

function splitChineseSubtitle(text: string): string[] {
  const sentences = text
    .split(/(?<=[。！？；])/)
    .map((part) => part.trim())
    .filter(Boolean);
  const chunks: string[] = [];
  for (const sentence of sentences) {
    if (sentence.length <= 24) {
      chunks.push(sentence);
      continue;
    }
    for (let index = 0; index < sentence.length; index += 22) {
      chunks.push(sentence.slice(index, index + 22));
    }
  }
  return chunks.length > 0 ? chunks : [text.slice(0, 24)];
}

function createRunId(topic: string) {
  const slug = topic
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 20);
  const stamp = new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);
  return `run_${stamp}_${slug || "video"}`;
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}

async function exists(target: string) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}
