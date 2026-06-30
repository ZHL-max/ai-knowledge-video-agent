import fs from "node:fs/promises";
import path from "node:path";
import fse from "fs-extra";
import { bundle } from "@remotion/bundler";
import { renderMedia, renderStill, selectComposition } from "@remotion/renderer";
import { FileRunStore } from "@aivideo/core";

const projectRoot = path.resolve(process.env.AKVA_PROJECT_ROOT ?? path.join(process.cwd(), "../.."));
const store = new FileRunStore(projectRoot, process.env.AKVA_DATA_DIR);
const runId = process.argv[2] ?? (await latestRunId());

if (!runId) {
  throw new Error("No run id provided and no existing runs found.");
}

const run = await store.readRun(runId);
if (!run.manifest) {
  throw new Error(`Run ${runId} has no render manifest. Generate it first.`);
}

const paths = store.paths(runId);
await fse.ensureDir(paths.outputDir);

const publicAudioDir = path.join(process.cwd(), "public", "audio");
await fse.ensureDir(publicAudioDir);

const manifest = { ...run.manifest };
if (manifest.narration?.audioPath) {
  const ext = path.extname(manifest.narration.audioPath) || ".mp3";
  const publicFileName = `${runId}${ext}`;
  await fs.copyFile(manifest.narration.audioPath, path.join(publicAudioDir, publicFileName));
  manifest.narration = {
    ...manifest.narration,
    audioPublicPath: `audio/${publicFileName}`
  };
  await store.saveManifest(runId, manifest);
}

const entryPoint = path.join(process.cwd(), "src", "index.ts");
const serveUrl = await bundle({
  entryPoint,
  webpackOverride: (config) => config
});

const composition = await selectComposition({
  serveUrl,
  id: "KnowledgeVideo",
  inputProps: { manifest }
});

const videoPath = path.join(paths.outputDir, "video.mp4");
const coverPath = path.join(paths.outputDir, "cover.png");

await renderMedia({
  composition,
  serveUrl,
  codec: "h264",
  outputLocation: videoPath,
  inputProps: { manifest },
  chromiumOptions: {
    headless: true
  }
});

await renderStill({
  composition,
  serveUrl,
  output: coverPath,
  inputProps: { manifest },
  frame: Math.min(45, composition.durationInFrames - 1)
});

const updated = await store.readRun(runId);
await store.saveRun({
  ...updated,
  manifest,
  stage: "rendered"
});

console.log(JSON.stringify({ runId, videoPath, coverPath }, null, 2));

async function latestRunId() {
  const runs = await store.listRuns();
  return runs[0]?.id;
}
