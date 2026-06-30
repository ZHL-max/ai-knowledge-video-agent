import { z } from "zod";

export const runStageSchema = z.enum([
  "brief",
  "research",
  "script",
  "storyboard",
  "narration",
  "manifest",
  "rendered",
  "packaged",
  "published"
]);

export const sourceSchema = z.object({
  title: z.string().min(2),
  url: z.string().url(),
  publisher: z.string().min(2),
  notes: z.string().min(4)
});

export const videoBriefSchema = z.object({
  id: z.string().min(6),
  topic: z.string().min(2),
  audience: z.string().default("对 AI 与科技感兴趣的抖音用户"),
  tone: z.string().default("轻松、可信、节奏明确"),
  platform: z.literal("douyin").default("douyin"),
  aspectRatio: z.literal("9:16").default("9:16"),
  durationTargetSeconds: z.number().int().min(60).max(240).default(150),
  createdAt: z.string().datetime()
});

export const researchNoteSchema = z.object({
  topic: z.string(),
  summary: z.string().min(20),
  claims: z.array(z.string().min(8)).min(3),
  sources: z.array(sourceSchema).min(3),
  checkedAt: z.string().datetime()
});

export const scriptSectionSchema = z.object({
  id: z.string(),
  title: z.string().min(2),
  narration: z.string().min(10),
  sourceUrls: z.array(z.string().url()).min(1)
});

export const scriptDraftSchema = z.object({
  title: z.string().min(4).max(60),
  hook: z.string().min(8),
  sections: z.array(scriptSectionSchema).min(5),
  closing: z.string().min(8),
  hashtags: z.array(z.string().min(2)).min(3),
  description: z.string().min(20).max(700)
});

export const visualKindSchema = z.enum([
  "hook",
  "concept",
  "comparison",
  "process",
  "warning",
  "recap",
  "closing"
]);

export const storyboardSceneSchema = z.object({
  id: z.string(),
  sectionId: z.string(),
  startSeconds: z.number().nonnegative(),
  durationSeconds: z.number().positive(),
  visualKind: visualKindSchema,
  headline: z.string().min(2).max(40),
  narration: z.string().min(8),
  bullets: z.array(z.string().min(2)).min(1).max(4),
  accent: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  sourceUrls: z.array(z.string().url()).min(1)
});

export const subtitleCueSchema = z.object({
  startSeconds: z.number().nonnegative(),
  endSeconds: z.number().positive(),
  text: z.string().min(1)
});

export const narrationAssetSchema = z.object({
  provider: z.string(),
  voice: z.string(),
  text: z.string(),
  audioPath: z.string(),
  audioPublicPath: z.string().optional(),
  durationSeconds: z.number().positive()
});

export const renderManifestSchema = z.object({
  runId: z.string(),
  title: z.string(),
  platform: z.literal("douyin"),
  width: z.literal(1080),
  height: z.literal(1920),
  fps: z.literal(30),
  durationSeconds: z.number().positive(),
  scenes: z.array(storyboardSceneSchema).min(1),
  subtitles: z.array(subtitleCueSchema).min(1),
  narration: narrationAssetSchema.optional(),
  sources: z.array(sourceSchema).min(3),
  createdAt: z.string().datetime()
});

export const publishPackageSchema = z.object({
  runId: z.string(),
  title: z.string().min(4).max(80),
  description: z.string().min(20).max(700),
  hashtags: z.array(z.string()).min(3),
  videoPath: z.string().optional(),
  coverPath: z.string().optional(),
  sourcesPath: z.string(),
  captionPath: z.string(),
  readyForManualPublish: z.boolean(),
  createdAt: z.string().datetime()
});

export const publishResultSchema = z.object({
  provider: z.string(),
  status: z.enum(["skipped", "uploaded", "submitted", "failed"]),
  message: z.string(),
  remoteVideoId: z.string().optional(),
  createdAt: z.string().datetime()
});

export const runRecordSchema = z.object({
  id: z.string(),
  stage: runStageSchema,
  brief: videoBriefSchema,
  research: researchNoteSchema.optional(),
  script: scriptDraftSchema.optional(),
  storyboard: z.array(storyboardSceneSchema).optional(),
  manifest: renderManifestSchema.optional(),
  publishPackage: publishPackageSchema.optional(),
  publishResult: publishResultSchema.optional(),
  updatedAt: z.string().datetime()
});

export type RunStage = z.infer<typeof runStageSchema>;
export type Source = z.infer<typeof sourceSchema>;
export type VideoBrief = z.infer<typeof videoBriefSchema>;
export type ResearchNote = z.infer<typeof researchNoteSchema>;
export type ScriptDraft = z.infer<typeof scriptDraftSchema>;
export type ScriptSection = z.infer<typeof scriptSectionSchema>;
export type StoryboardScene = z.infer<typeof storyboardSceneSchema>;
export type SubtitleCue = z.infer<typeof subtitleCueSchema>;
export type NarrationAsset = z.infer<typeof narrationAssetSchema>;
export type RenderManifest = z.infer<typeof renderManifestSchema>;
export type PublishPackage = z.infer<typeof publishPackageSchema>;
export type PublishResult = z.infer<typeof publishResultSchema>;
export type RunRecord = z.infer<typeof runRecordSchema>;

export const nowIso = () => new Date().toISOString();
