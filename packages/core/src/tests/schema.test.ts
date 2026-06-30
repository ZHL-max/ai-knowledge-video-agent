import { describe, expect, it } from "vitest";
import { renderManifestSchema, storyboardSceneSchema } from "@aivideo/core";

describe("schemas", () => {
  it("rejects scenes without sources", () => {
    expect(() =>
      storyboardSceneSchema.parse({
        id: "scene-1",
        sectionId: "s1",
        startSeconds: 0,
        durationSeconds: 20,
        visualKind: "hook",
        headline: "测试",
        narration: "这是一个测试旁白。",
        bullets: ["测试"],
        accent: "#5EEAD4",
        sourceUrls: []
      })
    ).toThrow();
  });

  it("requires a vertical Douyin render manifest with sources", () => {
    expect(() =>
      renderManifestSchema.parse({
        runId: "run_test",
        title: "测试视频",
        platform: "douyin",
        width: 1080,
        height: 1920,
        fps: 30,
        durationSeconds: 12,
        scenes: [],
        subtitles: [],
        sources: [],
        createdAt: new Date().toISOString()
      })
    ).toThrow();
  });
});
