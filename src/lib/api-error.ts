/**
 * Standardized API error handling utilities for production.
 * Provides consistent error responses across all API routes.
 */

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Pre-defined error factories for common HTTP errors
export const ApiErrors = {
  badRequest: (message = 'Requête invalide', details?: Record<string, unknown>) =>
    new ApiError(message, 400, 'BAD_REQUEST', details),

  unauthorized: (message = 'Non autorisé') =>
    new ApiError(message, 401, 'UNAUTHORIZED'),

  forbidden: (message = 'Accès interdit') =>
    new ApiError(message, 403, 'FORBIDDEN'),

  notFound: (message = 'Ressource non trouvée') =>
    new ApiError(message, 404, 'NOT_FOUND'),

  conflict: (message = 'Conflit de données', details?: Record<string, unknown>) =>
    new ApiError(message, 409, 'CONFLICT', details),

  rateLimited: (message = 'Trop de requêtes. Veuillez réessayer plus tard.') =>
    new ApiError(message, 429, 'RATE_LIMITED'),

  internal: (message = 'Erreur interne du serveur') =>
    new ApiError(message, 500, 'INTERNAL_ERROR'),

  serviceUnavailable: (message = 'Service temporairement indisponible') =>
    new ApiError(message, 503, 'SERVICE_UNAVAILABLE'),
} as const;

/**
 * Format a successful API response
 */
export function apiSuccess<T>(data: T, meta?: Record<string, unknown>) {
  const response: { success: true; data: T; meta?: Record<string, unknown> } = {
    success: true,
    data,
  };
  if (meta) response.meta = meta;
  return Response.json(response);
}

/**
 * Format an error API response
 */
export function apiError(error: unknown): Response {
  // Handle our custom ApiError
  if (error instanceof ApiError) {
    return Response.json(
      {
        success: false,
        error: {
          message: error.message,
          code: error.code,
          ...(process.env.NODE_ENV === 'development' && error.details
            ? { details: error.details }
            : {}),
        },
      },
      { status: error.statusCode }
    );
  }

  // Handle Prisma errors
  if (error && typeof error === 'object' && 'code' in error) {
    const prismaError = error as { code: string; meta?: unknown };
    switch (prismaError.code) {
      case 'P2002':
        return Response.json(
          {
            success: false,
            error: {
              message: 'Ces données existent déjà',
              code: 'DUPLICATE_ENTRY',
            },
          },
          { status: 409 }
        );
      case 'P2025':
        return Response.json(
          {
            success: false,
            error: {
              message: 'Ressource non trouvée',
              code: 'NOT_FOUND',
            },
          },
          { status: 404 }
        );
      case 'P2003':
        return Response.json(
          {
            success: false,
            error: {
              message: 'Référence invalide',
              code: 'INVALID_REFERENCE',
            },
          },
          { status: 400 }
        );
      case 'P2014':
        return Response.json(
          {
            success: false,
            error: {
              message: 'Violation de contrainte requise',
              code: 'REQUIRED_CONSTRAINT_VIOLATION',
            },
          },
          { status: 400 }
        );
      default:
        console.error('[Prisma Error]', prismaError.code, prismaError.meta);
        return Response.json(
          {
            success: false,
            error: {
              message: 'Erreur de base de données',
              code: 'DATABASE_ERROR',
            },
          },
          { status: 500 }
        );
    }
  }

  // Handle Zod validation errors
  if (error && typeof error === 'object' && 'issues' in error) {
    const zodError = error as { issues: Array<{ path: (string | number)[]; message: string }> };
    return Response.json(
      {
        success: false,
        error: {
          message: 'Données invalides',
          code: 'VALIDATION_ERROR',
          details: zodError.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        },
      },
      { status: 400 }
    );
  }

  // Handle standard Error
  if (error instanceof Error) {
    console.error('[API Error]', error.message, error.stack);
    return Response.json(
      {
        success: false,
        error: {
          message:
            process.env.NODE_ENV === 'production'
              ? 'Erreur interne du serveur'
              : error.message,
          code: 'INTERNAL_ERROR',
        },
      },
      { status: 500 }
    );
  }

  // Fallback for unknown errors
  console.error('[Unknown Error]', error);
  return Response.json(
    {
      success: false,
      error: {
        message: 'Erreur inattendue',
        code: 'UNKNOWN_ERROR',
      },
    },
    { status: 500 }
  );
}

/**
 * Wrap an API route handler with standardized error handling
 */
export function withErrorHandler(
  handler: (request: Request, context?: unknown) => Promise<Response>
): (request: Request, context?: unknown) => Promise<Response> {
  return async (request: Request, context?: unknown) => {
    try {
      return await handler(request, context);
    } catch (error) {
      return apiError(error);
    }
  };
}
