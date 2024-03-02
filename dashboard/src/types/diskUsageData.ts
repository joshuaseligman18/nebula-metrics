export interface DiskUsageData {
    totalDiskSpace: number;
    diskUsage: {
      name: string;
      space: number;
      available: number;
      fs_type: string;
      mount: string;
    }[];
  }
  