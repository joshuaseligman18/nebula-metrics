import { useQuery, UseQueryResult } from "react-query";

export const useAllProcesses = (): UseQueryResult<any, Error> => {
  const apiBaseUrl: string = process.env.VITE_API_SERVER ? process.env.VITE_API_SERVER : '';
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
