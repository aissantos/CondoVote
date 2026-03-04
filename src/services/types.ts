export type AppError = { code: string; message: string; context?: unknown };
export type Result<T> = { data: T; error: null } | { data: null; error: AppError };
