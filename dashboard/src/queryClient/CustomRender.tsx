import { QueryClient, QueryClientProvider } from "react-query";
import { render, RenderResult } from "@testing-library/react";

// Define RenderResult interface
export interface RenderResultWithData extends RenderResult {
  result: {
    current: {
      state: {
        latestProcesses: any[]; // Update the type based on your state structure
      };
      processData: () => void; // Update the type based on your component's logic
    };
  };
}

const queryClient = new QueryClient();

export const customRender = (ui: React.ReactElement, options?: any): RenderResultWithData => {
  const result = render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>, options);

  return {
    ...result,
    result: {
      ...result,
      current: {
        state: {
          latestProcesses: [], // Initialize with the appropriate type and initial data
        },
        processData: () => {}, // Add the function that triggers data processing in your component
      },
    },
  };
};
