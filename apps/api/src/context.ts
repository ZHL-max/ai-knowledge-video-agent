import path from "node:path";
import { config } from "dotenv";
import { FileRunStore, VideoPipeline, createDefaultProviders } from "@aivideo/core";

export function resolveProjectRoot() {
  const workspaceRoot = path.resolve(process.cwd(), "../..");
  config({ path: path.join(workspaceRoot, ".env") });
  const configured = process.env.AKVA_PROJECT_ROOT;
  if (!configured || configured === ".") return workspaceRoot;
  return path.resolve(workspaceRoot, configured);
}

export function createAppContext() {
  const projectRoot = resolveProjectRoot();
  const store = new FileRunStore(projectRoot, process.env.AKVA_DATA_DIR);
  const pipeline = new VideoPipeline(store, createDefaultProviders());
  return { projectRoot, store, pipeline };
}
