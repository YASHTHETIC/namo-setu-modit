import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { isStandalone, isAppInstalled, markAppInstalled } from "./pwa.ts";

describe("PWA Standalone & In-App Download Guards", () => {
  beforeEach(() => {
    // Reset global window mocks if any
    if (typeof globalThis.window !== "undefined") {
      delete (globalThis.window as any).__modit_is_standalone;
      delete (globalThis.window as any).__modit_app_installed;
    }
  });

  it("returns false in non-browser environment without throwing", () => {
    assert.equal(typeof isStandalone(), "boolean");
    assert.equal(typeof isAppInstalled(), "boolean");
  });

  it("accurately detects installed state and standalone guards when flags are set", () => {
    // Setup a simulated window object
    const storage: Record<string, string> = {};
    const mockWindow: any = {
      localStorage: {
        getItem: (k: string) => storage[k] || null,
        setItem: (k: string, v: string) => { storage[k] = v; },
      },
      sessionStorage: {
        getItem: (k: string) => storage[k] || null,
        setItem: (k: string, v: string) => { storage[k] = v; },
      },
      dispatchEvent: () => true,
      matchMedia: () => ({ matches: false }),
      navigator: { userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
      location: { search: "" },
    };
    const mockDoc: any = {
      cookie: "",
      documentElement: {
        classList: {
          contains: (cls: string) => cls === "is-installed" && Boolean(storage["modit_app_installed"]),
          add: () => {},
        },
        getAttribute: (attr: string) => attr === "data-app-installed" && storage["modit_app_installed"] ? "true" : null,
        setAttribute: () => {},
      },
    };

    (globalThis as any).window = mockWindow;
    (globalThis as any).document = mockDoc;

    // Initially not installed
    assert.equal(isAppInstalled(), false);

    // Call markAppInstalled()
    markAppInstalled();

    // Now installed state must be true
    assert.equal(isAppInstalled(), true);
    assert.equal(isStandalone(), true);
    assert.equal(mockWindow.__modit_app_installed, true);
    assert.equal(mockWindow.__modit_is_standalone, true);
    assert.equal(storage["modit_app_installed"], "true");
    assert.equal(storage["modit_is_standalone"], "true");

    // Clean up
    delete (globalThis as any).window;
    delete (globalThis as any).document;
  });
});
