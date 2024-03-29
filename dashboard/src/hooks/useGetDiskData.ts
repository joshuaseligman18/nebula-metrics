import { useQuery, UseQueryResult } from "react-query";

export const useGetDiskData = (): UseQueryResult<any, Error> => {
  return useQuery(
    "GetDiskData",
    async () => {
      const response = await fetch("http://127.0.0.1:4242/api/disks");
      if (!response.ok) {
        throw new Error("Failed to fetch disk data");
      }
      return response.json();
    },
    {
      refetchInterval: 60000,
    },
  );
};
