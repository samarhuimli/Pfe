export interface ExecutionLog {
  id: number;
  message: string;
  timestamp: string;  // Ou Date si vous faites la conversion
  executionType: 'R' | 'PYTHON' | string;
}