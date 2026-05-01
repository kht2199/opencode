#!/usr/bin/env bun
/**
 * Build closecode.exe (Windows x64) for on-premise deployment.
 *
 * Usage (from packages/opencode):
 *   bun run script/build-windows.ts [flags]
 *
 * Flags:
 *   --skip-embed-web-ui   Skip embedding frontend (faster, TUI-only)
 *   --skip-install        Skip cross-platform native package install
 *   --release             Create GitHub release and upload artifact
 *   --tag <v1.0.0>        Tag name for GitHub release (required with --release)
 */

import { $ } from "bun"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import { createSolidTransformPlugin } from "@opentui/solid/bun-plugin"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dir = path.resolve(__dirname, "..")
process.chdir(dir)

await import("./generate.ts")

import { Script } from "@opencode-ai/script"
import pkg from "../package.json"

const argv = process.argv.slice(2)
const skipEmbedWebUi = argv.includes("--skip-embed-web-ui")
const skipInstall = argv.includes("--skip-install")
const doRelease = argv.includes("--release")
const tagIdx = argv.indexOf("--tag")
const releaseTag = tagIdx !== -1 ? argv[tagIdx + 1] : `v${Script.version}`

const plugin = createSolidTransformPlugin()

// ── Migrations ────────────────────────────────────────────────────────────────

const migrationDirs = (
  await fs.promises.readdir(path.join(dir, "migration"), { withFileTypes: true })
)
  .filter((e) => e.isDirectory() && /^\d{14}/.test(e.name))
  .map((e) => e.name)
  .sort()

const migrations = await Promise.all(
  migrationDirs.map(async (name) => {
    const file = path.join(dir, "migration", name, "migration.sql")
    const sql = await Bun.file(file).text()
    const match = /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/.exec(name)
    const timestamp = match
      ? Date.UTC(+match[1], +match[2] - 1, +match[3], +match[4], +match[5], +match[6])
      : 0
    return { sql, timestamp, name }
  }),
)
console.log(`Loaded ${migrations.length} migrations`)

// ── Embedded Web UI (optional) ────────────────────────────────────────────────

let embeddedFileMap: string | null = null
if (!skipEmbedWebUi) {
  console.log("Building Web UI to embed in the binary...")
  const appDir = path.join(__dirname, "../../app")
  const dist = path.join(appDir, "dist")
  await $`bun run --cwd ${appDir} build`
  const files = (await Array.fromAsync(new Bun.Glob("**/*").scan({ cwd: dist })))
    .map((f) => f.replaceAll("\\", "/"))
    .sort()
  const imports = files.map(
    (f, i) =>
      `import file_${i} from ${JSON.stringify(`./${path.relative(dir, path.join(dist, f)).replaceAll("\\", "/")}`)} with { type: "file" };`,
  )
  const entries = files.map((f, i) => `  ${JSON.stringify(f)}: file_${i},`)
  embeddedFileMap = [`// Auto-generated embedded web UI`, ...imports, `export default {`, ...entries, `}`].join("\n")
}

// ── Native packages ───────────────────────────────────────────────────────────

if (!skipInstall) {
  console.log("Installing cross-platform native packages...")
  await $`bun install --os="*" --cpu="*" @opentui/core@${pkg.dependencies["@opentui/core"]}`
  await $`bun install --os="*" --cpu="*" @parcel/watcher@${pkg.dependencies["@parcel/watcher"]}`
}

// ── Build ─────────────────────────────────────────────────────────────────────

const distName = "closecode-windows-x64"
const outDir = path.join(dir, "dist", distName)
console.log(`\nBuilding ${distName}...`)
await $`rm -rf ${outDir}`
await $`mkdir -p ${outDir}/bin`

const localPath = path.resolve(dir, "node_modules/@opentui/core/parser.worker.js")
const rootPath = path.resolve(dir, "../../node_modules/@opentui/core/parser.worker.js")
const parserWorker = fs.realpathSync(fs.existsSync(localPath) ? localPath : rootPath)
const workerPath = "./src/cli/cmd/tui/worker.ts"

await Bun.build({
  conditions: ["browser"],
  tsconfig: "./tsconfig.json",
  plugins: [plugin],
  external: ["node-gyp"],
  format: "esm",
  minify: true,
  splitting: true,
  compile: {
    autoloadBunfig: false,
    autoloadDotenv: false,
    autoloadTsconfig: true,
    autoloadPackageJson: true,
    target: "bun-windows-x64",
    outfile: `dist/${distName}/bin/closecode`, // Bun appends .exe for Windows targets
    execArgv: [`--user-agent=closecode/${Script.version}`, "--use-system-ca", "--"],
    windows: {},
  },
  files: embeddedFileMap ? { "opencode-web-ui.gen.ts": embeddedFileMap } : {},
  entrypoints: ["./src/index.ts", parserWorker, workerPath, ...(embeddedFileMap ? ["opencode-web-ui.gen.ts"] : [])],
  define: {
    OPENCODE_VERSION: `'${Script.version}'`,
    OPENCODE_MIGRATIONS: JSON.stringify(migrations),
    OTUI_TREE_SITTER_WORKER_PATH: "B:/~BUN/root/" + path.relative(dir, parserWorker).replaceAll("\\", "/"),
    OPENCODE_WORKER_PATH: workerPath,
    OPENCODE_CHANNEL: `'${Script.channel}'`,
    OPENCODE_LIBC: "",
  },
})

await $`rm -rf ${outDir}/bin/tui`

// ── Bundle skills ─────────────────────────────────────────────────────────────

console.log("\nBundling skills...")
const skillsSrc = path.join(__dirname, "skills-bundle")
const skillsDst = path.join(outDir, "skills")
await $`cp -r ${skillsSrc} ${skillsDst}`
console.log(`Skills bundled: ${fs.readdirSync(skillsDst).join(", ")}`)

// ── Sample opencode.json ──────────────────────────────────────────────────────

const sampleConfig = {
  $schema: "https://opencode.ai/config.json",
  provider: {
    "openai-compatible": {
      name: "사내 LLM",
      options: {
        baseURL: "https://your-internal-llm.company.com/v1",
        apiKey: "your-api-key",
      },
      models: {
        "your-model-id": {
          name: "사내 모델",
          contextLength: 128000,
        },
      },
    },
  },
  model: "openai-compatible/your-model-id",
  skills: {
    paths: ["./skills"],
  },
}
await Bun.write(path.join(outDir, "opencode.json.example"), JSON.stringify(sampleConfig, null, 2))

// ── Copy README ───────────────────────────────────────────────────────────────

const readmeSrc = path.join(dir, "../../README.onpremise.ko.md")
if (fs.existsSync(readmeSrc)) {
  await $`cp ${readmeSrc} ${outDir}/README.ko.md`
}

// ── Zip ───────────────────────────────────────────────────────────────────────

const zipName = `${distName}.zip`
const zipPath = path.join(dir, "dist", zipName)
console.log(`\nCreating ${zipName}...`)
await $`rm -f ${zipPath}`
await $`zip -r ${zipPath} ${distName}`.cwd(path.join(dir, "dist"))
console.log(`Archive: dist/${zipName}`)

// ── GitHub Release ────────────────────────────────────────────────────────────

if (doRelease) {
  console.log(`\nPublishing GitHub release ${releaseTag}...`)
  const repo = process.env.GH_REPO ?? process.env.GITHUB_REPOSITORY
  const repoArgs = repo ? ["--repo", repo] : []

  // Create release if it doesn't exist
  try {
    await $`gh release create ${releaseTag} --title ${"closecode " + releaseTag} --notes "On-premise Windows x64 build" ${repoArgs}`.quiet()
    console.log(`Release ${releaseTag} created.`)
  } catch {
    console.log(`Release ${releaseTag} already exists, uploading to it.`)
  }

  await $`gh release upload ${releaseTag} ${zipPath} --clobber ${repoArgs}`
  console.log(`Uploaded ${zipName} to release ${releaseTag}.`)
}

// ── Done ──────────────────────────────────────────────────────────────────────

console.log(`
Done!
  Binary : dist/${distName}/bin/closecode.exe
  Skills : dist/${distName}/skills/
  Config : dist/${distName}/opencode.json.example
  Archive: dist/${zipName}

Windows Git Bash usage:
  export OPENAI_API_KEY=your-key
  ./closecode.exe
`)
