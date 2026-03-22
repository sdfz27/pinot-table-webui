import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { NavigationButtons } from "./NavigationButtons";

describe("NavigationButtons", () => {
  it("disables Back button on step 0", () => {
    render(
      <NavigationButtons
        currentStep={0}
        onBack={() => {}}
        onNext={() => {}}
        isNextDisabled={false}
      />,
    );

    const backButton = screen.getByRole("button", { name: /back/i });
    expect(backButton).toBeDisabled();
  });

  it('shows "Review" label on step 4 (not "Next")', () => {
    render(
      <NavigationButtons
        currentStep={3}
        onBack={() => {}}
        onNext={() => {}}
        isNextDisabled={false}
      />,
    );

    // Step 4 (0-based index 3) is the Ingestion step - Next button says "Review"
    const nextButton = screen.getByRole("button", { name: /review/i });
    expect(nextButton).toBeInTheDocument();
  });
});
