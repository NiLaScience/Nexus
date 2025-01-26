export interface ValidationError {
  field?: string;
  message: string;
}

export interface ValidationResult<T> {
  data?: T;
  errors?: ValidationError[];
  success: boolean;
} 