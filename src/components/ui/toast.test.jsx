import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, it, expect } from "vitest";
import { ToastClose } from "./toast";

describe("ToastClose", () => {
  it("renders with aria-label='Close notification'", () => {
    const html = renderToStaticMarkup(<ToastClose />);
    expect(html).toContain('aria-label="Close notification"');
  });
});
