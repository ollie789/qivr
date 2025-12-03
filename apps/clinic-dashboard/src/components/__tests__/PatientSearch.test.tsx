import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider, createTheme } from "@mui/material";

// Simple search input component for testing
const PatientSearchInput = ({
  onSearch,
  placeholder = "Search patients...",
}: {
  onSearch: (query: string) => void;
  placeholder?: string;
}) => {
  return (
    <input
      type="text"
      placeholder={placeholder}
      onChange={(e) => onSearch(e.target.value)}
      data-testid="patient-search"
    />
  );
};

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

describe("PatientSearchInput", () => {
  it("renders with placeholder", () => {
    const onSearch = vi.fn();
    renderWithTheme(<PatientSearchInput onSearch={onSearch} />);

    expect(screen.getByPlaceholderText("Search patients...")).toBeInTheDocument();
  });

  it("calls onSearch when typing", async () => {
    const onSearch = vi.fn();
    const user = userEvent.setup();
    renderWithTheme(<PatientSearchInput onSearch={onSearch} />);

    const input = screen.getByTestId("patient-search");
    await user.type(input, "John");

    expect(onSearch).toHaveBeenCalled();
    expect(onSearch).toHaveBeenLastCalledWith("John");
  });

  it("accepts custom placeholder", () => {
    const onSearch = vi.fn();
    renderWithTheme(
      <PatientSearchInput onSearch={onSearch} placeholder="Find a patient" />
    );

    expect(screen.getByPlaceholderText("Find a patient")).toBeInTheDocument();
  });
});
