import { useQuery, UseQueryResult } from "react-query";

export const useGetMemoryData = (): UseQueryResult<any, Error> => {
  return useQuery(
    "GetMemoryData",
    async () => {
      const response = await fetch("http://127.0.0.1:4242/api/memory");
      if (!response.ok) {
        throw new Error("Failed to fetch disk data");
      }
      return response.json();
    },
    {
      refetchInterval: 60000,
    }
  );
};
