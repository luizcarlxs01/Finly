import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

function FakeComponent() {
  return <h1>Finly em teste</h1>;
}

describe("testing library", () => {
  it("deve renderizar componente na tela", () => {
    render(<FakeComponent />);

    expect(screen.getByText("Finly em teste")).toBeInTheDocument();
  });
});
