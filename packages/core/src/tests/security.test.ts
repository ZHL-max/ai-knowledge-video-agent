import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../../");

describe("secret hygiene", () => {
  it("keeps dotenv files ignored and example-only", () => {
    const gitignore = fs.readFileSync(path.join(projectRoot, ".gitignore"), "utf8");
    expect(gitignore).toContain(".env");
    expect(gitignore).toContain("!.env.example");
  });

  it("does not contain committed GitHub personal access tokens", () => {
    const files = collectTextFiles(projectRoot);
    for (const file of files) {
      const content = fs.readFileSync(file, "utf8");
      expect(content).not.toMatch(/ghp_[A-Za-z0-9_]{20,}/);
    }
  });
});

function collectTextFiles(root: string): string[] {
  const ignored = new Set(["node_modules", ".git", "data", "outputs", "dist", "build"]);
  const results: string[] = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectTextFiles(full));
    } else if (/\.(ts|tsx|json|md|yaml|yml|gitignore|example|css|html)$/i.test(entry.name)) {
      results.push(full);
    }
  }
  return results;
}
