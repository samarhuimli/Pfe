export interface Script {
    id?: number;
    title: string;
    content: string;
    createdBy: string;
    createdAt?: string;
    type: 'PYTHON' | 'R' | 'SQL';
  }
  