import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "./App";

describe("App", () => {
  it("renders root title", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: /pinot/i })).toBeDefined();
  });
});
