import { useQuery, UseQueryResult } from "react-query";

export const useAllProcesses = (): UseQueryResult<any, Error> => {
  return useQuery("allProcesses", async () => {
    const response = await fetch("http://192.168.1.217:4242/api/allProcesses");
    if (!response.ok) {
      throw new Error("Failed to fetch all processes");
    }
    return response.json();
  }, {
    refetchInterval: 60000, 
  });
};
