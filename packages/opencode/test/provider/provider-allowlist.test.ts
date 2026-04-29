import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { Effect } from "effect"
import path from "path"
import { Flag } from "@opencode-ai/core/flag/flag"
import { Provider } from "../../src/provider/provider"
import { ProviderID } from "../../src/provider/schema"
import { AppRuntime } from "../../src/effect/app-runtime"
import { tmpdir } from "../fixture/fixture"
import { Instance } from "../../src/project/instance"
import { makeRuntime } from "../../src/effect/run-service"
import { Env } from "../../src/env"
import * as Log from "@opencode-ai/core/util/log"

void Log.init({ print: false })

const envRuntime = makeRuntime(Env.Service, Env.defaultLayer)
const set = (k: string, v: string) => envRuntime.runSync((svc) => svc.set(k, v))

async function list() {
  return AppRuntime.runPromise(
    Effect.gen(function* () {
      const provider = yield* Provider.Service
      return yield* provider.list()
    }),
  )
}

describe("OPENCODE_ALLOWED_PROVIDERS", () => {
  let originalAllowed: string[]

  beforeEach(() => {
    originalAllowed = [...Flag.OPENCODE_ALLOWED_PROVIDERS]
  })

  afterEach(() => {
    ;(Flag as any).OPENCODE_ALLOWED_PROVIDERS = originalAllowed
  })

  test("default allowlist contains only openai and openai-compatible", () => {
    expect(Flag.OPENCODE_ALLOWED_PROVIDERS).toContain("openai")
    expect(Flag.OPENCODE_ALLOWED_PROVIDERS).toContain("openai-compatible")
    expect(Flag.OPENCODE_ALLOWED_PROVIDERS.length).toBe(2)
  })

  test("filters out providers not in allowlist", async () => {
    await using tmp = await tmpdir({
      git: true,
      init: async (dir) => {
        await Bun.write(path.join(dir, "opencode.json"), JSON.stringify({}))
      },
    })
    ;(Flag as any).OPENCODE_ALLOWED_PROVIDERS = ["openai"]

    await Instance.provide({
      directory: tmp.path,
      init: async () => {
        set("OPENAI_API_KEY", "test-key")
        set("ANTHROPIC_API_KEY", "test-key")
      },
      fn: async () => {
        const providers = await list()
        expect(ProviderID.make("openai") in providers).toBe(true)
        expect(ProviderID.make("anthropic") in providers).toBe(false)
      },
    })
  })

  test("allows all providers when allowlist is empty", async () => {
    await using tmp = await tmpdir({
      git: true,
      init: async (dir) => {
        await Bun.write(path.join(dir, "opencode.json"), JSON.stringify({}))
      },
    })
    ;(Flag as any).OPENCODE_ALLOWED_PROVIDERS = []

    await Instance.provide({
      directory: tmp.path,
      init: async () => {
        set("OPENAI_API_KEY", "test-key")
        set("ANTHROPIC_API_KEY", "test-key")
      },
      fn: async () => {
        const providers = await list()
        expect(ProviderID.make("openai") in providers).toBe(true)
        expect(ProviderID.make("anthropic") in providers).toBe(true)
      },
    })
  })

  test("respects custom allowlist with single provider", async () => {
    await using tmp = await tmpdir({
      git: true,
      init: async (dir) => {
        await Bun.write(path.join(dir, "opencode.json"), JSON.stringify({}))
      },
    })
    ;(Flag as any).OPENCODE_ALLOWED_PROVIDERS = ["anthropic"]

    await Instance.provide({
      directory: tmp.path,
      init: async () => {
        set("OPENAI_API_KEY", "test-key")
        set("ANTHROPIC_API_KEY", "test-key")
      },
      fn: async () => {
        const providers = await list()
        expect(ProviderID.make("anthropic") in providers).toBe(true)
        expect(ProviderID.make("openai") in providers).toBe(false)
      },
    })
  })
})
