/** Generic envelope for a successful API response. */
export type ApiResponse<T> = {
  data: T;
};

/** Shape thrown by `apiClient` on a non-2xx response or network failure. */
export type ApiErrorShape = {
  status: number;
  message: string;
};
