export interface ProcessDataType {
    cpu_core: number;
    exec: string;
    is_alive: boolean;
    percent_cpu: number | null;
    pid: number;
    resident_memory: number;
    shared_memory: number;
    start_time: number;
    timestamp: number;
    total_cpu: number;
    virtual_memory: number;
    elapsedTime?: string;
  }