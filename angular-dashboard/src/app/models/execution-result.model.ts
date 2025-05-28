export interface ExecutionResultDTO {
    id?: number; // Ajouté
    scriptId?: number;
    scriptTitle?: string;
    output: string;
    error?: string;
    status:  string;
    executionTime?: number;
    timestamp?: string | Date;
    createdBy?: string;
  }
  