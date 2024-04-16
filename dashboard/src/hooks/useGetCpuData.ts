import { useQuery, UseQueryResult } from "react-query";
import { CpuData } from "../types/cpuDataType";
export const useGetCpuData = (): UseQueryResult<CpuData, Error> => {
  const apiBaseUrl: string = process.env.VITE_API_SERVER
    ? process.env.VITE_API_SERVER
    : "";
  return useQuery(
    "GetCpuData",
    async () => {
      const response = await fetch(`${apiBaseUrl}/api/cpu-info`);
      if (!response.ok) {
        throw new Error("Failed to fetch cpu data");
      }
      return response.json();
    },
    {
      refetchInterval: 10000,
    },
  );
};
