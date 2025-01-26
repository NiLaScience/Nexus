import { z } from 'zod';

interface ValidationResult<T, R = void> {
  success: boolean;
  data?: T;
  error?: string;
  result?: R;
}

interface FormError {
  field: string;
  message: string;
}

interface FormValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: FormError[];
}

export class FormService {
  /**
   * Validates form data against a Zod schema
   */
  static async validate<T extends z.ZodTypeAny>(
    formData: FormData,
    schema: T
  ): Promise<FormValidationResult<z.infer<T>>> {
    try {
      // Convert FormData to a plain object
      const formObject: Record<string, unknown> = {};
      formData.forEach((value, key) => {
        // Handle arrays (multiple values with same key)
        if (formObject[key]) {
          if (!Array.isArray(formObject[key])) {
            formObject[key] = [formObject[key]];
          }
          (formObject[key] as unknown[]).push(value);
        } else {
          formObject[key] = value;
        }

        // Parse JSON strings
        if (typeof value === 'string' && (value.startsWith('[') || value.startsWith('{'))) {
          try {
            formObject[key] = JSON.parse(value);
          } catch {
            // If parsing fails, keep original value
          }
        }
      });

      // Validate against schema
      const result = await schema.safeParseAsync(formObject);

      if (!result.success) {
        const errors = result.error.errors.map((err: z.ZodError['errors'][number]) => ({
          field: err.path.join('.'),
          message: err.message
        }));
        return { success: false, errors };
      }

      return { success: true, data: result.data };
    } catch (error) {
      return {
        success: false,
        errors: [{
          field: 'form',
          message: error instanceof Error ? error.message : 'Validation failed'
        }]
      };
    }
  }

  /**
   * Handles common form submission patterns
   */
  static async handleSubmission<T extends z.ZodTypeAny, R = void>({
    formData,
    schema,
    onSuccess,
    onError
  }: {
    formData: FormData;
    schema: T;
    onSuccess: (data: z.infer<T>) => Promise<R>;
    onError?: (errors: FormError[]) => void;
  }): Promise<ValidationResult<z.infer<T>, R>> {
    try {
      // Validate form data
      const validationResult = await this.validate(formData, schema);
      
      if (!validationResult.success || !validationResult.data) {
        onError?.(validationResult.errors || [{
          field: 'form',
          message: 'Validation failed'
        }]);
        return { success: false, error: 'Validation failed' };
      }

      // Execute success callback
      const result = await onSuccess(validationResult.data);
      return { success: true, data: validationResult.data, result };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Form submission failed';
      onError?.([{ field: 'form', message: errorMessage }]);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Transforms form data for specific use cases
   */
  static transformFormData(formData: FormData, options: {
    jsonFields?: string[];
    fileFields?: string[];
    arrayFields?: string[];
  }): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    formData.forEach((value, key) => {
      // Handle JSON fields
      if (options.jsonFields?.includes(key)) {
        try {
          result[key] = JSON.parse(value as string);
        } catch {
          result[key] = value;
        }
        return;
      }

      // Handle file fields
      if (options.fileFields?.includes(key)) {
        if (value instanceof File) {
          if (!result[key]) {
            result[key] = [];
          }
          (result[key] as File[]).push(value);
        }
        return;
      }

      // Handle array fields
      if (options.arrayFields?.includes(key)) {
        if (!result[key]) {
          result[key] = [];
        }
        (result[key] as unknown[]).push(value);
        return;
      }

      // Handle regular fields
      result[key] = value;
    });

    return result;
  }
} 