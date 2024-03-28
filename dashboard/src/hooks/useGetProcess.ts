import { useQuery, UseQueryResult } from "react-query";

export const useGetProcessData = (
  processId: number
): UseQueryResult<any, Error> => {
  return useQuery(
    ["GetProcessData", processId],
    async () => {
      const response = await fetch(
        `http://192.168.1.217:4242/api/process/${processId}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch process data");
      }
      return response.json();
    },
    {
      refetchInterval: 60000,
    }
  );
};
