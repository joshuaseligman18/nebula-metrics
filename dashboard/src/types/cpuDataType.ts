export type CpuData = {
  cpu_core: string;
  mhz: number;
  timestamp: number;
  total_cache: number;
  usage: number;
};

export type NewCpuData = {
  cpu_core: string;
  mhz: number;
  timestamp: Date;
  total_cache: number;
  usage: number;
};
