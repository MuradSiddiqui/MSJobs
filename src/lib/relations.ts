export function companyName(value: unknown): string {
  if (!value) return "Company";
  if (Array.isArray(value)) {
    const first = value[0] as { name?: string } | undefined;
    return first?.name ?? "Company";
  }
  if (typeof value === "object" && value !== null && "name" in value) {
    return String((value as { name?: string }).name ?? "Company");
  }
  return "Company";
}

export function asArray<T>(value: T | T[] | null | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}
