import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Clapperboard,
  FileText,
  Loader2,
  Mic2,
  Play,
  Plus,
  RefreshCcw,
  Send,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import type { RunRecord, RunStage } from "@aivideo/core";

const API = import.meta.env.VITE_API_URL ?? "";
const stageLabels: Record<RunStage, string> = {
  brief: "选题",
  research: "资料",
  script: "脚本",
  storyboard: "分镜",
  narration: "配音",
  manifest: "清单",
  rendered: "成片",
  packaged: "发布包",
  published: "已发布"
};

export const App = () => {
  const [runs, setRuns] = useState<RunRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string>();
  const [topic, setTopic] = useState("大模型为什么会幻觉");
  const [busy, setBusy] = useState<string>();
  const [message, setMessage] = useState("就绪");

  const selected = useMemo(() => runs.find((run) => run.id === selectedId) ?? runs[0], [runs, selectedId]);
  const narration = selected?.manifest?.narration;
  const narrationIsFallback = narration ? narration.provider.includes("fallback") : false;

  useEffect(() => {
    void refresh();
  }, []);

  async function refresh() {
    const data = await request<{ runs: RunRecord[] }>("/api/runs");
    setRuns(data.runs);
    if (!selectedId && data.runs[0]) setSelectedId(data.runs[0].id);
  }

  async function createRun() {
    await act("create", "创建任务中", async () => {
      const data = await request<{ run: RunRecord }>("/api/runs", {
        method: "POST",
        body: JSON.stringify({ topic, durationTargetSeconds: 80 })
      });
      setSelectedId(data.run.id);
      await refresh();
      setMessage("任务已创建");
    });
  }

  async function generateRun() {
    if (!selected) return;
    await act("generate", "生成脚本、分镜与配音中", async () => {
      await request(`/api/runs/${selected.id}/generate`, { method: "POST" });
      await refresh();
      setMessage("脚本、分镜、配音和发布包已生成");
    });
  }

  async function renderRun() {
    if (!selected) return;
    await act("render", "渲染 MP4 与封面中", async () => {
      await request(`/api/runs/${selected.id}/render`, { method: "POST" });
      await refresh();
      setMessage("视频与封面已渲染");
    });
  }

  async function exportPackage() {
    if (!selected) return;
    await act("package", "更新发布包中", async () => {
      await request(`/api/runs/${selected.id}/package`, { method: "POST" });
      await refresh();
      setMessage("发布包已更新");
    });
  }

  async function publishDouyin() {
    if (!selected) return;
    const ok = window.confirm("确认由你主动触发抖音发布？未配置凭据时会保留手动发布包。");
    if (!ok) return;
    await act("publish", "提交抖音发布流程中", async () => {
      await request(`/api/runs/${selected.id}/publish/douyin`, {
        method: "POST",
        body: JSON.stringify({ confirm: true })
      });
      await refresh();
      setMessage("发布流程已完成或已跳过");
    });
  }

  async function act(key: string, label: string, fn: () => Promise<void>) {
    try {
      setBusy(key);
      setMessage(label);
      await fn();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "操作失败");
    } finally {
      setBusy(undefined);
    }
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <Clapperboard size={25} />
          <span>AI Knowledge Video Agent</span>
        </div>

        <div className="create-row">
          <input value={topic} onChange={(event) => setTopic(event.target.value)} aria-label="选题" />
          <button className="icon-button primary" onClick={createRun} disabled={Boolean(busy)} title="创建任务">
            {busy === "create" ? <Loader2 className="spin" size={18} /> : <Plus size={18} />}
          </button>
        </div>

        <div className="run-list">
          {runs.map((run) => (
            <button
              key={run.id}
              className={`run-item ${run.id === selected?.id ? "active" : ""}`}
              onClick={() => setSelectedId(run.id)}
            >
              <span>{run.brief.topic}</span>
              <small>{stageLabels[run.stage]}</small>
            </button>
          ))}
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">抖音知识科普 / 人审后发布</p>
            <h1>{selected?.brief.topic ?? "创建第一条视频任务"}</h1>
          </div>
          <button className="ghost-button" onClick={refresh} title="刷新">
            <RefreshCcw size={18} />
            刷新
          </button>
        </header>

        {selected ? (
          <motion.section
            className="review-surface"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24 }}
          >
            <StageRail stage={selected.stage} />
            <div className="actions">
              <ActionButton busy={busy === "generate"} icon={<Sparkles size={18} />} label="生成" onClick={generateRun} />
              <ActionButton busy={busy === "render"} icon={<Play size={18} />} label="渲染" onClick={renderRun} disabled={!selected.manifest} />
              <ActionButton busy={busy === "package"} icon={<FileText size={18} />} label="发布包" onClick={exportPackage} disabled={!selected.script} />
              <ActionButton busy={busy === "publish"} icon={<Send size={18} />} label="抖音确认" onClick={publishDouyin} disabled={!selected.publishPackage} />
            </div>

            <div className="content-grid">
              <section className="main-column">
                <Panel title="脚本审核" icon={<FileText size={18} />}>
                  {selected.script ? (
                    <>
                      <h2>{selected.script.title}</h2>
                      <p className="hook">{selected.script.hook}</p>
                      <div className="sections">
                        {selected.script.sections.map((section) => (
                          <article key={section.id} className="script-section">
                            <h3>{section.title}</h3>
                            <p>{section.narration}</p>
                          </article>
                        ))}
                      </div>
                    </>
                  ) : (
                    <Empty text="等待生成脚本" />
                  )}
                </Panel>

                <Panel title="分镜与字幕" icon={<Mic2 size={18} />}>
                  {selected.storyboard ? (
                    <div className="scene-table">
                      {selected.storyboard.map((scene) => (
                        <div className="scene-row" key={scene.id}>
                          <span style={{ color: scene.accent }}>{Math.round(scene.startSeconds)}s</span>
                          <strong>{scene.headline}</strong>
                          <small>{scene.bullets.join(" / ")}</small>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Empty text="等待生成分镜" />
                  )}
                </Panel>
              </section>

              <aside className="inspector">
                <Panel title="来源清单" icon={<ShieldCheck size={18} />}>
                  {selected.research ? (
                    <div className="sources">
                      {selected.research.sources.map((source) => (
                        <a key={source.url} href={source.url} target="_blank" rel="noreferrer">
                          <strong>{source.publisher}</strong>
                          <span>{source.title}</span>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <Empty text="等待资料清单" />
                  )}
                </Panel>

                <Panel title="成片预览" icon={<Clapperboard size={18} />}>
                  {selected.stage === "rendered" || selected.stage === "packaged" || selected.stage === "published" ? (
                    <>
                      <video className="preview" src={`/media/${selected.id}/output/video.mp4`} controls />
                      {narration ? (
                        <div className={`audio-note ${narrationIsFallback ? "warning" : ""}`}>
                          配音：{narration.provider}
                          {narrationIsFallback ? "（兜底音频，建议正式发布前换云端 TTS）" : ""}
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <div className="preview-placeholder">1080 × 1920</div>
                  )}
                </Panel>

                <Panel title="发布状态" icon={<CheckCircle2 size={18} />}>
                  <div className="status-lines">
                    <span>{message}</span>
                    <span>当前阶段：{stageLabels[selected.stage]}</span>
                    <span>{selected.publishPackage ? "发布包已准备" : "发布包未生成"}</span>
                    <span>{selected.publishResult?.message ?? "尚未提交平台"}</span>
                  </div>
                </Panel>
              </aside>
            </div>
          </motion.section>
        ) : (
          <div className="empty-state">输入选题并创建任务</div>
        )}
      </main>
    </div>
  );
};

const StageRail = ({ stage }: { stage: RunStage }) => {
  const stages = Object.keys(stageLabels) as RunStage[];
  const activeIndex = stages.indexOf(stage);
  return (
    <div className="stage-rail">
      {stages.map((item, index) => (
        <div className={`stage-dot ${index <= activeIndex ? "done" : ""}`} key={item}>
          <span>{stageLabels[item]}</span>
        </div>
      ))}
    </div>
  );
};

const Panel = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
  <section className="panel">
    <div className="panel-title">
      {icon}
      <span>{title}</span>
    </div>
    {children}
  </section>
);

const Empty = ({ text }: { text: string }) => <div className="muted-empty">{text}</div>;

const ActionButton = ({
  busy,
  icon,
  label,
  onClick,
  disabled
}: {
  busy?: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) => (
  <button className="action-button" onClick={onClick} disabled={disabled || busy}>
    {busy ? <Loader2 className="spin" size={18} /> : icon}
    {label}
  </button>
);

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API}${url}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    }
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || response.statusText);
  }
  return response.json() as Promise<T>;
}
