import { describe, expect, test } from "bun:test"
import { Flag } from "../src/flag/flag"

describe("Flag on-premise defaults", () => {
  test("OPENCODE_DISABLE_AUTOUPDATE defaults to true", () => {
    expect(Flag.OPENCODE_DISABLE_AUTOUPDATE).toBe(true)
  })

  test("OPENCODE_DISABLE_LSP_DOWNLOAD defaults to true", () => {
    expect(Flag.OPENCODE_DISABLE_LSP_DOWNLOAD).toBe(true)
  })

  test("OPENCODE_DISABLE_MODELS_FETCH defaults to true", () => {
    expect(Flag.OPENCODE_DISABLE_MODELS_FETCH).toBe(true)
  })

  test("OPENCODE_DISABLE_EXTERNAL_SKILLS defaults to true", () => {
    expect(Flag.OPENCODE_DISABLE_EXTERNAL_SKILLS).toBe(true)
  })

  test("OPENCODE_DISABLE_SHARE defaults to true", () => {
    expect(Flag.OPENCODE_DISABLE_SHARE).toBe(true)
  })

  test("OPENCODE_AUTO_SHARE defaults to false", () => {
    expect(Flag.OPENCODE_AUTO_SHARE).toBe(false)
  })

  test("OPENCODE_ALLOWED_PROVIDERS defaults to openai and openai-compatible", () => {
    expect(Flag.OPENCODE_ALLOWED_PROVIDERS).toEqual(["openai", "openai-compatible"])
  })
})
