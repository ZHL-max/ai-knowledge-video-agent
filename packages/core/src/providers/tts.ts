import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { ttsSave } from "edge-tts";
import type { NarrationAsset } from "../schema";

const execFileAsync = promisify(execFile);

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
    } catch {
      const fallbackPath = path.join(input.outputDir, "narration-fallback.wav");
      const durationSeconds = estimateChineseSpeechSeconds(input.text);
      const sapiVoice = await tryWindowsSapiTTS(input.text, fallbackPath, this.options.voice);
      if (sapiVoice) {
        const actualDurationSeconds = (await readWavDurationSeconds(fallbackPath)) ?? durationSeconds;
        return {
          provider: `${this.name}:windows-sapi-fallback`,
          voice: sapiVoice,
          text: input.text,
          audioPath: fallbackPath,
          durationSeconds: actualDurationSeconds
        };
      }

      await fs.writeFile(fallbackPath, makeToneWav(durationSeconds));
      return {
        provider: `${this.name}:audible-tone-fallback`,
        voice: "tone-fallback-after-tts-error",
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
    await fs.writeFile(audioPath, makeToneWav(durationSeconds));
    return {
      provider: this.name,
      voice: "audible-test-tone",
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

async function tryWindowsSapiTTS(text: string, outputPath: string, preferredVoice?: string) {
  if (process.platform !== "win32") return undefined;
  const textPath = path.join(path.dirname(outputPath), "narration-input.txt");
  await fs.writeFile(textPath, text, "utf8");
  const voice = process.env.WINDOWS_TTS_VOICE ?? preferredVoice ?? "";
  const script = [
    "Add-Type -AssemblyName System.Speech",
    "$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer",
    `$preferred = ${powerShellString(voice)}`,
    "$selected = $false",
    "if ($preferred) { try { $synth.SelectVoice($preferred); $selected = $true } catch {} }",
    "if (-not $selected) {",
    "  $zhVoice = $synth.GetInstalledVoices() | ForEach-Object { $_.VoiceInfo } | Where-Object { $_.Culture.Name -like 'zh-*' } | Select-Object -First 1",
    "  if ($zhVoice) { $synth.SelectVoice($zhVoice.Name) }",
    "}",
    "$synth.Rate = 0",
    "$synth.Volume = 100",
    `$text = Get-Content -LiteralPath ${powerShellString(textPath)} -Raw -Encoding UTF8`,
    `$synth.SetOutputToWaveFile(${powerShellString(outputPath)})`,
    "$synth.Speak($text) | Out-Null",
    "$selectedVoice = $synth.Voice.Name",
    "$synth.Dispose()",
    "Write-Output $selectedVoice"
  ].join("; ");

  try {
    const { stdout } = await execFileAsync(
      "powershell.exe",
      ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", script],
      { timeout: 180_000, windowsHide: true, maxBuffer: 1024 * 1024 }
    );
    return stdout.trim() || "windows-sapi";
  } catch {
    return undefined;
  }
}

function powerShellString(value: string) {
  return `'${value.replace(/'/g, "''")}'`;
}

async function readWavDurationSeconds(filePath: string) {
  const buffer = await fs.readFile(filePath);
  if (buffer.length < 44 || buffer.toString("ascii", 0, 4) !== "RIFF" || buffer.toString("ascii", 8, 12) !== "WAVE") {
    return undefined;
  }
  const byteRate = buffer.readUInt32LE(28);
  if (byteRate <= 0) return undefined;

  let offset = 12;
  while (offset + 8 <= buffer.length) {
    const chunkId = buffer.toString("ascii", offset, offset + 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);
    if (chunkId === "data") {
      return Math.ceil((chunkSize / byteRate) * 100) / 100;
    }
    offset += 8 + chunkSize + (chunkSize % 2);
  }
  return undefined;
}

function makeToneWav(durationSeconds: number) {
  const sampleRate = 24000;
  const channels = 1;
  const bytesPerSample = 2;
  const totalSamples = Math.max(1, Math.round(durationSeconds * sampleRate));
  const dataSize = totalSamples * channels * bytesPerSample;
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
  for (let sample = 0; sample < totalSamples; sample++) {
    const secondProgress = (sample % sampleRate) / sampleRate;
    const active = secondProgress < 0.18;
    const amplitude = active ? Math.sin((sample / sampleRate) * Math.PI * 2 * 660) * 6000 : 0;
    buffer.writeInt16LE(Math.round(amplitude), 44 + sample * bytesPerSample);
  }
  return buffer;
}
