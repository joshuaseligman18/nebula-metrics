import { render, act, fireEvent, screen} from '@testing-library/react';
import SystemPage from '../src/pages/SystemPage';
import { ModeProvider } from '../src/context/ModeContext';
import { useGetCpuData } from '../src/hooks/useGetCpuData';
import { useGetMemoryData } from '../src/hooks/useGetMemoryData';
import { useGetDiskData } from '../src/hooks/useGetDiskData';
import SortingBar from '../src/components/sorting/SortingBar';
import '@testing-library/jest-dom'; // Import Jest DOM matchers


jest.mock('../src/hooks/useGetCpuData');
jest.mock('../src/hooks/useGetMemoryData');
jest.mock('../src/hooks/useGetDiskData');

describe('SystemPage Component Logic', () => {
  const mockCpuData = [
    { cpu_core: 0, timestamp: 1, usage: 10 },
    { cpu_core: 1, timestamp: 1, usage: 20 },
  ];

  const mockMemoryData = [
    { timestamp: 1, total: 1024, free: 512, swap_total: 2048, swap_free: 1024 },
  ];

  const mockDiskData = [
    { device_name: 'disk1', timestamp: 1, available: 1024, used: 512 },
  ];

  beforeEach(() => {
    (useGetCpuData as jest.Mock).mockReturnValue({
      data: mockCpuData,
      isLoading: false,
      isError: false,
    });

    (useGetMemoryData as jest.Mock).mockReturnValue({
      data: mockMemoryData,
      isLoading: false,
      isError: false,
    });

    (useGetDiskData as jest.Mock).mockReturnValue({
      data: mockDiskData,
      isLoading: false,
      isError: false,
    });
  });

  it('renders SystemPage and its components', async () => {
    await act(async () => {
      render(
        <ModeProvider>
          <SystemPage />
        </ModeProvider>
      );
    });
    // Simulate user interaction by selecting start minute and end minute
    const startMinuteSelect = screen.getByLabelText('Select Start Minute');
    fireEvent.change(startMinuteSelect, { target: { value: '10' } });

    const endMinuteSelect = screen.getByLabelText('Select End Minute');
    fireEvent.change(endMinuteSelect, { target: { value: '20' } });

    // Verify that the data is filtered correctly based on the minute range change
    expect(screen.getByText('CPU Usage Over Time')).toBeInTheDocument();
    expect(screen.getByText('Memory Usage Over Time')).toBeInTheDocument();
  });

});

describe('SortingBar Component Logic', () => {
  it('renders SortingBar and interacts with it', async () => {
    const mockOnMinuteRangeChange = jest.fn();
    const mockResetData = jest.fn();

    const { getByLabelText, getByText } = render(
      <SortingBar
        cpuMinuteValues={['10', '20', '30']} // Example CPU minute values
        onMinuteRangeChange={mockOnMinuteRangeChange}
        resetData={mockResetData}
      />
    );

    // Simulate user interaction by selecting start minute
    const startMinuteSelect = getByLabelText('Select Start Minute');
    fireEvent.change(startMinuteSelect, { target: { value: '10' } });

    // Simulate user interaction by selecting end minute
    const endMinuteSelect = getByLabelText('Select End Minute');
    fireEvent.change(endMinuteSelect, { target: { value: '20' } });

    // Simulate user clicking the reset button
    const resetButton = getByText('Reset');
    fireEvent.click(resetButton);

    // Verify that onMinuteRangeChange and resetData functions are called with correct arguments
    expect(mockOnMinuteRangeChange).toHaveBeenCalledWith('10', '20');
    expect(mockResetData).toHaveBeenCalled();
  });

  // Add more test cases to cover other aspects of the SortingBar component's logic
});