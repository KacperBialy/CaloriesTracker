import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "../button";

describe("Button Component", () => {
  it("renders button with text", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button", { name: /click me/i })).toBeInTheDocument();
  });

  it("handles click events", async () => {
    const user = userEvent.setup();
    let clicked = false;
    const handleClick = () => {
      clicked = true;
    };

    render(<Button onClick={handleClick}>Click me</Button>);

    const button = screen.getByRole("button", { name: /click me/i });
    await user.click(button);

    expect(clicked).toBe(true);
  });

  it("applies variant styles correctly", () => {
    const { rerender } = render(<Button variant="default">Default</Button>);
    let button = screen.getByRole("button");
    expect(button.className).toContain("bg-primary");

    rerender(<Button variant="destructive">Destructive</Button>);
    button = screen.getByRole("button");
    expect(button.className).toContain("bg-destructive");

    rerender(<Button variant="outline">Outline</Button>);
    button = screen.getByRole("button");
    expect(button.className).toContain("border");
  });

  it("applies size styles correctly", () => {
    const { rerender } = render(<Button size="default">Default</Button>);
    let button = screen.getByRole("button");
    expect(button.className).toContain("h-9");

    rerender(<Button size="sm">Small</Button>);
    button = screen.getByRole("button");
    expect(button.className).toContain("h-8");

    rerender(<Button size="lg">Large</Button>);
    button = screen.getByRole("button");
    expect(button.className).toContain("h-10");
  });

  it("can be disabled", () => {
    render(<Button disabled>Disabled</Button>);
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });

  it("renders as child when asChild is true", () => {
    render(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>
    );

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/test");
  });
});
