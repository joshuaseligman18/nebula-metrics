import { useQuery, UseQueryResult } from "react-query";

export const useGetCurrentCpuData = (): UseQueryResult<any, Error> => {
  const apiBaseUrl: string = import.meta.env.VITE_API_SERVER ? import.meta.env.VITE_API_SERVER : '';
  return useQuery(
    "GetCurrentCpuData",
    async () => {
      const response = await fetch(
        `${apiBaseUrl}/api/cpu-info-current`,
      );
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
