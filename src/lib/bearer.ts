export function bearerHeader(token: string | null): string | null {
  if (!token) return null;
  return `Bearer ${token}`;
}
