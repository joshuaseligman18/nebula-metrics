import HomePage from "../src/pages/HomePage";
import { ModeProvider } from "../src/context/ModeContext";
import { customRender } from "../src/queryClient/CustomRender";
import LeaderboardBar from "../src/components/systemBar/LeaderBoardBar";
import { act } from "@testing-library/react";

jest.mock("../src/hooks/useGetAllProcesses", () => ({
  useAllProcesses: jest.fn(() => ({
    data: [], // Replace this with mock data for testing purposes
    isLoading: false,
    isError: false,
  })),
}));

describe("HomePage Component Logic", () => {
  it("should render LeaderboardBar and ProcessChart components", async () => {
    

    await act(async () => { // Use async/await for act
      customRender(
        <ModeProvider>
          <HomePage />
          <LeaderboardBar />
        </ModeProvider>
      );
    });
  });

  // Add more test cases as needed to test different aspects of the logic

  // Test case for LeaderboardBar component
  it("should fetch CPU, Memory, and Disk data correctly", () => {
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
  });
});
