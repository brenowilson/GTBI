export type Result<T, E extends Error = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

export const Result = {
  ok<T>(data: T): Result<T, never> {
    return { success: true, data };
  },

  fail<E extends Error>(error: E): Result<never, E> {
    return { success: false, error };
  },
};
