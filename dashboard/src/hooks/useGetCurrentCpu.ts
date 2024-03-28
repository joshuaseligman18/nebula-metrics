import { useQuery, UseQueryResult } from "react-query";

export const useGetCurrentCpuData = (): UseQueryResult<any, Error> => {
  return useQuery(
    "GetCurrentCpuData",
    async () => {
      const response = await fetch("http://192.168.1.217:4242/api/cpu-info-current");
      if (!response.ok) {
        throw new Error("Failed to fetch cpu data");
      }
      return response.json();
    },
    {
      refetchInterval: 60000,
    }
  );
};