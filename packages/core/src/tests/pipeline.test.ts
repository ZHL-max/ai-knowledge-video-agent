import os from "node:os";
import path from "node:path";
import fs from "node:fs/promises";
import { describe, expect, it } from "vitest";
import {
  FileRunStore,
  BrightExplainerDirector,
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
      creativeDirector: new BrightExplainerDirector(),
      tts: new MockTTSProvider(),
      publisher: new ManualPublisher()
    });

    const run = await pipeline.createRun({
      topic: "大模型为什么会幻觉",
      durationTargetSeconds: 80
    });
    const generated = await pipeline.generateAll(run.id);

    expect(generated.stage).toBe("packaged");
    expect(generated.research?.sources.length).toBeGreaterThanOrEqual(3);
    expect(generated.script?.sections.length).toBeGreaterThanOrEqual(5);
    expect(generated.storyboard).toBeDefined();
    expect(generated.manifest?.width).toBe(1080);
    expect(generated.manifest?.height).toBe(1920);
    expect(generated.manifest?.creativeDirection?.visualThesis).toContain("亮色");
    expect(generated.storyboard?.every((scene) => scene.visualPlan && scene.layout)).toBe(true);
    expect(generated.manifest?.subtitles.every((cue) => cue.endSeconds > cue.startSeconds)).toBe(true);
    expect(generated.publishPackage?.readyForManualPublish).toBe(true);

    validateStoryboardTiming(generated.storyboard!, 80);
    expect(storyboardEnd(generated.storyboard!)).toBeGreaterThanOrEqual(60);
    expect(storyboardEnd(generated.storyboard!)).toBeLessThanOrEqual(90);
  });
});
