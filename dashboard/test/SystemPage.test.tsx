import { render, act } from "@testing-library/react";
import SystemPage from "../src/pages/SystemPage"; // Adjust the import path as needed
import { ModeProvider } from "../src/context/ModeContext";

jest.mock("../src/hooks/useGetCpuData", () => ({
  useGetCpuData: jest.fn(() => ({
    data: [
      { cpu_core: 0, timestamp: 1, usage: 10 },
      { cpu_core: 1, timestamp: 1, usage: 20 },
    ],
    isLoading: false,
    isError: false,
  })),
}));

jest.mock("../src/hooks/useGetMemoryData", () => ({
  useGetMemoryData: jest.fn(() => ({
    data: [
      { timestamp: 1, total: 1024, free: 512, swap_total: 2048, swap_free: 1024 },
    ],
    isLoading: false,
    isError: false,
  })),
}));

jest.mock("../src/hooks/useGetDiskData", () => ({
  useGetDiskData: jest.fn(() => ({
    data: [
      { device_name: "disk1", timestamp: 1, available: 1024, used: 512 },
    ],
    isLoading: false,
    isError: false,
  })),
}));

describe("SystemPage Component Logic", () => {
  it("should render SystemPage and its components", async () => {
    await act(async () => {
      render(<ModeProvider><SystemPage /></ModeProvider>);
    });
    // Add assertions to verify the rendered components and their logic
  });

  // Add more test cases as needed to test different aspects of the logic
});
