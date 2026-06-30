import os from "node:os";
import path from "node:path";
import fs from "node:fs/promises";
import { describe, expect, it } from "vitest";
import {
  FileRunStore,
  ManualPublisher,
  MockTTSProvider,
  StaticResearchProvider,
  TemplateLLMProvider,
  VideoPipeline,
  storyboardEnd,
  validateStoryboardTiming
} from "@aivideo/core";

describe("VideoPipeline", () => {
  it("generates a sourced Douyin publish package for the sample topic", async () => {
    const projectRoot = await fs.mkdtemp(path.join(os.tmpdir(), "akva-"));
    const store = new FileRunStore(projectRoot, "data/runs");
    const pipeline = new VideoPipeline(store, {
      research: new StaticResearchProvider(),
      llm: new TemplateLLMProvider(),
      tts: new MockTTSProvider(),
      publisher: new ManualPublisher()
    });

    const run = await pipeline.createRun({
      topic: "大模型为什么会幻觉",
      durationTargetSeconds: 150
    });
    const generated = await pipeline.generateAll(run.id);

    expect(generated.stage).toBe("packaged");
    expect(generated.research?.sources.length).toBeGreaterThanOrEqual(3);
    expect(generated.script?.sections.length).toBeGreaterThanOrEqual(5);
    expect(generated.storyboard).toBeDefined();
    expect(generated.manifest?.width).toBe(1080);
    expect(generated.manifest?.height).toBe(1920);
    expect(generated.manifest?.subtitles.every((cue) => cue.endSeconds > cue.startSeconds)).toBe(true);
    expect(generated.publishPackage?.readyForManualPublish).toBe(true);

    validateStoryboardTiming(generated.storyboard!, 150);
    expect(storyboardEnd(generated.storyboard!)).toBeGreaterThanOrEqual(120);
    expect(storyboardEnd(generated.storyboard!)).toBeLessThanOrEqual(180);
  });
});
