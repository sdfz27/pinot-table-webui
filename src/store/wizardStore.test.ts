import { describe, it, expect, beforeEach } from "vitest";
import { useWizardStore } from "./wizardStore";

describe("wizardStore", () => {
  beforeEach(() => {
    useWizardStore.getState().reset();
  });

  it("updateBasicInfo sets tableName", () => {
    useWizardStore.getState().updateBasicInfo({ tableName: "events" });
    expect(useWizardStore.getState().tableName).toBe("events");
  });
});
