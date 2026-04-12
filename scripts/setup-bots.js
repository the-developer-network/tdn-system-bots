#!/usr/bin/env node
/**
 * @module scripts/setup-bots
 * @description One-time setup script for ALL TDN system bots.
 *
 * For each bot this script will:
 *   1. Register  (POST /auth/register)
 *   2. Login     (POST /auth/login)
 *   3. Profile   (PATCH /profiles/me)         — fullName, bio, location
 *   4. Avatar    (PATCH /profiles/me/avatar)   — fetched from remote URL
 *   5. Banner    (PATCH /profiles/me/banner)   — fetched from remote URL
 *
 * Usage:
 *   node scripts/setup-bots.js
 */

import { createRequire } from "module";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const require = createRequire(import.meta.url);
const config = require("../config.json");
let tokens = {};
try {
    tokens = require("../bot-tokens-private.json");
} catch (e) {
    // No bot-tokens-private.json found — proceed without static tokens
}

const API = config.apiBaseUrl; // http://localhost:8080/api/v1
const DELAY_MS = 300;

// State file to track which bots have been fully set up.
// Pass --force to ignore it and re-run all bots.
const STATE_FILE = path.join(__dirname, ".setup-state.json");
const FORCE = process.argv.includes("--force");

function loadState() {
    try {
        return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
    } catch {
        return {};
    }
}

function markDone(state, key) {
    state[key] = true;
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 4));
}

/* ═══════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════ */

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function registerBot(email, username, password) {
    const res = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, username, password }),
    });
    if (res.ok) return { ok: true };
    const text = await res.text().catch(() => "");
    return { ok: false, status: res.status, body: text };
}

async function loginBot(identifier, password) {
    const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
    });
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Login failed (${res.status}): ${text}`);
    }
    const json = await res.json();
    return json.data.accessToken;
}

async function patchProfile(
    token,
    { fullName, bio, location },
    scheme = "Bearer",
) {
    const res = await fetch(`${API}/profiles/me`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            Authorization: `${scheme} ${token}`,
        },
        body: JSON.stringify({ fullName, bio, location }),
    });
    if (!res.ok) throw new Error(`Profile update failed (${res.status})`);
}

async function uploadImage(
    token,
    endpoint,
    fieldName,
    imageUrl,
    scheme = "Bearer",
) {
    // 1 — Download image from public URL
    const imgRes = await fetch(imageUrl, { redirect: "follow" });
    if (!imgRes.ok)
        throw new Error(`Image fetch ${imgRes.status}: ${imageUrl}`);
    const buffer = Buffer.from(await imgRes.arrayBuffer());
    const ct = imgRes.headers.get("content-type") ?? "image/png";

    // 2 — Build multipart form
    const form = new FormData();
    form.append(
        fieldName,
        new Blob([buffer], { type: ct }),
        `${fieldName}.png`,
    );

    // 3 — Upload (do NOT set Content-Type — let fetch add boundary)
    const res = await fetch(`${API}${endpoint}`, {
        method: "PATCH",
        headers: { Authorization: `${scheme} ${token}` },
        body: form,
    });
    if (!res.ok) throw new Error(`Upload ${fieldName} failed (${res.status})`);
}

function buildBio(bot) {
    let bio = `🤖 Tech Developer News\n\n${bot.description}`;
    if (bot.website) bio += `\n\n🔗 ${bot.website}`;
    if (bot.githubUrl) bio += `\n📦 ${bot.githubUrl}`;
    return bio;
}

/* ═══════════════════════════════════════════════════════════
   BOT METADATA  (75 bots)
   ═══════════════════════════════════════════════════════════ */

const BOTS = [
    // ─── Languages ──────────────────────────────────────────
    {
        key: "typescript",
        fullName: "TypeScript",
        description:
            "TypeScript is a strongly typed programming language that builds on JavaScript, giving you better tooling at any scale.",
        website: "https://www.typescriptlang.org",
        location: "typescriptlang.org",
        githubUrl: "https://github.com/microsoft/TypeScript",
        avatarUrl: "https://github.com/microsoft.png",
        bannerUrl: "https://opengraph.githubassets.com/1/microsoft/TypeScript",
    },
    {
        key: "python",
        fullName: "Python",
        description:
            "Python is a versatile, high-level programming language known for its clear syntax and broad ecosystem.",
        website: "https://www.python.org",
        location: "python.org",
        githubUrl: "https://github.com/python/cpython",
        avatarUrl: "https://github.com/python.png",
        bannerUrl: "https://opengraph.githubassets.com/1/python/cpython",
    },
    {
        key: "rust",
        fullName: "Rust",
        description:
            "Rust is a systems programming language focused on safety, speed, and concurrency.",
        website: "https://www.rust-lang.org",
        location: "rust-lang.org",
        githubUrl: "https://github.com/rust-lang/rust",
        avatarUrl: "https://github.com/rust-lang.png",
        bannerUrl: "https://opengraph.githubassets.com/1/rust-lang/rust",
    },
    {
        key: "go",
        fullName: "Go",
        description:
            "Go is an open-source programming language designed for simplicity, reliability, and efficiency.",
        website: "https://go.dev",
        location: "go.dev",
        githubUrl: "https://github.com/golang/go",
        avatarUrl: "https://github.com/golang.png",
        bannerUrl: "https://opengraph.githubassets.com/1/golang/go",
    },
    {
        key: "java",
        fullName: "Java",
        description:
            "Java is a high-level, object-oriented programming language designed to be platform-independent.",
        website: "https://dev.java",
        location: "dev.java",
        githubUrl: "https://github.com/openjdk/jdk",
        avatarUrl: "https://github.com/openjdk.png",
        bannerUrl: "https://opengraph.githubassets.com/1/openjdk/jdk",
    },
    {
        key: "kotlin",
        fullName: "Kotlin",
        description:
            "Kotlin is a modern, concise programming language by JetBrains, fully interoperable with Java.",
        website: "https://kotlinlang.org",
        location: "kotlinlang.org",
        githubUrl: "https://github.com/JetBrains/kotlin",
        avatarUrl: "https://github.com/JetBrains.png",
        bannerUrl: "https://opengraph.githubassets.com/1/JetBrains/kotlin",
    },
    {
        key: "swift",
        fullName: "Swift",
        description:
            "Swift is a powerful and intuitive programming language developed by Apple for iOS, macOS, and beyond.",
        website: "https://www.swift.org",
        location: "swift.org",
        githubUrl: "https://github.com/apple/swift",
        avatarUrl: "https://github.com/apple.png",
        bannerUrl: "https://opengraph.githubassets.com/1/apple/swift",
    },
    {
        key: "php",
        fullName: "PHP",
        description:
            "PHP is a popular general-purpose scripting language especially suited to web development.",
        website: "https://www.php.net",
        location: "php.net",
        githubUrl: "https://github.com/php/php-src",
        avatarUrl: "https://github.com/php.png",
        bannerUrl: "https://opengraph.githubassets.com/1/php/php-src",
    },
    {
        key: "ruby",
        fullName: "Ruby",
        description:
            "Ruby is a dynamic, open-source programming language with a focus on simplicity and productivity.",
        website: "https://www.ruby-lang.org",
        location: "ruby-lang.org",
        githubUrl: "https://github.com/ruby/ruby",
        avatarUrl: "https://github.com/ruby.png",
        bannerUrl: "https://opengraph.githubassets.com/1/ruby/ruby",
    },
    {
        key: "dotnet",
        fullName: ".NET",
        description:
            ".NET is a free, open-source developer platform by Microsoft for building many different types of applications.",
        website: "https://dotnet.microsoft.com",
        location: "dotnet.microsoft.com",
        githubUrl: "https://github.com/dotnet/runtime",
        avatarUrl: "https://github.com/dotnet.png",
        bannerUrl: "https://opengraph.githubassets.com/1/dotnet/runtime",
    },
    {
        key: "elixir",
        fullName: "Elixir",
        description:
            "Elixir is a dynamic, functional programming language designed for building scalable applications on the Erlang VM.",
        website: "https://elixir-lang.org",
        location: "elixir-lang.org",
        githubUrl: "https://github.com/elixir-lang/elixir",
        avatarUrl: "https://github.com/elixir-lang.png",
        bannerUrl: "https://opengraph.githubassets.com/1/elixir-lang/elixir",
    },
    {
        key: "zig",
        fullName: "Zig",
        description:
            "Zig is a systems programming language focused on safety, performance, and ease of maintenance.",
        website: "https://ziglang.org",
        location: "ziglang.org",
        githubUrl: "https://github.com/ziglang/zig",
        avatarUrl: "https://github.com/ziglang.png",
        bannerUrl: "https://opengraph.githubassets.com/1/ziglang/zig",
    },

    // ─── Runtimes ───────────────────────────────────────────
    {
        key: "nodejs",
        fullName: "Node.js",
        description:
            "Node.js® is a cross-platform JavaScript runtime environment built on Chrome's V8 engine.",
        website: "https://nodejs.org",
        location: "nodejs.org",
        githubUrl: "https://github.com/nodejs/node",
        avatarUrl: "https://github.com/nodejs.png",
        bannerUrl: "https://opengraph.githubassets.com/1/nodejs/node",
    },
    {
        key: "deno",
        fullName: "Deno",
        description:
            "Deno is a secure runtime for JavaScript and TypeScript, built on V8 and Rust.",
        website: "https://deno.land",
        location: "deno.land",
        githubUrl: "https://github.com/denoland/deno",
        avatarUrl: "https://github.com/denoland.png",
        bannerUrl: "https://opengraph.githubassets.com/1/denoland/deno",
    },
    {
        key: "bun",
        fullName: "Bun",
        description:
            "Bun is an all-in-one JavaScript runtime & toolkit designed for speed, with a bundler and package manager built-in.",
        website: "https://bun.sh",
        location: "bun.sh",
        githubUrl: "https://github.com/oven-sh/bun",
        avatarUrl: "https://github.com/oven-sh.png",
        bannerUrl: "https://opengraph.githubassets.com/1/oven-sh/bun",
    },

    // ─── Frontend Frameworks & CSS ──────────────────────────
    {
        key: "react",
        fullName: "React",
        description:
            "React is a JavaScript library for building user interfaces, maintained by Meta and a community of developers.",
        website: "https://react.dev",
        location: "react.dev",
        githubUrl: "https://github.com/facebook/react",
        avatarUrl: "https://github.com/facebook.png",
        bannerUrl: "https://opengraph.githubassets.com/1/facebook/react",
    },
    {
        key: "nextjs",
        fullName: "Next.js",
        description:
            "Next.js is a React framework for building full-stack web applications with server-side rendering and static generation.",
        website: "https://nextjs.org",
        location: "nextjs.org",
        githubUrl: "https://github.com/vercel/next.js",
        avatarUrl: "https://github.com/vercel.png",
        bannerUrl: "https://opengraph.githubassets.com/1/vercel/next.js",
    },
    {
        key: "vue",
        fullName: "Vue.js",
        description:
            "Vue.js is a progressive JavaScript framework for building user interfaces and single-page applications.",
        website: "https://vuejs.org",
        location: "vuejs.org",
        githubUrl: "https://github.com/vuejs/core",
        avatarUrl: "https://github.com/vuejs.png",
        bannerUrl: "https://opengraph.githubassets.com/1/vuejs/core",
    },
    {
        key: "angular",
        fullName: "Angular",
        description:
            "Angular is a TypeScript-based web application framework led by the Angular Team at Google.",
        website: "https://angular.dev",
        location: "angular.dev",
        githubUrl: "https://github.com/angular/angular",
        avatarUrl: "https://github.com/angular.png",
        bannerUrl: "https://opengraph.githubassets.com/1/angular/angular",
    },
    {
        key: "svelte",
        fullName: "Svelte",
        description:
            "Svelte is a compiler that turns declarative components into efficient JavaScript that surgically updates the DOM.",
        website: "https://svelte.dev",
        location: "svelte.dev",
        githubUrl: "https://github.com/sveltejs/svelte",
        avatarUrl: "https://github.com/sveltejs.png",
        bannerUrl: "https://opengraph.githubassets.com/1/sveltejs/svelte",
    },
    {
        key: "tailwindcss",
        fullName: "Tailwind CSS",
        description:
            "Tailwind CSS is a utility-first CSS framework for rapidly building custom user interfaces.",
        website: "https://tailwindcss.com",
        location: "tailwindcss.com",
        githubUrl: "https://github.com/tailwindlabs/tailwindcss",
        avatarUrl: "https://github.com/tailwindlabs.png",
        bannerUrl:
            "https://opengraph.githubassets.com/1/tailwindlabs/tailwindcss",
    },
    {
        key: "nuxt",
        fullName: "Nuxt",
        description:
            "Nuxt is a Vue.js framework for building universal, performant web applications with server-side rendering.",
        website: "https://nuxt.com",
        location: "nuxt.com",
        githubUrl: "https://github.com/nuxt/nuxt",
        avatarUrl: "https://github.com/nuxt.png",
        bannerUrl: "https://opengraph.githubassets.com/1/nuxt/nuxt",
    },
    {
        key: "astro",
        fullName: "Astro",
        description:
            "Astro is a web framework for building fast, content-focused websites with an island architecture.",
        website: "https://astro.build",
        location: "astro.build",
        githubUrl: "https://github.com/withastro/astro",
        avatarUrl: "https://github.com/withastro.png",
        bannerUrl: "https://opengraph.githubassets.com/1/withastro/astro",
    },
    {
        key: "solidjs",
        fullName: "SolidJS",
        description:
            "SolidJS is a declarative JavaScript library for building user interfaces with fine-grained reactivity.",
        website: "https://www.solidjs.com",
        location: "solidjs.com",
        githubUrl: "https://github.com/solidjs/solid",
        avatarUrl: "https://github.com/solidjs.png",
        bannerUrl: "https://opengraph.githubassets.com/1/solidjs/solid",
    },
    {
        key: "htmx",
        fullName: "htmx",
        description:
            "htmx allows you to access modern browser features directly from HTML, without writing JavaScript.",
        website: "https://htmx.org",
        location: "htmx.org",
        githubUrl: "https://github.com/bigskysoftware/htmx",
        avatarUrl: "https://github.com/bigskysoftware.png",
        bannerUrl: "https://opengraph.githubassets.com/1/bigskysoftware/htmx",
    },
    {
        key: "alpinejs",
        fullName: "Alpine.js",
        description:
            "Alpine.js is a lightweight JavaScript framework for composing behavior directly in your HTML.",
        website: "https://alpinejs.dev",
        location: "alpinejs.dev",
        githubUrl: "https://github.com/alpinejs/alpine",
        avatarUrl: "https://github.com/alpinejs.png",
        bannerUrl: "https://opengraph.githubassets.com/1/alpinejs/alpine",
    },
    {
        key: "bootstrap",
        fullName: "Bootstrap",
        description:
            "Bootstrap is the world's most popular CSS framework for responsive, mobile-first front-end development.",
        website: "https://getbootstrap.com",
        location: "getbootstrap.com",
        githubUrl: "https://github.com/twbs/bootstrap",
        avatarUrl: "https://github.com/twbs.png",
        bannerUrl: "https://opengraph.githubassets.com/1/twbs/bootstrap",
    },
    {
        key: "threejs",
        fullName: "Three.js",
        description:
            "Three.js is a JavaScript library for creating and displaying 3D computer graphics in a web browser using WebGL.",
        website: "https://threejs.org",
        location: "threejs.org",
        githubUrl: "https://github.com/mrdoob/three.js",
        avatarUrl: "https://github.com/mrdoob.png",
        bannerUrl: "https://opengraph.githubassets.com/1/mrdoob/three.js",
    },

    // ─── Backend Frameworks ─────────────────────────────────
    {
        key: "laravel",
        fullName: "Laravel",
        description:
            "Laravel is a PHP web application framework with expressive, elegant syntax for modern web development.",
        website: "https://laravel.com",
        location: "laravel.com",
        githubUrl: "https://github.com/laravel/framework",
        avatarUrl: "https://github.com/laravel.png",
        bannerUrl: "https://opengraph.githubassets.com/1/laravel/framework",
    },
    {
        key: "remix",
        fullName: "Remix",
        description:
            "Remix is a full-stack web framework focused on web standards and modern UX patterns.",
        website: "https://remix.run",
        location: "remix.run",
        githubUrl: "https://github.com/remix-run/remix",
        avatarUrl: "https://github.com/remix-run.png",
        bannerUrl: "https://opengraph.githubassets.com/1/remix-run/remix",
    },
    {
        key: "express",
        fullName: "Express",
        description:
            "Express is a fast, unopinionated, minimalist web framework for Node.js.",
        website: "https://expressjs.com",
        location: "expressjs.com",
        githubUrl: "https://github.com/expressjs/express",
        avatarUrl: "https://github.com/expressjs.png",
        bannerUrl: "https://opengraph.githubassets.com/1/expressjs/express",
    },
    {
        key: "fastify",
        fullName: "Fastify",
        description:
            "Fastify is a fast and low-overhead web framework for Node.js focused on performance and developer experience.",
        website: "https://fastify.dev",
        location: "fastify.dev",
        githubUrl: "https://github.com/fastify/fastify",
        avatarUrl: "https://github.com/fastify.png",
        bannerUrl: "https://opengraph.githubassets.com/1/fastify/fastify",
    },
    {
        key: "nestjs",
        fullName: "NestJS",
        description:
            "NestJS is a progressive Node.js framework for building efficient, reliable, and scalable server-side applications.",
        website: "https://nestjs.com",
        location: "nestjs.com",
        githubUrl: "https://github.com/nestjs/nest",
        avatarUrl: "https://github.com/nestjs.png",
        bannerUrl: "https://opengraph.githubassets.com/1/nestjs/nest",
    },
    {
        key: "hono",
        fullName: "Hono",
        description:
            "Hono is an ultrafast web framework for the Edges — Cloudflare Workers, Deno, Bun, and Node.js.",
        website: "https://hono.dev",
        location: "hono.dev",
        githubUrl: "https://github.com/honojs/hono",
        avatarUrl: "https://github.com/honojs.png",
        bannerUrl: "https://opengraph.githubassets.com/1/honojs/hono",
    },
    {
        key: "django",
        fullName: "Django",
        description:
            "Django is a high-level Python web framework that encourages rapid development and clean, pragmatic design.",
        website: "https://www.djangoproject.com",
        location: "djangoproject.com",
        githubUrl: "https://github.com/django/django",
        avatarUrl: "https://github.com/django.png",
        bannerUrl: "https://opengraph.githubassets.com/1/django/django",
    },
    {
        key: "fastapi",
        fullName: "FastAPI",
        description:
            "FastAPI is a modern, fast Python web framework for building APIs with automatic interactive documentation.",
        website: "https://fastapi.tiangolo.com",
        location: "fastapi.tiangolo.com",
        githubUrl: "https://github.com/fastapi/fastapi",
        avatarUrl: "https://github.com/fastapi.png",
        bannerUrl: "https://opengraph.githubassets.com/1/fastapi/fastapi",
    },
    {
        key: "springboot",
        fullName: "Spring Boot",
        description:
            "Spring Boot makes it easy to create stand-alone, production-grade Spring-based applications.",
        website: "https://spring.io",
        location: "spring.io",
        githubUrl: "https://github.com/spring-projects/spring-boot",
        avatarUrl: "https://github.com/spring-projects.png",
        bannerUrl:
            "https://opengraph.githubassets.com/1/spring-projects/spring-boot",
    },
    {
        key: "rails",
        fullName: "Ruby on Rails",
        description:
            "Ruby on Rails is a full-stack web framework optimized for programmer happiness and sustainable productivity.",
        website: "https://rubyonrails.org",
        location: "rubyonrails.org",
        githubUrl: "https://github.com/rails/rails",
        avatarUrl: "https://github.com/rails.png",
        bannerUrl: "https://opengraph.githubassets.com/1/rails/rails",
    },
    {
        key: "trpc",
        fullName: "tRPC",
        description:
            "tRPC allows you to easily build & consume fully typesafe APIs without schemas or code generation.",
        website: "https://trpc.io",
        location: "trpc.io",
        githubUrl: "https://github.com/trpc/trpc",
        avatarUrl: "https://github.com/trpc.png",
        bannerUrl: "https://opengraph.githubassets.com/1/trpc/trpc",
    },

    // ─── Build Tools & DX ───────────────────────────────────
    {
        key: "vite",
        fullName: "Vite",
        description:
            "Vite is a next-generation frontend build tool that provides instant server start and lightning-fast HMR.",
        website: "https://vitejs.dev",
        location: "vitejs.dev",
        githubUrl: "https://github.com/vitejs/vite",
        avatarUrl: "https://github.com/vitejs.png",
        bannerUrl: "https://opengraph.githubassets.com/1/vitejs/vite",
    },
    {
        key: "esbuild",
        fullName: "esbuild",
        description:
            "esbuild is an extremely fast JavaScript bundler and minifier written in Go.",
        website: "https://esbuild.github.io",
        location: "esbuild.github.io",
        githubUrl: "https://github.com/evanw/esbuild",
        avatarUrl: "https://github.com/evanw.png",
        bannerUrl: "https://opengraph.githubassets.com/1/evanw/esbuild",
    },
    {
        key: "swc",
        fullName: "SWC",
        description:
            "SWC is a super-fast TypeScript / JavaScript compiler written in Rust.",
        website: "https://swc.rs",
        location: "swc.rs",
        githubUrl: "https://github.com/swc-project/swc",
        avatarUrl: "https://github.com/swc-project.png",
        bannerUrl: "https://opengraph.githubassets.com/1/swc-project/swc",
    },
    {
        key: "biome",
        fullName: "Biome",
        description:
            "Biome is a fast formatter and linter for JavaScript, TypeScript, JSX, and JSON.",
        website: "https://biomejs.dev",
        location: "biomejs.dev",
        githubUrl: "https://github.com/biomejs/biome",
        avatarUrl: "https://github.com/biomejs.png",
        bannerUrl: "https://opengraph.githubassets.com/1/biomejs/biome",
    },
    {
        key: "eslint",
        fullName: "ESLint",
        description:
            "ESLint is a pluggable linting utility for JavaScript and TypeScript code quality.",
        website: "https://eslint.org",
        location: "eslint.org",
        githubUrl: "https://github.com/eslint/eslint",
        avatarUrl: "https://github.com/eslint.png",
        bannerUrl: "https://opengraph.githubassets.com/1/eslint/eslint",
    },
    {
        key: "prettier",
        fullName: "Prettier",
        description:
            "Prettier is an opinionated code formatter supporting many languages and integrations.",
        website: "https://prettier.io",
        location: "prettier.io",
        githubUrl: "https://github.com/prettier/prettier",
        avatarUrl: "https://github.com/prettier.png",
        bannerUrl: "https://opengraph.githubassets.com/1/prettier/prettier",
    },
    {
        key: "pnpm",
        fullName: "pnpm",
        description:
            "pnpm is a fast, disk-space-efficient package manager for Node.js.",
        website: "https://pnpm.io",
        location: "pnpm.io",
        githubUrl: "https://github.com/pnpm/pnpm",
        avatarUrl: "https://github.com/pnpm.png",
        bannerUrl: "https://opengraph.githubassets.com/1/pnpm/pnpm",
    },
    {
        key: "vitest",
        fullName: "Vitest",
        description:
            "Vitest is a blazing-fast unit testing framework powered by Vite.",
        website: "https://vitest.dev",
        location: "vitest.dev",
        githubUrl: "https://github.com/vitest-dev/vitest",
        avatarUrl: "https://github.com/vitest-dev.png",
        bannerUrl: "https://opengraph.githubassets.com/1/vitest-dev/vitest",
    },
    {
        key: "playwright",
        fullName: "Playwright",
        description:
            "Playwright is a framework for reliable end-to-end testing and browser automation by Microsoft.",
        website: "https://playwright.dev",
        location: "playwright.dev",
        githubUrl: "https://github.com/microsoft/playwright",
        avatarUrl: "https://github.com/microsoft.png",
        bannerUrl: "https://opengraph.githubassets.com/1/microsoft/playwright",
    },
    {
        key: "webpack",
        fullName: "webpack",
        description:
            "webpack is a powerful module bundler for modern JavaScript applications.",
        website: "https://webpack.js.org",
        location: "webpack.js.org",
        githubUrl: "https://github.com/webpack/webpack",
        avatarUrl: "https://github.com/webpack.png",
        bannerUrl: "https://opengraph.githubassets.com/1/webpack/webpack",
    },

    // ─── Infrastructure ─────────────────────────────────────
    {
        key: "docker",
        fullName: "Docker",
        description:
            "Docker is an open platform for developing, shipping, and running applications in containers.",
        website: "https://www.docker.com",
        location: "docker.com",
        githubUrl: "https://github.com/moby/moby",
        avatarUrl: "https://github.com/docker.png",
        bannerUrl: "https://opengraph.githubassets.com/1/moby/moby",
    },
    {
        key: "kubernetes",
        fullName: "Kubernetes",
        description:
            "Kubernetes is an open-source container orchestration platform for automating deployment, scaling, and management.",
        website: "https://kubernetes.io",
        location: "kubernetes.io",
        githubUrl: "https://github.com/kubernetes/kubernetes",
        avatarUrl: "https://github.com/kubernetes.png",
        bannerUrl: "https://opengraph.githubassets.com/1/kubernetes/kubernetes",
    },
    {
        key: "supabase",
        fullName: "Supabase",
        description:
            "Supabase is an open-source Firebase alternative providing a Postgres database, auth, and real-time subscriptions.",
        website: "https://supabase.com",
        location: "supabase.com",
        githubUrl: "https://github.com/supabase/supabase",
        avatarUrl: "https://github.com/supabase.png",
        bannerUrl: "https://opengraph.githubassets.com/1/supabase/supabase",
    },
    {
        key: "terraform",
        fullName: "Terraform",
        description:
            "Terraform is an infrastructure-as-code tool by HashiCorp for building, changing, and versioning infrastructure safely.",
        website: "https://www.terraform.io",
        location: "terraform.io",
        githubUrl: "https://github.com/hashicorp/terraform",
        avatarUrl: "https://github.com/hashicorp.png",
        bannerUrl: "https://opengraph.githubassets.com/1/hashicorp/terraform",
    },
    {
        key: "grafana",
        fullName: "Grafana",
        description:
            "Grafana is an open-source analytics and monitoring platform for all your metrics.",
        website: "https://grafana.com",
        location: "grafana.com",
        githubUrl: "https://github.com/grafana/grafana",
        avatarUrl: "https://github.com/grafana.png",
        bannerUrl: "https://opengraph.githubassets.com/1/grafana/grafana",
    },
    {
        key: "prometheus",
        fullName: "Prometheus",
        description:
            "Prometheus is an open-source monitoring and alerting toolkit designed for reliability.",
        website: "https://prometheus.io",
        location: "prometheus.io",
        githubUrl: "https://github.com/prometheus/prometheus",
        avatarUrl: "https://github.com/prometheus.png",
        bannerUrl: "https://opengraph.githubassets.com/1/prometheus/prometheus",
    },
    {
        key: "redis",
        fullName: "Redis",
        description:
            "Redis is an open-source, in-memory data structure store used as a database, cache, and message broker.",
        website: "https://redis.io",
        location: "redis.io",
        githubUrl: "https://github.com/redis/redis",
        avatarUrl: "https://github.com/redis.png",
        bannerUrl: "https://opengraph.githubassets.com/1/redis/redis",
    },
    {
        key: "prisma",
        fullName: "Prisma",
        description:
            "Prisma is a next-generation ORM for Node.js and TypeScript with a type-safe database client.",
        website: "https://www.prisma.io",
        location: "prisma.io",
        githubUrl: "https://github.com/prisma/prisma",
        avatarUrl: "https://github.com/prisma.png",
        bannerUrl: "https://opengraph.githubassets.com/1/prisma/prisma",
    },
    {
        key: "drizzle",
        fullName: "Drizzle ORM",
        description:
            "Drizzle ORM is a lightweight, performant TypeScript ORM with a SQL-like query builder.",
        website: "https://orm.drizzle.team",
        location: "orm.drizzle.team",
        githubUrl: "https://github.com/drizzle-team/drizzle-orm",
        avatarUrl: "https://github.com/drizzle-team.png",
        bannerUrl:
            "https://opengraph.githubassets.com/1/drizzle-team/drizzle-orm",
    },
    {
        key: "mongodb",
        fullName: "MongoDB",
        description:
            "MongoDB is a document-oriented NoSQL database designed for scalability and developer agility.",
        website: "https://www.mongodb.com",
        location: "mongodb.com",
        githubUrl: "https://github.com/mongodb/mongo",
        avatarUrl: "https://github.com/mongodb.png",
        bannerUrl: "https://opengraph.githubassets.com/1/mongodb/mongo",
    },

    // ─── Mobile / Desktop / AI ──────────────────────────────
    {
        key: "flutter",
        fullName: "Flutter",
        description:
            "Flutter is Google's UI toolkit for building natively compiled apps for mobile, web, and desktop from a single codebase.",
        website: "https://flutter.dev",
        location: "flutter.dev",
        githubUrl: "https://github.com/flutter/flutter",
        avatarUrl: "https://github.com/flutter.png",
        bannerUrl: "https://opengraph.githubassets.com/1/flutter/flutter",
    },
    {
        key: "reactnative",
        fullName: "React Native",
        description:
            "React Native is a framework by Meta for building native mobile apps using React and JavaScript.",
        website: "https://reactnative.dev",
        location: "reactnative.dev",
        githubUrl: "https://github.com/facebook/react-native",
        avatarUrl: "https://github.com/facebook.png",
        bannerUrl: "https://opengraph.githubassets.com/1/facebook/react-native",
    },
    {
        key: "electron",
        fullName: "Electron",
        description:
            "Electron is a framework for building cross-platform desktop applications with JavaScript, HTML, and CSS.",
        website: "https://www.electronjs.org",
        location: "electronjs.org",
        githubUrl: "https://github.com/electron/electron",
        avatarUrl: "https://github.com/electron.png",
        bannerUrl: "https://opengraph.githubassets.com/1/electron/electron",
    },
    {
        key: "tauri",
        fullName: "Tauri",
        description:
            "Tauri is a framework for building small, fast, and secure desktop applications with web technologies and Rust.",
        website: "https://tauri.app",
        location: "tauri.app",
        githubUrl: "https://github.com/tauri-apps/tauri",
        avatarUrl: "https://github.com/tauri-apps.png",
        bannerUrl: "https://opengraph.githubassets.com/1/tauri-apps/tauri",
    },
    {
        key: "pytorch",
        fullName: "PyTorch",
        description:
            "PyTorch is an open-source machine learning framework for deep learning research and production.",
        website: "https://pytorch.org",
        location: "pytorch.org",
        githubUrl: "https://github.com/pytorch/pytorch",
        avatarUrl: "https://github.com/pytorch.png",
        bannerUrl: "https://opengraph.githubassets.com/1/pytorch/pytorch",
    },
    {
        key: "tensorflow",
        fullName: "TensorFlow",
        description:
            "TensorFlow is an open-source platform for machine learning and artificial intelligence.",
        website: "https://www.tensorflow.org",
        location: "tensorflow.org",
        githubUrl: "https://github.com/tensorflow/tensorflow",
        avatarUrl: "https://github.com/tensorflow.png",
        bannerUrl: "https://opengraph.githubassets.com/1/tensorflow/tensorflow",
    },
    {
        key: "ollama",
        fullName: "Ollama",
        description:
            "Ollama makes it easy to run large language models locally on your machine.",
        website: "https://ollama.com",
        location: "ollama.com",
        githubUrl: "https://github.com/ollama/ollama",
        avatarUrl: "https://github.com/ollama.png",
        bannerUrl: "https://opengraph.githubassets.com/1/ollama/ollama",
    },
    {
        key: "langchain",
        fullName: "LangChain",
        description:
            "LangChain is a framework for developing applications powered by large language models.",
        website: "https://www.langchain.com",
        location: "langchain.com",
        githubUrl: "https://github.com/langchain-ai/langchain",
        avatarUrl: "https://github.com/langchain-ai.png",
        bannerUrl:
            "https://opengraph.githubassets.com/1/langchain-ai/langchain",
    },

    // ─── Tech Company News ──────────────────────────────────
    {
        key: "github",
        fullName: "GitHub",
        description:
            "GitHub is the world's leading platform for software development, version control, and collaboration.",
        website: "https://github.blog",
        location: "github.blog",
        githubUrl: "https://github.com/github",
        avatarUrl: "https://github.com/github.png",
        bannerUrl: "https://opengraph.githubassets.com/1/github/docs",
    },
    {
        key: "cloudflare",
        fullName: "Cloudflare",
        description:
            "Cloudflare provides CDN, security, and edge computing services for a faster, safer internet.",
        website: "https://blog.cloudflare.com",
        location: "cloudflare.com",
        githubUrl: "https://github.com/cloudflare",
        avatarUrl: "https://github.com/cloudflare.png",
        bannerUrl:
            "https://opengraph.githubassets.com/1/cloudflare/workers-sdk",
    },
    {
        key: "vercel",
        fullName: "Vercel",
        description:
            "Vercel is the platform for frontend developers, providing speed and reliability innovators need.",
        website: "https://vercel.com",
        location: "vercel.com",
        githubUrl: "https://github.com/vercel",
        avatarUrl: "https://github.com/vercel.png",
        bannerUrl: "https://opengraph.githubassets.com/1/vercel/next.js",
    },
    {
        key: "aws",
        fullName: "Amazon Web Services",
        description:
            "AWS is the world's most comprehensive and broadly adopted cloud platform.",
        website: "https://aws.amazon.com",
        location: "aws.amazon.com",
        githubUrl: "https://github.com/aws",
        avatarUrl: "https://github.com/aws.png",
        bannerUrl: "https://opengraph.githubassets.com/1/aws/aws-cdk",
    },
    {
        key: "google",
        fullName: "Google Developers",
        description:
            "Google Developers provides tools, APIs, and resources for building on Google's platforms.",
        website: "https://developers.google.com",
        location: "developers.google.com",
        githubUrl: "https://github.com/google",
        avatarUrl: "https://github.com/google.png",
        bannerUrl: "https://opengraph.githubassets.com/1/google/googletest",
    },
    {
        key: "openai",
        fullName: "OpenAI",
        description:
            "OpenAI is an AI research and deployment company building safe and beneficial artificial general intelligence.",
        website: "https://openai.com",
        location: "openai.com",
        githubUrl: "https://github.com/openai",
        avatarUrl: "https://github.com/openai.png",
        bannerUrl: "https://opengraph.githubassets.com/1/openai/openai-python",
    },
    {
        key: "meta",
        fullName: "Meta Engineering",
        description:
            "Meta builds technologies that help people connect, find communities, and grow businesses.",
        website: "https://engineering.fb.com",
        location: "engineering.fb.com",
        githubUrl: "https://github.com/facebook",
        avatarUrl: "https://github.com/facebook.png",
        bannerUrl: "https://opengraph.githubassets.com/1/facebook/react",
    },
    {
        key: "netflix",
        fullName: "Netflix Tech",
        description:
            "Netflix Tech Blog shares insights on engineering, architecture, and innovation at Netflix.",
        website: "https://netflixtechblog.com",
        location: "netflixtechblog.com",
        githubUrl: "https://github.com/Netflix",
        avatarUrl: "https://github.com/Netflix.png",
        bannerUrl: "https://opengraph.githubassets.com/1/Netflix/zuul",
    },
    // ─── Game Development ────────────────────────────────────
    {
        key: "godot",
        fullName: "Godot Engine",
        description:
            "Godot is a free, open-source game engine for 2D and 3D games, supporting GDScript, C#, and C++.",
        website: "https://godotengine.org",
        location: "godotengine.org",
        githubUrl: "https://github.com/godotengine/godot",
        avatarUrl: "https://github.com/godotengine.png",
        bannerUrl: "https://opengraph.githubassets.com/1/godotengine/godot",
    },
    {
        key: "phaser",
        fullName: "Phaser",
        description:
            "Phaser is a fast, free, and fun open-source HTML5 game framework for desktop and mobile browsers.",
        website: "https://phaser.io",
        location: "phaser.io",
        githubUrl: "https://github.com/phaserjs/phaser",
        avatarUrl: "https://github.com/phaserjs.png",
        bannerUrl: "https://opengraph.githubassets.com/1/phaserjs/phaser",
    },
    {
        key: "unity",
        fullName: "Unity",
        description:
            "Unity is a cross-platform game engine used to create 2D, 3D, AR, and VR games and simulations.",
        website: "https://unity.com",
        location: "unity.com",
        avatarUrl: "https://github.com/Unity-Technologies.png",
        bannerUrl:
            "https://opengraph.githubassets.com/1/Unity-Technologies/UnityCsReference",
    },
    {
        key: "bevy",
        fullName: "Bevy Engine",
        description:
            "Bevy is a refreshingly simple data-driven game engine built in Rust, free and open source forever.",
        website: "https://bevyengine.org",
        location: "bevyengine.org",
        githubUrl: "https://github.com/bevyengine/bevy",
        avatarUrl: "https://github.com/bevyengine.png",
        bannerUrl: "https://opengraph.githubassets.com/1/bevyengine/bevy",
    },
    {
        key: "unrealengine",
        fullName: "Unreal Engine",
        description:
            "Unreal Engine is Epic Games' AAA game engine powering stunning real-time 3D experiences and games.",
        website: "https://www.unrealengine.com",
        location: "unrealengine.com",
        avatarUrl: "https://github.com/EpicGames.png",
        bannerUrl:
            "https://opengraph.githubassets.com/1/EpicGames/UnrealEngine",
    },
    {
        key: "huggingface",
        fullName: "Hugging Face",
        description:
            "Hugging Face is the AI community building the future of machine learning with open models, datasets, and tools.",
        website: "https://huggingface.co",
        location: "huggingface.co",
        githubUrl: "https://github.com/huggingface/transformers",
        avatarUrl: "https://github.com/huggingface.png",
        bannerUrl:
            "https://opengraph.githubassets.com/1/huggingface/transformers",
    },
    {
        key: "gemini",
        fullName: "Google Gemini",
        description:
            "Google Gemini is Google's most capable AI model family, powering next-generation AI experiences.",
        website: "https://deepmind.google/technologies/gemini",
        location: "deepmind.google",
        githubUrl: "https://github.com/google-gemini/generative-ai-js",
        avatarUrl: "https://github.com/google-gemini.png",
        bannerUrl:
            "https://opengraph.githubassets.com/1/google-gemini/generative-ai-js",
    },
    {
        key: "cohere",
        fullName: "Cohere",
        description:
            "Cohere provides large language model APIs and tools for enterprises to build AI-powered products.",
        website: "https://cohere.com",
        location: "cohere.com",
        githubUrl: "https://github.com/cohere-ai/cohere-python",
        avatarUrl: "https://github.com/cohere-ai.png",
        bannerUrl:
            "https://opengraph.githubassets.com/1/cohere-ai/cohere-python",
    },
    {
        key: "groq",
        fullName: "Groq",
        description:
            "Groq delivers ultra-fast AI inference with its LPU hardware, enabling real-time AI applications.",
        website: "https://groq.com",
        location: "groq.com",
        githubUrl: "https://github.com/groq/groq-python",
        avatarUrl: "https://github.com/groq.png",
        bannerUrl: "https://opengraph.githubassets.com/1/groq/groq-python",
    },
    {
        key: "autogen",
        fullName: "Microsoft AutoGen",
        description:
            "AutoGen is Microsoft's open-source framework for building multi-agent AI systems.",
        website: "https://microsoft.github.io/autogen",
        location: "microsoft.github.io/autogen",
        githubUrl: "https://github.com/microsoft/autogen",
        avatarUrl: "https://github.com/microsoft.png",
        bannerUrl: "https://opengraph.githubassets.com/1/microsoft/autogen",
    },
    {
        key: "semantickernel",
        fullName: "Microsoft Semantic Kernel",
        description:
            "Semantic Kernel is Microsoft's open-source SDK for integrating LLMs into applications.",
        website: "https://learn.microsoft.com/semantic-kernel",
        location: "learn.microsoft.com",
        githubUrl: "https://github.com/microsoft/semantic-kernel",
        avatarUrl: "https://github.com/microsoft.png",
        bannerUrl:
            "https://opengraph.githubassets.com/1/microsoft/semantic-kernel",
    },
    {
        key: "n8n",
        fullName: "n8n",
        description:
            "n8n is an open-source workflow automation tool with AI capabilities and 400+ integrations.",
        website: "https://n8n.io",
        location: "n8n.io",
        githubUrl: "https://github.com/n8n-io/n8n",
        avatarUrl: "https://github.com/n8n-io.png",
        bannerUrl: "https://opengraph.githubassets.com/1/n8n-io/n8n",
    },
    {
        key: "stability",
        fullName: "Stability AI",
        description:
            "Stability AI is the company behind Stable Diffusion and other open generative AI models.",
        website: "https://stability.ai",
        location: "stability.ai",
        githubUrl: "https://github.com/Stability-AI/generative-models",
        avatarUrl: "https://github.com/Stability-AI.png",
        bannerUrl:
            "https://opengraph.githubassets.com/1/Stability-AI/generative-models",
    },
    {
        key: "haystack",
        fullName: "Haystack by deepset",
        description:
            "Haystack is an open-source LLM framework by deepset for building AI search and RAG pipelines.",
        website: "https://haystack.deepset.ai",
        location: "haystack.deepset.ai",
        githubUrl: "https://github.com/deepset-ai/haystack",
        avatarUrl: "https://github.com/deepset-ai.png",
        bannerUrl: "https://opengraph.githubassets.com/1/deepset-ai/haystack",
    },
    {
        key: "mlflow",
        fullName: "MLflow",
        description:
            "MLflow is an open-source platform for the machine learning lifecycle, tracking experiments and deployments.",
        website: "https://mlflow.org",
        location: "mlflow.org",
        githubUrl: "https://github.com/mlflow/mlflow",
        avatarUrl: "https://github.com/mlflow.png",
        bannerUrl: "https://opengraph.githubassets.com/1/mlflow/mlflow",
    },
    {
        key: "anthropic",
        fullName: "Anthropic",
        description:
            "Anthropic is an AI safety company building Claude, a family of AI assistants designed to be safe and helpful.",
        website: "https://anthropic.com",
        location: "anthropic.com",
        githubUrl: "https://github.com/anthropics/anthropic-sdk-python",
        avatarUrl: "https://github.com/anthropics.png",
        bannerUrl:
            "https://opengraph.githubassets.com/1/anthropics/anthropic-sdk-python",
    },
    {
        key: "claudecode",
        fullName: "Claude Code",
        description:
            "Claude Code is Anthropic's agentic coding tool that lives in the terminal and understands your codebase.",
        website: "https://anthropic.com/claude-code",
        location: "anthropic.com",
        githubUrl: "https://github.com/anthropics/claude-code",
        avatarUrl: "https://github.com/anthropics.png",
        bannerUrl:
            "https://opengraph.githubassets.com/1/anthropics/claude-code",
    },
    {
        key: "mistral",
        fullName: "Mistral AI",
        description:
            "Mistral AI builds open and efficient frontier language models for developers and enterprises.",
        website: "https://mistral.ai",
        location: "mistral.ai",
        githubUrl: "https://github.com/mistralai/client-python",
        avatarUrl: "https://github.com/mistralai.png",
        bannerUrl:
            "https://opengraph.githubassets.com/1/mistralai/client-python",
    },
    {
        key: "llamaindex",
        fullName: "LlamaIndex",
        description:
            "LlamaIndex is a data framework for building LLM applications with retrieval-augmented generation.",
        website: "https://llamaindex.ai",
        location: "llamaindex.ai",
        githubUrl: "https://github.com/run-llama/llama_index",
        avatarUrl: "https://github.com/run-llama.png",
        bannerUrl: "https://opengraph.githubassets.com/1/run-llama/llama_index",
    },
    {
        key: "crewai",
        fullName: "CrewAI",
        description:
            "CrewAI is a framework for orchestrating role-playing autonomous AI agents to complete complex tasks.",
        website: "https://crewai.com",
        location: "crewai.com",
        githubUrl: "https://github.com/crewAIInc/crewAI",
        avatarUrl: "https://github.com/crewAIInc.png",
        bannerUrl: "https://opengraph.githubassets.com/1/crewAIInc/crewAI",
    },
    {
        key: "vllm",
        fullName: "vLLM",
        description:
            "vLLM is a high-throughput and memory-efficient inference and serving engine for LLMs.",
        website: "https://vllm.ai",
        location: "vllm.ai",
        githubUrl: "https://github.com/vllm-project/vllm",
        avatarUrl: "https://github.com/vllm-project.png",
        bannerUrl: "https://opengraph.githubassets.com/1/vllm-project/vllm",
    },
    {
        key: "dify",
        fullName: "Dify",
        description:
            "Dify is an open-source LLM app development platform for building and operating AI applications.",
        website: "https://dify.ai",
        location: "dify.ai",
        githubUrl: "https://github.com/langgenius/dify",
        avatarUrl: "https://github.com/langgenius.png",
        bannerUrl: "https://opengraph.githubassets.com/1/langgenius/dify",
    },
    {
        key: "litellm",
        fullName: "LiteLLM",
        description:
            "LiteLLM is a unified API for calling 100+ LLMs using the OpenAI format.",
        website: "https://litellm.ai",
        location: "litellm.ai",
        githubUrl: "https://github.com/BerriAI/litellm",
        avatarUrl: "https://github.com/BerriAI.png",
        bannerUrl: "https://opengraph.githubassets.com/1/BerriAI/litellm",
    },
    {
        key: "comfyui",
        fullName: "ComfyUI",
        description:
            "ComfyUI is a powerful and modular stable diffusion GUI with a graph/nodes interface.",
        website: "https://comfy.org",
        location: "comfy.org",
        githubUrl: "https://github.com/comfyanonymous/ComfyUI",
        avatarUrl: "https://github.com/comfyanonymous.png",
        bannerUrl:
            "https://opengraph.githubassets.com/1/comfyanonymous/ComfyUI",
    },
    {
        key: "deepseek",
        fullName: "DeepSeek",
        description:
            "DeepSeek is an AI company developing powerful open-source large language models.",
        website: "https://deepseek.com",
        location: "deepseek.com",
        githubUrl: "https://github.com/deepseek-ai/DeepSeek-V3",
        avatarUrl: "https://github.com/deepseek-ai.png",
        bannerUrl:
            "https://opengraph.githubassets.com/1/deepseek-ai/DeepSeek-V3",
    },
    {
        key: "flowise",
        fullName: "Flowise",
        description:
            "Flowise is an open-source low-code tool for building LLM apps with a drag-and-drop UI.",
        website: "https://flowiseai.com",
        location: "flowiseai.com",
        githubUrl: "https://github.com/FlowiseAI/Flowise",
        avatarUrl: "https://github.com/FlowiseAI.png",
        bannerUrl: "https://opengraph.githubassets.com/1/FlowiseAI/Flowise",
    },
    {
        key: "xai",
        fullName: "xAI (Grok)",
        description:
            "xAI is Elon Musk's AI company building Grok, a large language model with real-time knowledge.",
        website: "https://x.ai",
        location: "x.ai",
        githubUrl: "https://github.com/xai-org/grok-1",
        avatarUrl: "https://github.com/xai-org.png",
        bannerUrl: "https://opengraph.githubassets.com/1/xai-org/grok-1",
    },
    {
        key: "cursor",
        fullName: "Cursor",
        description:
            "Cursor is the AI-first code editor built for pair programming with AI.",
        website: "https://www.cursor.com",
        location: "cursor.com",
        githubUrl: null,
        avatarUrl: "https://www.cursor.com/favicon.ico",
        bannerUrl: null,
    },
];

/* ═══════════════════════════════════════════════════════════
   MAIN
   ═══════════════════════════════════════════════════════════ */

async function main() {
    const state = loadState();
    const pending = FORCE ? BOTS : BOTS.filter((b) => !state[b.key]);

    if (!FORCE && pending.length < BOTS.length) {
        console.log(
            `  ⏭  Skipping ${BOTS.length - pending.length} already-setup bot(s). Use --force to re-run all.`,
        );
    }

    console.log(
        `\n${"━".repeat(50)}\n  🚀 TDN Bot Setup — ${pending.length} bot(s) to process\n${"━".repeat(50)}\n`,
    );

    let success = 0;
    let failed = 0;
    const errors = [];

    for (const bot of pending) {
        const creds = config.bots[bot.key];
        if (!creds) {
            console.log(`⚠  ${bot.key}: missing from config.json — skipped`);
            failed++;
            errors.push(`${bot.key}: not in config`);
            continue;
        }

        console.log(`\n── ${bot.fullName} (${bot.key}) ──`);

        try {
            // Determine static token (from bot-tokens-private.json) — prefer key, then username, then email
            const staticToken =
                tokens && typeof tokens === "object"
                    ? tokens[bot.key] ||
                      (creds && (tokens[creds.username] || tokens[creds.email]))
                    : null;
            let token;
            let authScheme = "Bearer";

            if (staticToken) {
                console.log(
                    "  ℹ️ Using static token from bot-tokens-private.json — skipping register/login",
                );
                token = staticToken;
                authScheme = "Bot";
            } else {
                // 1 — Register
                const reg = await registerBot(
                    creds.email,
                    creds.username,
                    creds.password,
                );
                console.log(
                    reg.ok
                        ? "  ✅ Registered"
                        : `  ℹ️  Registration skipped (${reg.status})`,
                );

                // 2 — Login
                token = await loginBot(creds.username, creds.password);
                console.log("  ✅ Logged in");
            }

            // 3 — Profile
            const bio = buildBio(bot);
            await patchProfile(
                token,
                {
                    fullName: bot.fullName,
                    bio,
                    location: bot.location,
                },
                authScheme,
            );
            console.log("  ✅ Profile updated");

            // 4 — Avatar
            if (bot.avatarUrl) {
                try {
                    await uploadImage(
                        token,
                        "/profiles/me/avatar",
                        "avatar",
                        bot.avatarUrl,
                        authScheme,
                    );
                    console.log("  ✅ Avatar uploaded");
                } catch (e) {
                    console.log(`  ⚠  Avatar failed: ${e.message}`);
                }
            }

            // 5 — Banner
            if (bot.bannerUrl) {
                try {
                    await uploadImage(
                        token,
                        "/profiles/me/banner",
                        "banner",
                        bot.bannerUrl,
                        authScheme,
                    );
                    console.log("  ✅ Banner uploaded");
                } catch (e) {
                    console.log(`  ⚠  Banner failed: ${e.message}`);
                }
            }

            markDone(state, bot.key);
            success++;
        } catch (e) {
            console.log(`  ❌ FAILED: ${e.message}`);
            failed++;
            errors.push(`${bot.key}: ${e.message}`);
        }

        await wait(DELAY_MS);
    }

    // ── Summary ─────────────────────────────────────────────
    console.log(`\n${"━".repeat(50)}`);
    console.log(
        `  ✅ Success: ${success}/${pending.length}   ❌ Failed: ${failed}/${pending.length}`,
    );
    if (errors.length > 0) {
        console.log(`\n  Errors:`);
        errors.forEach((e) => console.log(`    • ${e}`));
    }
    console.log(`${"━".repeat(50)}\n`);
}

main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
});
