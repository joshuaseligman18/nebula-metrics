import { useQuery, UseQueryResult } from "react-query";
import { ProcessDataType } from "../types/processDataType";

export const useAllProcesses = (): UseQueryResult<ProcessDataType, Error> => {
  const apiBaseUrl: string = process.env.VITE_API_SERVER
    ? process.env.VITE_API_SERVER
    : "";
  return useQuery(
    "allProcesses",
    async () => {
      const response = await fetch(`${apiBaseUrl}/api/allProcesses`);
      if (!response.ok) {
        throw new Error("Failed to fetch all processes");
      }
      return response.json();
    },
    {
      refetchInterval: 10000,
    },
  );
};
