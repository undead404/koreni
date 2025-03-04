import { render, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";
import IndexTableValue from "./index-table-value";

describe("IndexTableValue component", () => {
  // Cleanup after each test
  afterEach(() => {
    cleanup();
  });

  it("should render the table cell element", () => {
    const { container } = render(<IndexTableValue matchedTokens={[]} value="Test value" />);
    const tableCell = container.querySelector("td");
    expect(tableCell).toBeInTheDocument();
  });

  it("should render the value without highlights if no matched tokens", () => {
    const { container } = render(<IndexTableValue matchedTokens={[]} value="Test value" />);
    const tableCell = container.querySelector("td");
    expect(tableCell?.innerHTML).toBe("Test value");
  });

  it("should highlight matched tokens in the value", () => {
    const { container } = render(<IndexTableValue matchedTokens={["Test"]} value="Test value" />);
    const tableCell = container.querySelector("td");
    expect(tableCell?.innerHTML).toContain('<mark class="mark">Test</mark> value');
  });

  it("should handle multiple matched tokens", () => {
    const { container } = render(<IndexTableValue matchedTokens={["Test", "value"]} value="Test value" />);
    const tableCell = container.querySelector("td");
    expect(tableCell?.innerHTML).toContain('<mark class="mark">Test</mark> <mark class="mark">value</mark>');
  });

  it("should be case insensitive when highlighting matched tokens", () => {
    const { container } = render(<IndexTableValue matchedTokens={["test"]} value="Test value" />);
    const tableCell = container.querySelector("td");
    expect(tableCell?.innerHTML).toContain('<mark class="mark">Test</mark> value');
  });
});