import fs from "node:fs/promises";
import path from "node:path";
import { ttsSave } from "edge-tts";
import type { NarrationAsset } from "../schema";

export interface TTSProvider {
  name: string;
  synthesize(input: {
    runId: string;
    text: string;
    outputDir: string;
  }): Promise<NarrationAsset>;
}

export class EdgeTTSProvider implements TTSProvider {
  name = "edge-tts";

  constructor(
    private readonly options: {
      voice?: string;
      rate?: string;
      pitch?: string;
    } = {}
  ) {}

  async synthesize(input: { runId: string; text: string; outputDir: string }): Promise<NarrationAsset> {
    await fs.mkdir(input.outputDir, { recursive: true });
    const audioPath = path.join(input.outputDir, "narration.mp3");
    const voice = this.options.voice ?? process.env.TTS_VOICE ?? "zh-CN-XiaoxiaoNeural";
    try {
      await ttsSave(input.text, audioPath, {
        voice,
        rate: this.options.rate ?? process.env.TTS_RATE ?? "-4%",
        pitch: this.options.pitch
      });
    } catch (error) {
      const fallbackPath = path.join(input.outputDir, "narration-fallback.wav");
      const durationSeconds = estimateChineseSpeechSeconds(input.text);
      await fs.writeFile(fallbackPath, makeSilentWav(durationSeconds));
      return {
        provider: `${this.name}:fallback`,
        voice: "silent-fallback-after-edge-tts-error",
        text: input.text,
        audioPath: fallbackPath,
        durationSeconds
      };
    }

    return {
      provider: this.name,
      voice,
      text: input.text,
      audioPath,
      durationSeconds: estimateChineseSpeechSeconds(input.text)
    };
  }
}

export class OpenAITTSProvider implements TTSProvider {
  name = "openai-tts";

  constructor(
    private readonly options: {
      apiKey: string;
      model?: string;
      voice?: string;
    }
  ) {}

  async synthesize(input: { runId: string; text: string; outputDir: string }): Promise<NarrationAsset> {
    await fs.mkdir(input.outputDir, { recursive: true });
    const audioPath = path.join(input.outputDir, "narration.mp3");
    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.options.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: this.options.model ?? "gpt-4o-mini-tts",
        voice: this.options.voice ?? "alloy",
        input: input.text,
        format: "mp3"
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI TTS request failed: ${response.status} ${await response.text()}`);
    }

    const audio = Buffer.from(await response.arrayBuffer());
    await fs.writeFile(audioPath, audio);

    return {
      provider: this.name,
      voice: this.options.voice ?? "alloy",
      text: input.text,
      audioPath,
      durationSeconds: estimateChineseSpeechSeconds(input.text)
    };
  }
}

export class MockTTSProvider implements TTSProvider {
  name = "mock-tts";

  async synthesize(input: { runId: string; text: string; outputDir: string }): Promise<NarrationAsset> {
    await fs.mkdir(input.outputDir, { recursive: true });
    const durationSeconds = Math.max(8, Math.min(30, Math.ceil(estimateChineseSpeechSeconds(input.text) / 8)));
    const audioPath = path.join(input.outputDir, "narration.wav");
    await fs.writeFile(audioPath, makeSilentWav(durationSeconds));
    return {
      provider: this.name,
      voice: "silent-test-voice",
      text: input.text,
      audioPath,
      durationSeconds
    };
  }
}

export function createTTSProviderFromEnv(): TTSProvider {
  const provider = process.env.TTS_PROVIDER ?? "edge";
  if (provider === "openai") {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is required when TTS_PROVIDER=openai.");
    }
    return new OpenAITTSProvider({
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_TTS_MODEL,
      voice: process.env.OPENAI_TTS_VOICE
    });
  }
  if (provider === "mock") return new MockTTSProvider();
  return new EdgeTTSProvider({
    voice: process.env.TTS_VOICE,
    rate: process.env.TTS_RATE
  });
}

export function estimateChineseSpeechSeconds(text: string) {
  const compact = text.replace(/\s+/g, "");
  const punctuationPauses = (text.match(/[，。！？；：]/g) ?? []).length * 0.18;
  return Math.ceil(compact.length / 5.6 + punctuationPauses);
}

function makeSilentWav(durationSeconds: number) {
  const sampleRate = 24000;
  const channels = 1;
  const bytesPerSample = 2;
  const dataSize = durationSeconds * sampleRate * channels * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(channels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * channels * bytesPerSample, 28);
  buffer.writeUInt16LE(channels * bytesPerSample, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);
  return buffer;
}
