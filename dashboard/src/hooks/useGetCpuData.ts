import { useQuery, UseQueryResult } from "react-query";

export const useGetCpuData = (): UseQueryResult<any, Error> => {
  return useQuery("GetCpuData", async () => {
    const response = await fetch("http://127.0.0.1:4242/api/cpu-info");
    if (!response.ok) {
      throw new Error("Failed to fetch cpu data");
    }
    return response.json();
  });
};
