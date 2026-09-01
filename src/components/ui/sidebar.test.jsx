import { vi, describe, it, expect, beforeEach } from "vitest"

// Hoisted definition of window and document prior to any imports
vi.hoisted(() => {
  if (typeof globalThis.window === "undefined") {
    const mockWindow = {
      self: {},
      top: {},
      innerWidth: 1024,
      addEventListener: () => {},
      removeEventListener: () => {},
      matchMedia: () => ({
        matches: false,
        addEventListener: () => {},
        removeEventListener: () => {},
      }),
    }
    mockWindow.self = mockWindow
    mockWindow.top = mockWindow
    globalThis.window = mockWindow
  }

  if (typeof globalThis.document === "undefined") {
    globalThis.document = {
      cookie: "",
    }
  }
})

import React from "react"

let stateMap = {}

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useState: (initial) => {
      const callId = Object.keys(stateMap).length
      if (!(callId in stateMap)) {
        stateMap[callId] = {
          value: typeof initial === "function" ? initial() : initial,
          setter: vi.fn((newVal) => {
            stateMap[callId].value = typeof newVal === "function" ? newVal(stateMap[callId].value) : newVal
          }),
        }
      }
      return [stateMap[callId].value, stateMap[callId].setter]
    },
    useCallback: (fn) => fn,
    useMemo: (fn) => fn(),
    useEffect: () => {},
    useContext: vi.fn(),
    createContext: actual.createContext,
    forwardRef: (render) => render,
  }
})

vi.mock("@/hooks/use-mobile", () => ({
  useIsMobile: () => false,
}))

import { SidebarProvider, useSidebar } from "./sidebar"

describe("SidebarProvider cookie security", () => {
  let cookieSetterSpy

  beforeEach(() => {
    stateMap = {}
    cookieSetterSpy = vi.fn()
    Object.defineProperty(globalThis.document, "cookie", {
      get: () => "",
      set: cookieSetterSpy,
      configurable: true,
    })
  })

  it("sets sidebar_state cookie with Secure and SameSite=Lax flags", () => {
    const element = SidebarProvider({ defaultOpen: true, children: null }, null)

    // Simulate Context.Provider by extracting value passed to Provider
    const providerValue = element.props.value

    expect(providerValue).toBeDefined()
    expect(typeof providerValue.setOpen).toBe("function")

    // Call setOpen(false)
    providerValue.setOpen(false)

    expect(cookieSetterSpy).toHaveBeenCalled()
    const lastCookieSet = cookieSetterSpy.mock.calls[cookieSetterSpy.mock.calls.length - 1][0]

    expect(lastCookieSet).toContain("sidebar_state=false")
    expect(lastCookieSet).toContain("path=/")
    expect(lastCookieSet).toContain("max-age=604800")
    expect(lastCookieSet).toContain("Secure")
    expect(lastCookieSet).toContain("SameSite=Lax")
  })
})
