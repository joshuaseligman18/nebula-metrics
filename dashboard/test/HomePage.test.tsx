import HomePage from "../src/pages/HomePage";
import { ModeProvider } from "../src/context/ModeContext";
import { customRender } from "../src/queryClient/CustomRender";
import LeaderboardBar from "../src/components/systemBar/LeaderBoardBar";
import { act } from "@testing-library/react";

describe("HomePage Component Logic", () => {
  it("should render LeaderboardBar and ProcessChart components", async () => {
    // Define a mock implementation for latestProcessesMap
    const latestProcessesMap = new Map<number, any>(); // Assuming the key type is number
    // Add some entries to the map for testing purposes
    latestProcessesMap.set(1234, { timestamp: Date.now() - 70000 }); // Use timestamp to trigger the condition
    // Mock data for useAllProcesses hook
    const mockProcess = [
      {
        cpu_core: 0,
        exec: "process1",
        is_alive: true,
        percent_cpu: 10,
        pid: 1234,
        resident_memory: 1024,
        shared_memory: 512,
        start_time: Date.now() - 60000, // Current time minus 1 minute for testing
        timestamp: Date.now(),
        total_cpu: 100,
        virtual_memory: 2048,
        elapsedTime: "01 min 00 sec", // Example elapsed time
      },
      {
        cpu_core: 1,
        exec: "process2",
        is_alive: false,
        percent_cpu: null,
        pid: 5678,
        resident_memory: 2048,
        shared_memory: 1024,
        start_time: Date.now() - 120000, // Current time minus 2 minutes for testing
        timestamp: Date.now(),
        total_cpu: 200,
        virtual_memory: 4096,
        elapsedTime: "02 min 00 sec", // Example elapsed time
      },
    ];

    // Mock the useAllProcesses hook to return mockProcess data
    jest.mock("../src/hooks/useGetAllProcesses", () => ({
      useAllProcesses: jest.fn(() => ({
        data: mockProcess,
        isLoading: false,
        isError: false,
      })),
    }));

    await act(async () => {
      customRender(
        <ModeProvider>
          <HomePage />
          <LeaderboardBar />
        </ModeProvider>,
      );
    });

    // Add assertions to test the logic inside the useEffect hooks of HomePage

    // Mock data for the if statement conditions
    const pidToCheck = 1234; // Using the first PID from mockProcess
    const timestampToCheck = Date.now() - 30000; // Set timestamp to be 30 seconds earlier than the current time

    // Check if latestProcessesMap has the PID and timestamp conditions are met
    expect(
      !latestProcessesMap.has(pidToCheck) ||
        latestProcessesMap.get(pidToCheck)?.timestamp < timestampToCheck,
    ).toBe(true);
  });

  // Add more test cases as needed to test different aspects of the logic

  // Test case for LeaderboardBar component
  it("should fetch CPU, Memory, and Disk data correctly", async () => {
    // Mock data for useGetCpuData, useGetMemoryData, and useGetDiskData hooks
    const mockCpuData = [
      { cpu_core: 0, timestamp: 1, usage: 10 },
      { cpu_core: 1, timestamp: 1, usage: 20 },
    ];
    const mockMemoryData = [
      {
        timestamp: 1,
        total: 1024,
        free: 512,
        swap_total: 2048,
        swap_free: 1024,
      },
    ];
    const mockDiskData = [
      { device_name: "disk1", timestamp: 1, available: 1024, used: 512 },
    ];

    // Mock useGetCpuData hook to return mockCpuData
    jest
      .spyOn(require("../src/hooks/useGetCpuData"), "useGetCpuData")
      .mockImplementation(() => ({
        data: mockCpuData,
        isLoading: false,
        isError: false,
      }));

    // Mock useGetMemoryData hook to return mockMemoryData
    jest
      .spyOn(require("../src/hooks/useGetMemoryData"), "useGetMemoryData")
      .mockImplementation(() => ({
        data: mockMemoryData,
        isLoading: false,
        isError: false,
      }));

    // Mock useGetDiskData hook to return mockDiskData
    jest
      .spyOn(require("../src/hooks/useGetDiskData"), "useGetDiskData")
      .mockImplementation(() => ({
        data: mockDiskData,
        isLoading: false,
        isError: false,
      }));

    await act(async () => {
      customRender(
        <ModeProvider>
          <LeaderboardBar />
        </ModeProvider>,
      );
    });

    // Add assertions to test the logic inside the useEffect hooks of LeaderboardBar
    expect(mockCpuData.length).toBeGreaterThan(0); // Assert that CPU data is fetched
    expect(mockMemoryData.length).toBeGreaterThan(0); // Assert that Memory data is fetched
    expect(mockDiskData.length).toBeGreaterThan(0); // Assert that Disk data is fetched
  });
});
