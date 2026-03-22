import { describe, it, expect, vi, beforeEach } from "vitest";
import { copyToClipboard, downloadJson } from "./export";

describe("copyToClipboard", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "navigator",
      { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } },
    );
  });

  it("calls navigator.clipboard.writeText with the expected string", async () => {
    const text = '{"foo":"bar"}';
    await copyToClipboard(text);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(text);
  });
});

describe("downloadJson", () => {
  let createObjectURLSpy: ReturnType<typeof vi.fn>;
  let createElementSpy: ReturnType<typeof vi.fn>;
  let mockLink: { href: string; download: string; click: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    createObjectURLSpy = vi.fn().mockReturnValue("blob:mock-url");
    vi.stubGlobal("URL", {
      createObjectURL: createObjectURLSpy,
      revokeObjectURL: vi.fn(),
    });

    mockLink = {
      href: "",
      download: "",
      click: vi.fn(),
    };
    createElementSpy = vi.fn().mockImplementation((tag: string) => {
      if (tag === "a") return mockLink;
      return document.createElement(tag);
    });
    vi.spyOn(document, "createElement").mockImplementation(createElementSpy);

    const appendChildSpy = vi.fn();
    const removeChildSpy = vi.fn();
    vi.spyOn(document.body, "appendChild").mockImplementation(appendChildSpy);
    vi.spyOn(document.body, "removeChild").mockImplementation(removeChildSpy);
  });

  it("sets download attribute ending with -schema.json when given tableName-based filename", () => {
    downloadJson({ schemaName: "my_table" }, "my_table-schema.json");
    expect(mockLink.download).toBe("my_table-schema.json");
    expect(mockLink.download).toMatch(/-schema\.json$/);
  });
});
