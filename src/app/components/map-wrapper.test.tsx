import { render, cleanup, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, afterEach, vi } from "vitest";
import MapWrapper from "./map-wrapper";
import { type MapProps } from "./map";

vi.mock("./map", () => ({
  __esModule: true,
  default: vi.fn(() => <div>Map Component</div>),
}));

const defaultProps: MapProps = {
  points: [{ coordinates: [0, 0], title: "test" }],
  zoom: 1,
};

describe("MapWrapper component", () => {
  // Cleanup after each test
  afterEach(() => {
    cleanup();
  });

  it("should render the details and summary elements", () => {
    const { container } = render(<MapWrapper {...defaultProps} />);
    const details = container.querySelector("details");
    const summary = container.querySelector("summary");
    expect(details).toBeInTheDocument();
    expect(summary).toBeInTheDocument();
  });

  it("should render the Map component when 'open' prop is true", async () => {
    const { getByText } = render(<MapWrapper {...defaultProps} open={true} />);
    await waitFor(() => getByText("Map Component"));
    expect(getByText("Map Component")).toBeInTheDocument();
  });

  it("should not render the Map component when 'open' prop is false initially", () => {
    const { queryByText } = render(
      <MapWrapper {...defaultProps} open={false} />
    );
    expect(queryByText("Map Component")).not.toBeInTheDocument();
  });

  it("should render the Map component when the details element is clicked", async () => {
    const { container, getByText } = render(<MapWrapper {...defaultProps} />);
    const details = container.querySelector("details");
    fireEvent.click(details!);
    await waitFor(() => getByText("Map Component"));
    expect(getByText("Map Component")).toBeInTheDocument();
  });
});
