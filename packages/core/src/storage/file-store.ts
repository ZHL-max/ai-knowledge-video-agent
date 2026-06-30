import fs from "node:fs/promises";
import path from "node:path";
import fse from "fs-extra";
import {
  nowIso,
  publishPackageSchema,
  publishResultSchema,
  renderManifestSchema,
  researchNoteSchema,
  runRecordSchema,
  type PublishPackage,
  type PublishResult,
  type RenderManifest,
  type ResearchNote,
  type RunRecord,
  type ScriptDraft,
  type StoryboardScene
} from "../schema";

export type RunPaths = {
  root: string;
  runDir: string;
  assetsDir: string;
  audioDir: string;
  outputDir: string;
  packageDir: string;
};

export class FileRunStore {
  readonly projectRoot: string;
  readonly dataDir: string;

  constructor(projectRoot: string, dataDir?: string) {
    this.projectRoot = path.resolve(projectRoot);
    this.dataDir = path.resolve(
      this.projectRoot,
      dataDir ?? process.env.AKVA_DATA_DIR ?? "data/runs"
    );
  }

  paths(runId: string): RunPaths {
    const runDir = path.join(this.dataDir, runId);
    return {
      root: this.projectRoot,
      runDir,
      assetsDir: path.join(runDir, "assets"),
      audioDir: path.join(runDir, "assets", "audio"),
      outputDir: path.join(runDir, "output"),
      packageDir: path.join(runDir, "publish-package")
    };
  }

  async ensureRunDirs(runId: string) {
    const p = this.paths(runId);
    await fse.ensureDir(p.assetsDir);
    await fse.ensureDir(p.audioDir);
    await fse.ensureDir(p.outputDir);
    await fse.ensureDir(p.packageDir);
  }

  async saveRun(record: RunRecord): Promise<RunRecord> {
    const parsed = runRecordSchema.parse({ ...record, updatedAt: nowIso() });
    await this.ensureRunDirs(parsed.id);
    await this.writeJson(parsed.id, "run.json", parsed);
    return parsed;
  }

  async readRun(runId: string): Promise<RunRecord> {
    const raw = await this.readJson(runId, "run.json");
    return runRecordSchema.parse(raw);
  }

  async listRuns(): Promise<RunRecord[]> {
    await fse.ensureDir(this.dataDir);
    const entries = await fs.readdir(this.dataDir, { withFileTypes: true });
    const runs: RunRecord[] = [];
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      try {
        runs.push(await this.readRun(entry.name));
      } catch {
        // Ignore incomplete folders so a failed render does not break the UI.
      }
    }
    return runs.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async saveResearch(runId: string, research: ResearchNote) {
    await this.writeJson(runId, "research.json", researchNoteSchema.parse(research));
  }

  async saveScript(runId: string, script: ScriptDraft) {
    await this.writeJson(runId, "script.json", script);
  }

  async saveStoryboard(runId: string, storyboard: StoryboardScene[]) {
    await this.writeJson(runId, "storyboard.json", storyboard);
  }

  async saveManifest(runId: string, manifest: RenderManifest) {
    await this.writeJson(runId, "manifest.json", renderManifestSchema.parse(manifest));
  }

  async readManifest(runId: string): Promise<RenderManifest> {
    return renderManifestSchema.parse(await this.readJson(runId, "manifest.json"));
  }

  async savePublishPackage(runId: string, pkg: PublishPackage) {
    await this.writeJson(runId, "publish-package.json", publishPackageSchema.parse(pkg));
  }

  async savePublishResult(runId: string, result: PublishResult) {
    await this.writeJson(runId, "publish-result.json", publishResultSchema.parse(result));
  }

  async writeText(runId: string, relativePath: string, content: string) {
    await this.ensureRunDirs(runId);
    const target = path.join(this.paths(runId).runDir, relativePath);
    await fse.ensureDir(path.dirname(target));
    await fs.writeFile(target, content, "utf8");
    return target;
  }

  async writeJson(runId: string, fileName: string, content: unknown) {
    await this.ensureRunDirs(runId);
    const target = path.join(this.paths(runId).runDir, fileName);
    await fs.writeFile(target, `${JSON.stringify(content, null, 2)}\n`, "utf8");
    return target;
  }

  async readJson(runId: string, fileName: string) {
    const target = path.join(this.paths(runId).runDir, fileName);
    return JSON.parse(await fs.readFile(target, "utf8")) as unknown;
  }
}
