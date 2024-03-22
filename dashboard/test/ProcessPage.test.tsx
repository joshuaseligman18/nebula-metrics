import { render, act, fireEvent, screen } from "@testing-library/react";
import ProcessPage from "../src/pages/ProcessPage";
import { ModeProvider } from "../src/context/ModeContext";
import { useAllProcesses } from "../src/hooks/useGetAllProcesses";
import { useGetProcessData } from "../src/hooks/useGetProcess";
import "@testing-library/jest-dom";

jest.mock("../src/hooks/useGetAllProcesses");
jest.mock("../src/hooks/useGetProcess");

describe("ProcessPage Component Logic", () => {
  const mockAllProcessesData = [
    { pid: 1, name: "Process 1" },
    { pid: 2, name: "Process 2" },
  ];

  const mockProcessData = [
    {
      timestamp: 1,
      percent_cpu: 10,
      virtual_memory: 1024,
      resident_memory: 512,
    },
    {
      timestamp: 2,
      percent_cpu: 20,
      virtual_memory: 2048,
      resident_memory: 1024,
    },
  ];

  beforeEach(() => {
    (useAllProcesses as jest.Mock).mockReturnValue({
      data: mockAllProcessesData,
      isLoading: false,
      isError: false,
    });

    (useGetProcessData as jest.Mock).mockReturnValue({
      data: mockProcessData,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
  });

  it("renders ProcessPage and fetches data correctly", async () => {
    await act(async () => {
      render(
        <ModeProvider>
          <ProcessPage />
        </ModeProvider>
      );
    });

    // Verify that the ProcessBar component is rendered
    expect(screen.getByText("Select PID")).toBeInTheDocument();

    // Verify that the CPU Line Graph component is rendered
    expect(screen.getByText("CPU Usage Over Time")).toBeInTheDocument();

    // Verify that the Memory Line Graph component is rendered
    expect(screen.getByText("Memory Usage Over Time")).toBeInTheDocument();
  });

  it("selects a process and fetches process data", async () => {
    await act(async () => {
      render(
        <ModeProvider>
          <ProcessPage />
        </ModeProvider>
      );
    });

    // Simulate user selecting a process
    const selectProcess = screen.getByLabelText("Select PID");
    fireEvent.change(selectProcess, { target: { value: "2" } });

    // Verify that the process data is fetched and displayed correctly
    expect(screen.getByText("CPU Usage Over Time")).toBeInTheDocument();
    expect(screen.getByText("Memory Usage Over Time")).toBeInTheDocument();
  });
});
