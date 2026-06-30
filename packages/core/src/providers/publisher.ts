import fs from "node:fs/promises";
import { nowIso, type PublishPackage, type PublishResult } from "../schema";

export interface PublisherProvider {
  name: string;
  isConfigured(): boolean;
  publish(pkg: PublishPackage, options: { confirm: boolean }): Promise<PublishResult>;
}

export class ManualPublisher implements PublisherProvider {
  name = "manual-package";

  isConfigured() {
    return true;
  }

  async publish(pkg: PublishPackage): Promise<PublishResult> {
    return {
      provider: this.name,
      status: "skipped",
      message: `已生成手动发布包：${pkg.captionPath}`,
      createdAt: nowIso()
    };
  }
}

export class DouyinPublisher implements PublisherProvider {
  name = "douyin-openapi";

  constructor(
    private readonly options: {
      accessToken?: string;
      openId?: string;
    } = {}
  ) {}

  isConfigured() {
    return Boolean(this.options.accessToken ?? process.env.DOUYIN_ACCESS_TOKEN) && Boolean(this.options.openId ?? process.env.DOUYIN_OPEN_ID);
  }

  async publish(pkg: PublishPackage, options: { confirm: boolean }): Promise<PublishResult> {
    if (!options.confirm) {
      throw new Error("Douyin publish requires explicit human confirmation.");
    }
    if (!this.isConfigured()) {
      return {
        provider: this.name,
        status: "skipped",
        message: "抖音凭据未配置，已保留手动发布包。",
        createdAt: nowIso()
      };
    }
    if (!pkg.videoPath) {
      throw new Error("Cannot publish to Douyin before a rendered MP4 exists.");
    }

    const accessToken = this.options.accessToken ?? process.env.DOUYIN_ACCESS_TOKEN ?? "";
    const openId = this.options.openId ?? process.env.DOUYIN_OPEN_ID ?? "";
    const uploadUrl = new URL("https://open.douyin.com/video/upload/");
    uploadUrl.searchParams.set("open_id", openId);

    const videoBuffer = await fs.readFile(pkg.videoPath);
    const form = new FormData();
    form.set("video", new Blob([videoBuffer], { type: "video/mp4" }), "video.mp4");

    const uploadResponse = await fetch(uploadUrl, {
      method: "POST",
      headers: { "access-token": accessToken },
      body: form
    });
    const uploadJson = (await uploadResponse.json()) as Record<string, unknown>;
    if (!uploadResponse.ok) {
      return failed(`上传视频失败：${JSON.stringify(uploadJson)}`);
    }

    const videoId =
      readNested(uploadJson, ["data", "video", "video_id"]) ??
      readNested(uploadJson, ["data", "video_id"]) ??
      readNested(uploadJson, ["video_id"]);
    if (!videoId) return failed(`上传响应缺少 video_id：${JSON.stringify(uploadJson)}`);

    const createUrl = new URL("https://open.douyin.com/video/create/");
    createUrl.searchParams.set("open_id", openId);
    const createResponse = await fetch(createUrl, {
      method: "POST",
      headers: {
        "access-token": accessToken,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        video_id: videoId,
        text: [pkg.description, ...pkg.hashtags].join("\n")
      })
    });
    const createJson = (await createResponse.json()) as Record<string, unknown>;
    if (!createResponse.ok) {
      return failed(`创建抖音视频失败：${JSON.stringify(createJson)}`, String(videoId));
    }

    return {
      provider: this.name,
      status: "submitted",
      message: "已提交抖音开放平台，后续状态以平台审核结果为准。",
      remoteVideoId: String(videoId),
      createdAt: nowIso()
    };
  }
}

export function createPublisherFromEnv(): PublisherProvider {
  return new DouyinPublisher({
    accessToken: process.env.DOUYIN_ACCESS_TOKEN,
    openId: process.env.DOUYIN_OPEN_ID
  });
}

function failed(message: string, remoteVideoId?: string): PublishResult {
  return {
    provider: "douyin-openapi",
    status: "failed",
    message,
    remoteVideoId,
    createdAt: nowIso()
  };
}

function readNested(obj: Record<string, unknown>, path: string[]): unknown {
  let value: unknown = obj;
  for (const key of path) {
    if (!value || typeof value !== "object" || !(key in value)) return undefined;
    value = (value as Record<string, unknown>)[key];
  }
  return value;
}
