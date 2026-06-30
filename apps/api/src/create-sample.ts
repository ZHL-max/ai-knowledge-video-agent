import { createAppContext } from "./context";

const { pipeline } = createAppContext();

const run = await pipeline.createRun({
  topic: "大模型为什么会幻觉",
  durationTargetSeconds: 80
});

const generated = await pipeline.generateAll(run.id);
console.log(JSON.stringify({ runId: generated.id, stage: generated.stage }, null, 2));
