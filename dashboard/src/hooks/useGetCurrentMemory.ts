import { useQuery, UseQueryResult } from "react-query";

export const useGetCurrentMemoryData = (): UseQueryResult<any, Error> => {
  const apiBaseUrl: string = import.meta.env.VITE_API_SERVER ? import.meta.env.VITE_API_SERVER : '';
  return useQuery(
    "GetCurrentMemoryData",
    async () => {
        const response = await fetch(`${apiBaseUrl}/api/memory-current`);
      if (!response.ok) {
        throw new Error("Failed to fetch disk data");
      }
      return response.json();
    },
    {
      refetchInterval: 10000,
    },
  );
};
