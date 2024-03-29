import { useQuery, UseQueryResult } from "react-query";

export const useAllProcesses = (): UseQueryResult<any, Error> => {
  return useQuery(
    "allProcesses",
    async () => {
      const response = await fetch("http://127.0.0.1:4242/api/allProcesses");
      if (!response.ok) {
        throw new Error("Failed to fetch all processes");
      }
      return response.json();
    },
    {
      refetchInterval: 60000,
    },
  );
};
