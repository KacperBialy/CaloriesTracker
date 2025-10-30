import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SummaryPanel } from "../SummaryPanel";
import type { SummaryVM } from "@/types";

describe("SummaryPanel Component", () => {
  describe("when goal is not set", () => {
    it("renders summary panel with text", () => {
      const summary: SummaryVM = {
        calories: 100,
        protein: 10,
        fat: 10,
        carbs: 10,
        goal: null,
      };
      render(<SummaryPanel summary={summary} />);
      expect(screen.getByText("Goal not set")).toBeInTheDocument();
    });
  });

  describe("when goal is set", () => {
    it("renders summary panel with text", () => {
      const summary: SummaryVM = {
        calories: 100,
        protein: 10,
        fat: 10,
        carbs: 10,
        goal: 100,
      };
      render(<SummaryPanel summary={summary} />);
      expect(screen.queryByText("Goal not set")).not.toBeInTheDocument();
    });
  });

  describe("when progress is set", () => {
    it("renders summary panel with text", () => {
      const summary: SummaryVM = {
        calories: 100,
        protein: 10,
        fat: 10,
        carbs: 10,
        goal: 100,
        progress: 50,
      };
      render(<SummaryPanel summary={summary} />);
      expect(screen.getByText("50% of daily goal")).toBeInTheDocument();
    });
  });
});
