import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import App from "./App";

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe("App", () => {
  it("renders root title", () => {
    render(<App />, { wrapper });
    expect(screen.getByRole("heading", { name: /pinot/i })).toBeInTheDocument();
  });

  it("renders wizard-root when wrapped with providers", () => {
    render(<App />, { wrapper });
    expect(screen.getByTestId("wizard-root")).toBeInTheDocument();
  });
});
