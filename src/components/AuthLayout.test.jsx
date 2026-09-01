import { describe, it, expect } from "vitest";
import AuthLayout from "./AuthLayout";

describe("AuthLayout", () => {
  const DummyIcon = (props) => <svg data-testid="dummy-icon" {...props} />;

  it("renders AuthLayout with title, subtitle, footer, icon and children as a pure component function", () => {
    const tree = AuthLayout({
      icon: DummyIcon,
      title: "Welcome Back",
      subtitle: "Sign in to continue",
      footer: "Need help?",
      children: <div id="test-child">Form Content</div>,
    });

    expect(tree).not.toBeNull();
    expect(tree.type).toBe("div");

    // Serialize tree or inspect structure
    const jsonString = JSON.stringify(tree);
    expect(jsonString).toContain("Welcome Back");
    expect(jsonString).toContain("Sign in to continue");
    expect(jsonString).toContain("Need help?");
    expect(jsonString).toContain("Form Content");
    expect(jsonString).toContain("RockHound");
    expect(jsonString).toContain("GO");
  });

  it("handles optional subtitle and footer when omitted", () => {
    const tree = AuthLayout({
      icon: DummyIcon,
      title: "Create Account",
      children: <div id="register-child">Register Form</div>,
    });

    expect(tree).not.toBeNull();
    const jsonString = JSON.stringify(tree);
    expect(jsonString).toContain("Create Account");
    expect(jsonString).toContain("Register Form");
    expect(jsonString).not.toContain("Need help?");
  });
});
