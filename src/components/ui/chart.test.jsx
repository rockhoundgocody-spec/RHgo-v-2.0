import { describe, it, expect, beforeAll } from "vitest"
import * as React from "react"
import { renderToStaticMarkup } from "react-dom/server"

beforeAll(() => {
  if (typeof window === "undefined") {
    globalThis.window = {
      self: 1,
      top: 2,
    }
  }
})

describe("ChartStyle component", () => {
  it("renders CSS custom properties correctly for valid configs", async () => {
    const { ChartStyle } = await import("./chart")
    const config = {
      desktop: {
        label: "Desktop",
        color: "#2563eb",
      },
      mobile: {
        label: "Mobile",
        theme: {
          light: "#60a5fa",
          dark: "#1e40af",
        },
      },
    }

    const html = renderToStaticMarkup(<ChartStyle id="test-chart" config={config} />)

    expect(html).toContain("<style>")
    expect(html).toContain("[data-chart=test-chart]")
    expect(html).toContain("--color-desktop: #2563eb;")
    expect(html).toContain("--color-mobile: #60a5fa;")
    expect(html).toContain(".dark [data-chart=test-chart]")
    expect(html).toContain("--color-mobile: #1e40af;")
  })

  it("sanitizes malicious characters in id, keys, and color values to prevent CSS/HTML injection", async () => {
    const { ChartStyle } = await import("./chart")
    const maliciousConfig = {
      "validKey": {
        color: "#123456; } </style><script>alert('xss')</script>",
      },
      "malicious<key>": {
        color: "blue",
      },
      "another'key": {
        color: "red",
      },
    }

    const html = renderToStaticMarkup(
      <ChartStyle id="chart-<script>alert(1)</script>" config={maliciousConfig} />
    )

    // Extract content inside the <style>...</style> tag
    const styleContent = html.replace(/^<style>/, "").replace(/<\/style>$/, "")

    // Dangerous color containing </style> and semicolons must be ignored in CSS content
    expect(styleContent).not.toContain("alert('xss')")
    expect(styleContent).not.toContain("</style>")

    // Sanitized id should only contain alphanumeric/underscores/hyphens
    expect(styleContent).toContain("[data-chart=chart-scriptalert1script]")

    // Keys with special characters should be sanitized to alphanumeric/underscores/hyphens
    expect(styleContent).toContain("--color-maliciouskey: blue;")
    expect(styleContent).toContain("--color-anotherkey: red;")
  })

  it("returns empty/null markup when no valid colors or keys exist", async () => {
    const { ChartStyle } = await import("./chart")
    const invalidConfig = {
      test: {
        color: "</style><script>alert(1)</script>",
      },
    }

    const html = renderToStaticMarkup(<ChartStyle id="test" config={invalidConfig} />)
    expect(html).toBe("")
  })
})
