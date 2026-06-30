import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import cors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import Fastify from "fastify";
import { z } from "zod";
import { createAppContext } from "./context";

const execFileAsync = promisify(execFile);
const app = Fastify({ logger: true });
const { projectRoot, store, pipeline } = createAppContext();

await app.register(cors, {
  origin: true
});

await app.register(fastifyStatic, {
  root: store.dataDir,
  prefix: "/media/"
});

app.get("/api/health", async () => ({
  ok: true,
  projectRoot,
  dataDir: store.dataDir
}));

app.get("/api/runs", async () => ({
  runs: await store.listRuns()
}));

app.get("/api/runs/:id", async (request, reply) => {
  const { id } = z.object({ id: z.string() }).parse(request.params);
  try {
    return { run: await store.readRun(id) };
  } catch {
    return reply.code(404).send({ error: "Run not found" });
  }
});

app.post("/api/runs", async (request) => {
  const body = z
    .object({
      topic: z.string().min(2).default("大模型为什么会幻觉"),
      durationTargetSeconds: z.number().int().min(60).max(240).default(150)
    })
    .parse(request.body ?? {});
  const run = await pipeline.createRun(body);
  return { run };
});

app.post("/api/runs/:id/generate", async (request) => {
  const { id } = z.object({ id: z.string() }).parse(request.params);
  const run = await pipeline.generateAll(id);
  return { run };
});

app.post("/api/runs/:id/render", async (request) => {
  const { id } = z.object({ id: z.string() }).parse(request.params);
  const rendererCwd = path.join(projectRoot, "apps/renderer");
  const { stdout, stderr } = await execFileAsync(
    "pnpm",
    ["--dir", projectRoot, "--filter", "@aivideo/renderer", "render", id],
    {
      cwd: rendererCwd,
      env: {
        ...process.env,
        AKVA_PROJECT_ROOT: projectRoot
      },
      maxBuffer: 1024 * 1024 * 20
    }
  );
  const pkg = await pipeline.createPublishPackage(id);
  const run = await store.readRun(id);
  await store.saveRun({ ...run, publishPackage: pkg, stage: "packaged" });
  return { stdout, stderr, package: pkg };
});

app.post("/api/runs/:id/package", async (request) => {
  const { id } = z.object({ id: z.string() }).parse(request.params);
  return { package: await pipeline.createPublishPackage(id) };
});

app.post("/api/runs/:id/publish/douyin", async (request) => {
  const { id } = z.object({ id: z.string() }).parse(request.params);
  const body = z.object({ confirm: z.literal(true) }).parse(request.body);
  return { result: await pipeline.publish(id, body.confirm) };
});

const port = Number(process.env.PORT ?? 8787);
const host = process.env.HOST ?? "127.0.0.1";
await app.listen({ port, host });
