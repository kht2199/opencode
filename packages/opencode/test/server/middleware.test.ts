import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { Hono } from "hono"
import { Flag } from "@opencode-ai/core/flag/flag"
import { AuthMiddleware, CorsMiddleware } from "../../src/server/middleware"
import * as Log from "@opencode-ai/core/util/log"

void Log.init({ print: false })

function makeApp(corsWhitelist?: string[]) {
  return new Hono()
    .use(AuthMiddleware)
    .use(CorsMiddleware({ cors: corsWhitelist }))
    .get("/test", (c) => c.json({ ok: true }))
}

describe("AuthMiddleware", () => {
  let originalPassword: string | undefined

  beforeEach(() => {
    originalPassword = Flag.OPENCODE_SERVER_PASSWORD
  })

  afterEach(() => {
    ;(Flag as any).OPENCODE_SERVER_PASSWORD = originalPassword
  })

  test("returns 401 when no password is configured", async () => {
    ;(Flag as any).OPENCODE_SERVER_PASSWORD = undefined
    const app = makeApp()
    const res = await app.request("/test")
    expect(res.status).toBe(401)
  })

  test("returns 401 when wrong credentials are provided", async () => {
    ;(Flag as any).OPENCODE_SERVER_PASSWORD = "secret"
    ;(Flag as any).OPENCODE_SERVER_USERNAME = "opencode"
    const app = makeApp()
    const res = await app.request("/test", {
      headers: { Authorization: `Basic ${btoa("opencode:wrong")}` },
    })
    expect(res.status).toBe(401)
  })

  test("passes when correct credentials are provided", async () => {
    ;(Flag as any).OPENCODE_SERVER_PASSWORD = "secret"
    ;(Flag as any).OPENCODE_SERVER_USERNAME = "opencode"
    const app = makeApp()
    const res = await app.request("/test", {
      headers: { Authorization: `Basic ${btoa("opencode:secret")}` },
    })
    expect(res.status).toBe(200)
  })

  test("passes OPTIONS preflight without credentials", async () => {
    ;(Flag as any).OPENCODE_SERVER_PASSWORD = "secret"
    const app = makeApp()
    const res = await app.request("/test", { method: "OPTIONS" })
    // OPTIONS returns 204 (No Content) for CORS preflight
    expect(res.status).toBe(204)
  })
})

describe("CorsMiddleware", () => {
  test("blocks request from non-whitelisted origin", async () => {
    const app = makeAppWithCors(["http://allowed.internal:3000"])
    const res = await app.request("/test", {
      headers: { Origin: "http://evil.external.com" },
    })
    expect(res.headers.get("access-control-allow-origin")).toBeNull()
  })

  test("allows request from whitelisted origin", async () => {
    const app = makeAppWithCors(["http://allowed.internal:3000"])
    const res = await app.request("/test", {
      headers: { Origin: "http://allowed.internal:3000" },
    })
    expect(res.headers.get("access-control-allow-origin")).toBe("http://allowed.internal:3000")
  })

  test("blocks localhost when not in whitelist", async () => {
    const app = makeAppWithCors(["http://allowed.internal:3000"])
    const res = await app.request("/test", {
      headers: { Origin: "http://localhost:3000" },
    })
    expect(res.headers.get("access-control-allow-origin")).toBeNull()
  })

  test("blocks opencode.ai origin", async () => {
    const app = makeAppWithCors([])
    const res = await app.request("/test", {
      headers: { Origin: "https://app.opencode.ai" },
    })
    expect(res.headers.get("access-control-allow-origin")).toBeNull()
  })

  test("allows multiple whitelisted origins", async () => {
    const whitelist = ["http://frontend.internal:3000", "http://admin.internal:4000"]
    const app = makeAppWithCors(whitelist)

    for (const origin of whitelist) {
      const res = await app.request("/test", { headers: { Origin: origin } })
      expect(res.headers.get("access-control-allow-origin")).toBe(origin)
    }
  })

  test("blocks all origins when whitelist is empty", async () => {
    const app = makeAppWithCors([])
    const res = await app.request("/test", {
      headers: { Origin: "http://anything.com" },
    })
    expect(res.headers.get("access-control-allow-origin")).toBeNull()
  })
})

function makeAppWithCors(whitelist: string[]) {
  return new Hono()
    .use(CorsMiddleware({ cors: whitelist }))
    .get("/test", (c) => c.json({ ok: true }))
}
