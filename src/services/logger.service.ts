// backend/src/services/logger.service.ts
// Serviço de logging

export class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  private format(level: string, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] [${this.context}] ${message}`;
  }

  info(message: string, data?: any): void {
    console.log(this.format('INFO', message));
    if (data) console.log(data);
  }

  warn(message: string, data?: any): void {
    console.warn(this.format('WARN', message));
    if (data) console.warn(data);
  }

  error(message: string, error?: any): void {
    console.error(this.format('ERROR', message));
    if (error) {
      if (error instanceof Error) {
        console.error(error.message);
        console.error(error.stack);
      } else {
        console.error(error);
      }
    }
  }

  debug(message: string, data?: any): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(this.format('DEBUG', message));
      if (data) console.debug(data);
    }
  }
}


// ============================================
// Tipos TypeScript

export interface CreateTicketInput {
  title: string;
  description: string;
  category?: string;
  priority?: string;
  requesterName: string;
  requesterEmail: string;
}

export interface UpdateTicketInput {
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  assignedToId?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}