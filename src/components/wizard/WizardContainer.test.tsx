import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WizardContainer } from "./WizardContainer";
import { useWizardStore } from "../../store/wizardStore";

describe("WizardContainer", () => {
  beforeEach(() => {
    useWizardStore.setState({
      currentStep: 0,
      tableName: "",
      tableType: "OFFLINE",
      columns: [],
    });
  });

  it("renders with store pre-initialized; invalid step 1 data keeps user on step 0", async () => {
    const user = userEvent.setup();
    render(<WizardContainer />);

    expect(screen.getByTestId("step-indicator")).toBeInTheDocument();
    const nextButton = screen.getByRole("button", { name: /next/i });
    expect(nextButton).toBeInTheDocument();

    await user.click(nextButton);

    // Still on step 0 (Basic Info) - validation failed
    expect(useWizardStore.getState().currentStep).toBe(0);
  });

  it("advances to step 1 when step 0 data is valid", async () => {
    const user = userEvent.setup();
    render(<WizardContainer />);

    const tableNameInput = screen.getByLabelText(/table name/i);
    await user.type(tableNameInput, "my_table");

    const offlineRadio = screen.getByRole("radio", { name: /offline/i });
    await user.click(offlineRadio);

    const nextButton = screen.getByRole("button", { name: /next/i });
    await user.click(nextButton);

    expect(useWizardStore.getState().currentStep).toBe(1);
  });
});
