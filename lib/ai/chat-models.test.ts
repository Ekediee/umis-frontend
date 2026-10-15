import { describe, expect, it } from "vitest";
import { chatModels, parseChatModel } from "./chat-models";

const BOTH = { GOOGLE_GENERATIVE_AI_API_KEY: "g", NVIDIA_API_KEY: "n" };

describe("parseChatModel", () => {
  it("treats a bare id as Google", () => {
    expect(parseChatModel("gemini-3.5-flash-lite")).toEqual({ provider: "google", id: "gemini-3.5-flash-lite", label: "google:gemini-3.5-flash-lite" });
  });

  it("keeps the slash in NVIDIA ids", () => {
    expect(parseChatModel("nvidia:meta/llama-3.2-90b-vision-instruct")?.id).toBe("meta/llama-3.2-90b-vision-instruct");
  });

  it("rejects empty values", () => {
    expect(parseChatModel("  ")).toBeNull();
    expect(parseChatModel("nvidia:")).toBeNull();
  });
});

describe("chatModels", () => {
  it("defaults to Gemini first, NVIDIA as the backup", () => {
    expect(chatModels(BOTH).map((m) => m.provider)).toEqual(["google", "nvidia"]);
  });

  it("skips a provider with no key", () => {
    expect(chatModels({ GOOGLE_GENERATIVE_AI_API_KEY: "g" }).map((m) => m.provider)).toEqual(["google"]);
    expect(chatModels({ NVIDIA_API_KEY: "n" }).map((m) => m.provider)).toEqual(["nvidia"]);
    expect(chatModels({})).toEqual([]);
  });

  it("lets NVIDIA go first", () => {
    const env = { ...BOTH, AI_CHAT_MODEL: "nvidia:nvidia/nemotron-3-super-120b-a12b", AI_CHAT_FALLBACK_MODEL: "gemini-3.5-flash-lite" };
    expect(chatModels(env).map((m) => m.label)).toEqual(["nvidia:nvidia/nemotron-3-super-120b-a12b", "google:gemini-3.5-flash-lite"]);
  });

  it("an empty fallback turns the backup off, and duplicates collapse", () => {
    expect(chatModels({ ...BOTH, AI_CHAT_FALLBACK_MODEL: "" })).toHaveLength(1);
    expect(chatModels({ ...BOTH, AI_CHAT_FALLBACK_MODEL: "google:gemini-3.5-flash-lite" })).toHaveLength(1);
  });
});
