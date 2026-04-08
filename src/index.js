/**
 * @module index
 * @description TDN System Bots entry point.
 * Initializes all technology bots (news + update watchers).
 * Each bot runs independently; a failure in one does not affect the others.
 */

import "dotenv/config";
import { log } from "./logger.js";

/* ── TypeScript ─────────────────────────────────────────── */
import { startTypeScriptNewsBot } from "./bots/typescript/news.js";
import { startTypeScriptUpdatesBot } from "./bots/typescript/update.js";

/* ── React (update only — no RSS feed) ─────────────────── */
import { startReactUpdatesBot } from "./bots/react/update.js";

/* ── Next.js (update only — no RSS feed) ───────────────── */
import { startNextJSUpdatesBot } from "./bots/nextjs/update.js";

/* ── Vue.js ─────────────────────────────────────────────── */
import { startVueNewsBot } from "./bots/vue/news.js";
import { startVueUpdatesBot } from "./bots/vue/update.js";

/* ── Angular ────────────────────────────────────────────── */
import { startAngularNewsBot } from "./bots/angular/news.js";
import { startAngularUpdatesBot } from "./bots/angular/update.js";

/* ── Node.js ────────────────────────────────────────────── */
import { startNodeJSNewsBot } from "./bots/nodejs/news.js";
import { startNodeJSUpdatesBot } from "./bots/nodejs/update.js";

/* ── Python ─────────────────────────────────────────────── */
import { startPythonNewsBot } from "./bots/python/news.js";
import { startPythonUpdatesBot } from "./bots/python/update.js";

/* ── Rust ───────────────────────────────────────────────── */
import { startRustNewsBot } from "./bots/rust/news.js";
import { startRustUpdatesBot } from "./bots/rust/update.js";

/* ── Go ─────────────────────────────────────────────────── */
import { startGoNewsBot } from "./bots/go/news.js";
import { startGoUpdatesBot } from "./bots/go/update.js";

/* ── Deno (update only — no RSS feed) ──────────────────── */
import { startDenoUpdatesBot } from "./bots/deno/update.js";

/* ── Bun (update only — no RSS feed) ───────────────────── */
import { startBunUpdatesBot } from "./bots/bun/update.js";

/* ── Svelte ─────────────────────────────────────────────── */
import { startSvelteNewsBot } from "./bots/svelte/news.js";
import { startSvelteUpdatesBot } from "./bots/svelte/update.js";

/* ── Tailwind CSS ───────────────────────────────────────── */
import { startTailwindNewsBot } from "./bots/tailwindcss/news.js";
import { startTailwindUpdatesBot } from "./bots/tailwindcss/update.js";

/* ── Java ───────────────────────────────────────────────── */
import { startJavaNewsBot } from "./bots/java/news.js";
import { startJavaUpdatesBot } from "./bots/java/update.js";

/* ── Kotlin ─────────────────────────────────────────────── */
import { startKotlinNewsBot } from "./bots/kotlin/news.js";
import { startKotlinUpdatesBot } from "./bots/kotlin/update.js";

/* ── Swift ──────────────────────────────────────────────── */
import { startSwiftNewsBot } from "./bots/swift/news.js";
import { startSwiftUpdatesBot } from "./bots/swift/update.js";

/* ── PHP ────────────────────────────────────────────────── */
import { startPHPNewsBot } from "./bots/php/news.js";
import { startPHPUpdatesBot } from "./bots/php/update.js";

/* ── Ruby ───────────────────────────────────────────────── */
import { startRubyNewsBot } from "./bots/ruby/news.js";
import { startRubyUpdatesBot } from "./bots/ruby/update.js";

/* ── .NET ───────────────────────────────────────────────── */
import { startDotNetNewsBot } from "./bots/dotnet/news.js";
import { startDotNetUpdatesBot } from "./bots/dotnet/update.js";

/* ── Elixir ─────────────────────────────────────────────── */
import { startElixirNewsBot } from "./bots/elixir/news.js";
import { startElixirUpdatesBot } from "./bots/elixir/update.js";

/* ── Zig (update only) ─────────────────────────────────── */
import { startZigUpdatesBot } from "./bots/zig/update.js";

/* ── Nuxt ───────────────────────────────────────────────── */
import { startNuxtNewsBot } from "./bots/nuxt/news.js";
import { startNuxtUpdatesBot } from "./bots/nuxt/update.js";

/* ── Astro ──────────────────────────────────────────────── */
import { startAstroNewsBot } from "./bots/astro/news.js";
import { startAstroUpdatesBot } from "./bots/astro/update.js";

/* ── Laravel ────────────────────────────────────────────── */
import { startLaravelNewsBot } from "./bots/laravel/news.js";
import { startLaravelUpdatesBot } from "./bots/laravel/update.js";

/* ── Remix (update only) ───────────────────────────────── */
import { startRemixUpdatesBot } from "./bots/remix/update.js";

/* ── Express (update only) ─────────────────────────────── */
import { startExpressUpdatesBot } from "./bots/express/update.js";

/* ── Fastify (update only) ─────────────────────────────── */
import { startFastifyUpdatesBot } from "./bots/fastify/update.js";

/* ── NestJS (update only) ──────────────────────────────── */
import { startNestJSUpdatesBot } from "./bots/nestjs/update.js";

/* ── Hono (update only) ────────────────────────────────── */
import { startHonoUpdatesBot } from "./bots/hono/update.js";

/* ── Django (update only) ──────────────────────────────── */
import { startDjangoUpdatesBot } from "./bots/django/update.js";

/* ── FastAPI (update only) ─────────────────────────────── */
import { startFastAPIUpdatesBot } from "./bots/fastapi/update.js";

/* ── Spring Boot (update only) ─────────────────────────── */
import { startSpringBootUpdatesBot } from "./bots/springboot/update.js";

/* ── Rails (update only) ───────────────────────────────── */
import { startRailsUpdatesBot } from "./bots/rails/update.js";

/* ── Vite (update only) ────────────────────────────────── */
import { startViteUpdatesBot } from "./bots/vite/update.js";

/* ── esbuild (update only) ─────────────────────────────── */
import { startEsbuildUpdatesBot } from "./bots/esbuild/update.js";

/* ── SWC (update only) ─────────────────────────────────── */
import { startSWCUpdatesBot } from "./bots/swc/update.js";

/* ── Biome (update only) ───────────────────────────────── */
import { startBiomeUpdatesBot } from "./bots/biome/update.js";

/* ── ESLint (update only) ──────────────────────────────── */
import { startESLintUpdatesBot } from "./bots/eslint/update.js";

/* ── Prettier (update only) ────────────────────────────── */
import { startPrettierUpdatesBot } from "./bots/prettier/update.js";

/* ── pnpm (update only) ────────────────────────────────── */
import { startPnpmUpdatesBot } from "./bots/pnpm/update.js";

/* ── Vitest (update only) ──────────────────────────────── */
import { startVitestUpdatesBot } from "./bots/vitest/update.js";

/* ── Playwright (update only) ──────────────────────────── */
import { startPlaywrightUpdatesBot } from "./bots/playwright/update.js";

/* ── Webpack (update only) ─────────────────────────────── */
import { startWebpackUpdatesBot } from "./bots/webpack/update.js";

/* ── Docker ─────────────────────────────────────────────── */
import { startDockerNewsBot } from "./bots/docker/news.js";
import { startDockerUpdatesBot } from "./bots/docker/update.js";

/* ── Kubernetes ─────────────────────────────────────────── */
import { startKubernetesNewsBot } from "./bots/kubernetes/news.js";
import { startKubernetesUpdatesBot } from "./bots/kubernetes/update.js";

/* ── Supabase ───────────────────────────────────────────── */
import { startSupabaseNewsBot } from "./bots/supabase/news.js";
import { startSupabaseUpdatesBot } from "./bots/supabase/update.js";

/* ── Terraform (update only) ───────────────────────────── */
import { startTerraformUpdatesBot } from "./bots/terraform/update.js";

/* ── Grafana (update only) ─────────────────────────────── */
import { startGrafanaUpdatesBot } from "./bots/grafana/update.js";

/* ── Prometheus (update only) ──────────────────────────── */
import { startPrometheusUpdatesBot } from "./bots/prometheus/update.js";

/* ── Redis (update only) ───────────────────────────────── */
import { startRedisUpdatesBot } from "./bots/redis/update.js";

/* ── Prisma (update only) ──────────────────────────────── */
import { startPrismaUpdatesBot } from "./bots/prisma/update.js";

/* ── Drizzle (update only) ─────────────────────────────── */
import { startDrizzleUpdatesBot } from "./bots/drizzle/update.js";

/* ── MongoDB (update only) ─────────────────────────────── */
import { startMongoDBUpdatesBot } from "./bots/mongodb/update.js";

/* ── Flutter ────────────────────────────────────────────── */
import { startFlutterNewsBot } from "./bots/flutter/news.js";
import { startFlutterUpdatesBot } from "./bots/flutter/update.js";

/* ── React Native (update only) ────────────────────────── */
import { startReactNativeUpdatesBot } from "./bots/reactnative/update.js";

/* ── Electron (update only) ────────────────────────────── */
import { startElectronUpdatesBot } from "./bots/electron/update.js";

/* ── Tauri (update only) ───────────────────────────────── */
import { startTauriUpdatesBot } from "./bots/tauri/update.js";

/* ── PyTorch (update only) ─────────────────────────────── */
import { startPyTorchUpdatesBot } from "./bots/pytorch/update.js";

/* ── TensorFlow (update only) ──────────────────────────── */
import { startTensorFlowUpdatesBot } from "./bots/tensorflow/update.js";

/* ── Ollama (update only) ──────────────────────────────── */
import { startOllamaUpdatesBot } from "./bots/ollama/update.js";

/* ── LangChain (update only) ───────────────────────────── */
import { startLangChainUpdatesBot } from "./bots/langchain/update.js";

/* ── GitHub (news only) ────────────────────────────────── */
import { startGitHubNewsBot } from "./bots/github/news.js";

/* ── Cloudflare (news only) ────────────────────────────── */
import { startCloudflareNewsBot } from "./bots/cloudflare/news.js";

/* ── Vercel (news only) ────────────────────────────────── */
import { startVercelNewsBot } from "./bots/vercel/news.js";

/* ── AWS (news only) ───────────────────────────────────── */
import { startAWSNewsBot } from "./bots/aws/news.js";

/* ── Google (news only) ────────────────────────────────── */
import { startGoogleNewsBot } from "./bots/google/news.js";

/* ── OpenAI (news only) ────────────────────────────────── */
import { startOpenAINewsBot } from "./bots/openai/news.js";

/* ── Meta (news only) ──────────────────────────────────── */
import { startMetaNewsBot } from "./bots/meta/news.js";

/* ── Netflix (news only) ───────────────────────────────── */
import { startNetflixNewsBot } from "./bots/netflix/news.js";

/* ── SolidJS (update only) ─────────────────────────────── */
import { startSolidJSUpdatesBot } from "./bots/solidjs/update.js";

/* ── htmx (update only) ────────────────────────────────── */
import { startHtmxUpdatesBot } from "./bots/htmx/update.js";

/* ── Alpine.js (update only) ───────────────────────────── */
import { startAlpineJSUpdatesBot } from "./bots/alpinejs/update.js";

/* ── tRPC (update only) ────────────────────────────────── */
import { startTRPCUpdatesBot } from "./bots/trpc/update.js";

/* ── Bootstrap (update only) ───────────────────────────── */
import { startBootstrapUpdatesBot } from "./bots/bootstrap/update.js";

/* ── Three.js (update only) ────────────────────────────── */
import { startThreeJSUpdatesBot } from "./bots/threejs/update.js";

/* ── Godot Engine ───────────────────────────────────────── */
import { startGodotNewsBot } from "./bots/godot/news.js";
import { startGodotUpdatesBot } from "./bots/godot/update.js";

/* ── Phaser (update only — no RSS feed) ────────────────── */
import { startPhaserUpdatesBot } from "./bots/phaser/update.js";

/* ── Unity (news only — no public GitHub repo) ─────────── */
import { startUnityNewsBot } from "./bots/unity/news.js";

/* ── Bevy Engine ────────────────────────────────────────── */
import { startBevyNewsBot } from "./bots/bevy/news.js";
import { startBevyUpdatesBot } from "./bots/bevy/update.js";

/* ── Unreal Engine (news only — private GitHub repo) ────── */
import { startUnrealEngineNewsBot } from "./bots/unrealengine/news.js";

/* ── AI / LLM ──────────────────────────────────────────── */
import { startHuggingFaceNewsBot } from "./bots/huggingface/news.js";
import { startHuggingFaceUpdatesBot } from "./bots/huggingface/update.js";
import { startGeminiNewsBot } from "./bots/gemini/news.js";
import { startGeminiUpdatesBot } from "./bots/gemini/update.js";
import { startCohereNewsBot } from "./bots/cohere/news.js";
import { startCohereUpdatesBot } from "./bots/cohere/update.js";
import { startGroqNewsBot } from "./bots/groq/news.js";
import { startGroqUpdatesBot } from "./bots/groq/update.js";
import { startAutoGenNewsBot } from "./bots/autogen/news.js";
import { startAutoGenUpdatesBot } from "./bots/autogen/update.js";
import { startSemanticKernelNewsBot } from "./bots/semantickernel/news.js";
import { startSemanticKernelUpdatesBot } from "./bots/semantickernel/update.js";
import { startN8NNewsBot } from "./bots/n8n/news.js";
import { startN8NUpdatesBot } from "./bots/n8n/update.js";
import { startStabilityUpdatesBot } from "./bots/stability/update.js";
import { startHaystackNewsBot } from "./bots/haystack/news.js";
import { startHaystackUpdatesBot } from "./bots/haystack/update.js";
import { startMLflowNewsBot } from "./bots/mlflow/news.js";
import { startMLflowUpdatesBot } from "./bots/mlflow/update.js";
import { startAnthropicUpdatesBot } from "./bots/anthropic/update.js";
import { startClaudeCodeUpdatesBot } from "./bots/claudecode/update.js";
import { startMistralUpdatesBot } from "./bots/mistral/update.js";
import { startLlamaIndexUpdatesBot } from "./bots/llamaindex/update.js";
import { startCrewAIUpdatesBot } from "./bots/crewai/update.js";
import { startVLLMUpdatesBot } from "./bots/vllm/update.js";
import { startDifyUpdatesBot } from "./bots/dify/update.js";
import { startLiteLLMUpdatesBot } from "./bots/litellm/update.js";
import { startComfyUIUpdatesBot } from "./bots/comfyui/update.js";
import { startDeepSeekUpdatesBot } from "./bots/deepseek/update.js";
import { startFlowiseUpdatesBot } from "./bots/flowise/update.js";
import { startXAIUpdatesBot } from "./bots/xai/update.js";
import { startCursorNewsBot } from "./bots/cursor/news.js";

/**
 * Bot registry. Each entry contains a display name and its start function.
 * @type {{ name: string, start: Function }[]}
 */
const bots = [
    /* ── Existing: Languages ─────────────────────────────── */
    { name: "TypeScript News", start: startTypeScriptNewsBot },
    { name: "TypeScript Updates", start: startTypeScriptUpdatesBot },
    { name: "Python News", start: startPythonNewsBot },
    { name: "Python Updates", start: startPythonUpdatesBot },
    { name: "Rust News", start: startRustNewsBot },
    { name: "Rust Updates", start: startRustUpdatesBot },
    { name: "Go News", start: startGoNewsBot },
    { name: "Go Updates", start: startGoUpdatesBot },

    /* ── New: Languages ──────────────────────────────────── */
    { name: "Java News", start: startJavaNewsBot },
    { name: "Java Updates", start: startJavaUpdatesBot },
    { name: "Kotlin News", start: startKotlinNewsBot },
    { name: "Kotlin Updates", start: startKotlinUpdatesBot },
    { name: "Swift News", start: startSwiftNewsBot },
    { name: "Swift Updates", start: startSwiftUpdatesBot },
    { name: "PHP News", start: startPHPNewsBot },
    { name: "PHP Updates", start: startPHPUpdatesBot },
    { name: "Ruby News", start: startRubyNewsBot },
    { name: "Ruby Updates", start: startRubyUpdatesBot },
    { name: ".NET News", start: startDotNetNewsBot },
    { name: ".NET Updates", start: startDotNetUpdatesBot },
    { name: "Elixir News", start: startElixirNewsBot },
    { name: "Elixir Updates", start: startElixirUpdatesBot },
    { name: "Zig Updates", start: startZigUpdatesBot },

    /* ── Existing: Runtimes ──────────────────────────────── */
    { name: "Node.js News", start: startNodeJSNewsBot },
    { name: "Node.js Updates", start: startNodeJSUpdatesBot },
    { name: "Deno Updates", start: startDenoUpdatesBot },
    { name: "Bun Updates", start: startBunUpdatesBot },

    /* ── Existing: Frontend Frameworks ───────────────────── */
    { name: "React Updates", start: startReactUpdatesBot },
    { name: "Next.js Updates", start: startNextJSUpdatesBot },
    { name: "Vue.js News", start: startVueNewsBot },
    { name: "Vue.js Updates", start: startVueUpdatesBot },
    { name: "Angular News", start: startAngularNewsBot },
    { name: "Angular Updates", start: startAngularUpdatesBot },
    { name: "Svelte News", start: startSvelteNewsBot },
    { name: "Svelte Updates", start: startSvelteUpdatesBot },
    { name: "Tailwind CSS News", start: startTailwindNewsBot },
    { name: "Tailwind CSS Updates", start: startTailwindUpdatesBot },

    /* ── New: Frameworks ─────────────────────────────────── */
    { name: "Nuxt News", start: startNuxtNewsBot },
    { name: "Nuxt Updates", start: startNuxtUpdatesBot },
    { name: "Astro News", start: startAstroNewsBot },
    { name: "Astro Updates", start: startAstroUpdatesBot },
    { name: "Laravel News", start: startLaravelNewsBot },
    { name: "Laravel Updates", start: startLaravelUpdatesBot },
    { name: "Remix Updates", start: startRemixUpdatesBot },
    { name: "Express Updates", start: startExpressUpdatesBot },
    { name: "Fastify Updates", start: startFastifyUpdatesBot },
    { name: "NestJS Updates", start: startNestJSUpdatesBot },
    { name: "Hono Updates", start: startHonoUpdatesBot },
    { name: "Django Updates", start: startDjangoUpdatesBot },
    { name: "FastAPI Updates", start: startFastAPIUpdatesBot },
    { name: "Spring Boot Updates", start: startSpringBootUpdatesBot },
    { name: "Rails Updates", start: startRailsUpdatesBot },

    /* ── New: Build Tools & DX ───────────────────────────── */
    { name: "Vite Updates", start: startViteUpdatesBot },
    { name: "esbuild Updates", start: startEsbuildUpdatesBot },
    { name: "SWC Updates", start: startSWCUpdatesBot },
    { name: "Biome Updates", start: startBiomeUpdatesBot },
    { name: "ESLint Updates", start: startESLintUpdatesBot },
    { name: "Prettier Updates", start: startPrettierUpdatesBot },
    { name: "pnpm Updates", start: startPnpmUpdatesBot },
    { name: "Vitest Updates", start: startVitestUpdatesBot },
    { name: "Playwright Updates", start: startPlaywrightUpdatesBot },
    { name: "Webpack Updates", start: startWebpackUpdatesBot },

    /* ── New: Infrastructure ─────────────────────────────── */
    { name: "Docker News", start: startDockerNewsBot },
    { name: "Docker Updates", start: startDockerUpdatesBot },
    { name: "Kubernetes News", start: startKubernetesNewsBot },
    { name: "Kubernetes Updates", start: startKubernetesUpdatesBot },
    { name: "Supabase News", start: startSupabaseNewsBot },
    { name: "Supabase Updates", start: startSupabaseUpdatesBot },
    { name: "Terraform Updates", start: startTerraformUpdatesBot },
    { name: "Grafana Updates", start: startGrafanaUpdatesBot },
    { name: "Prometheus Updates", start: startPrometheusUpdatesBot },
    { name: "Redis Updates", start: startRedisUpdatesBot },
    { name: "Prisma Updates", start: startPrismaUpdatesBot },
    { name: "Drizzle Updates", start: startDrizzleUpdatesBot },
    { name: "MongoDB Updates", start: startMongoDBUpdatesBot },

    /* ── New: Mobile / Desktop / AI ──────────────────────── */
    { name: "Flutter News", start: startFlutterNewsBot },
    { name: "Flutter Updates", start: startFlutterUpdatesBot },
    { name: "React Native Updates", start: startReactNativeUpdatesBot },
    { name: "Electron Updates", start: startElectronUpdatesBot },
    { name: "Tauri Updates", start: startTauriUpdatesBot },
    { name: "PyTorch Updates", start: startPyTorchUpdatesBot },
    { name: "TensorFlow Updates", start: startTensorFlowUpdatesBot },
    { name: "Ollama Updates", start: startOllamaUpdatesBot },
    { name: "LangChain Updates", start: startLangChainUpdatesBot },

    /* ── New: Tech Company News ──────────────────────────── */
    { name: "GitHub News", start: startGitHubNewsBot },
    { name: "Cloudflare News", start: startCloudflareNewsBot },
    { name: "Vercel News", start: startVercelNewsBot },
    { name: "AWS News", start: startAWSNewsBot },
    { name: "Google News", start: startGoogleNewsBot },
    { name: "OpenAI News", start: startOpenAINewsBot },
    { name: "Meta News", start: startMetaNewsBot },
    { name: "Netflix News", start: startNetflixNewsBot },

    /* ── New: Niche / Trending ───────────────────────────── */
    { name: "SolidJS Updates", start: startSolidJSUpdatesBot },
    { name: "htmx Updates", start: startHtmxUpdatesBot },
    { name: "Alpine.js Updates", start: startAlpineJSUpdatesBot },
    { name: "tRPC Updates", start: startTRPCUpdatesBot },
    { name: "Bootstrap Updates", start: startBootstrapUpdatesBot },
    { name: "Three.js Updates", start: startThreeJSUpdatesBot },

    /* ── Game Development ────────────────────────────────── */
    { name: "Godot News", start: startGodotNewsBot },
    { name: "Godot Updates", start: startGodotUpdatesBot },
    { name: "Phaser Updates", start: startPhaserUpdatesBot },
    { name: "Unity News", start: startUnityNewsBot },
    { name: "Bevy News", start: startBevyNewsBot },
    { name: "Bevy Updates", start: startBevyUpdatesBot },
    { name: "Unreal Engine News", start: startUnrealEngineNewsBot },

    /* ── AI / LLM ──────────────────────────────────────────── */
    { name: "HuggingFace News", start: startHuggingFaceNewsBot },
    { name: "HuggingFace Updates", start: startHuggingFaceUpdatesBot },
    { name: "Gemini News", start: startGeminiNewsBot },
    { name: "Gemini Updates", start: startGeminiUpdatesBot },
    { name: "Cohere News", start: startCohereNewsBot },
    { name: "Cohere Updates", start: startCohereUpdatesBot },
    { name: "Groq News", start: startGroqNewsBot },
    { name: "Groq Updates", start: startGroqUpdatesBot },
    { name: "AutoGen News", start: startAutoGenNewsBot },
    { name: "AutoGen Updates", start: startAutoGenUpdatesBot },
    { name: "Semantic Kernel News", start: startSemanticKernelNewsBot },
    { name: "Semantic Kernel Updates", start: startSemanticKernelUpdatesBot },
    { name: "n8n News", start: startN8NNewsBot },
    { name: "n8n Updates", start: startN8NUpdatesBot },
    { name: "Stability AI Updates", start: startStabilityUpdatesBot },
    { name: "Haystack News", start: startHaystackNewsBot },
    { name: "Haystack Updates", start: startHaystackUpdatesBot },
    { name: "MLflow News", start: startMLflowNewsBot },
    { name: "MLflow Updates", start: startMLflowUpdatesBot },
    { name: "Anthropic Updates", start: startAnthropicUpdatesBot },
    { name: "Claude Code Updates", start: startClaudeCodeUpdatesBot },
    { name: "Mistral Updates", start: startMistralUpdatesBot },
    { name: "LlamaIndex Updates", start: startLlamaIndexUpdatesBot },
    { name: "CrewAI Updates", start: startCrewAIUpdatesBot },
    { name: "vLLM Updates", start: startVLLMUpdatesBot },
    { name: "Dify Updates", start: startDifyUpdatesBot },
    { name: "LiteLLM Updates", start: startLiteLLMUpdatesBot },
    { name: "ComfyUI Updates", start: startComfyUIUpdatesBot },
    { name: "DeepSeek Updates", start: startDeepSeekUpdatesBot },
    { name: "Flowise Updates", start: startFlowiseUpdatesBot },
    { name: "xAI Updates", start: startXAIUpdatesBot },
    { name: "Cursor News", start: startCursorNewsBot },
];

/**
 * Starts all registered bots sequentially. Each bot is wrapped in its own
 * try/catch so that a failure in one does not prevent the others from starting.
 */
async function bootstrap() {
    // Verify GitHub token is loaded
    if (process.env.GITHUB_TOKEN) {
        log(
            "SYSTEM",
            "SUCCESS",
            "GitHub token loaded — authenticated API access enabled (5,000 req/h).",
        );
    } else {
        log(
            "SYSTEM",
            "WARN",
            "GITHUB_TOKEN not set — using unauthenticated API (60 req/h). Set it in .env file.",
        );
    }

    log(
        "SYSTEM",
        "INFO",
        `🚀 TDN System Bots initializing... (${bots.length} watchers)`,
    );

    let successCount = 0;

    for (const bot of bots) {
        try {
            bot.start();
            successCount++;
        } catch (error) {
            log(
                "SYSTEM",
                "ERROR",
                `❌ Failed to start ${bot.name}: ${error.message}`,
            );
        }
    }

    log(
        "SYSTEM",
        "SUCCESS",
        `✅ ${successCount}/${bots.length} watchers started successfully.`,
    );
    log(
        "SYSTEM",
        "INFO",
        "Monitoring news feeds and GitHub releases across 75 technologies...",
    );
}

bootstrap();
