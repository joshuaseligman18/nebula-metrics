import { useQuery, UseQueryResult } from "react-query";

export const useGetProcessData = (
  processId: number,
): UseQueryResult<any, Error> => {
  const apiBaseUrl: string = process.env.VITE_API_SERVER ? process.env.VITE_API_SERVER : '';
  return useQuery(
    ["GetProcessData", processId],
    async () => {
      const response = await fetch(
        `${apiBaseUrl}/api/process/${processId}`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch process data");
      }
      return response.json();
    },
    {
      refetchInterval: 10000,
    },
  );
};
