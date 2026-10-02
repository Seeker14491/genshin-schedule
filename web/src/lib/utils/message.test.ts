import { describe, expect, it } from "vitest";
import { splitMessage } from "./message";

describe("splitMessage", () => {
  it("splits a message into text and placeholders", () => {
    const format = ({ a, b }: { a: string; b: string }) => `Made by ${a} and ${b}.`;

    expect(splitMessage(format, ["a", "b"])).toEqual([
      { text: "Made by " },
      { placeholder: "a" },
      { text: " and " },
      { placeholder: "b" },
      { text: "." },
    ]);
  });

  it("handles placeholders in any order, at the start or end", () => {
    const format = ({ a, b }: { a: string; b: string }) => `${b}: ${a}`;

    expect(splitMessage(format, ["a", "b"])).toEqual([{ placeholder: "b" }, { text: ": " }, { placeholder: "a" }]);
  });
});
