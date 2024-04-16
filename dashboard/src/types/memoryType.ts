export interface MemoryUsage {
  timestamp: number;
  total: number;
  free: number;
  swap_total: number;
  swap_free: number;
}
[];

export interface NewMemoryUsage {
    time: Date; ram: number; swapped: number
  }


