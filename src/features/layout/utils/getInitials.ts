export function getInitials(name: string | null | undefined): string {
  if (!name) return "U";
  
  const trimmedName = name.trim();
  if (trimmedName.length === 0) return "U";

  const parts = trimmedName.split(/\s+/);
  
  const firstName = parts[0];

  if (!firstName) return "U";

  if (parts.length === 1) {
    return firstName.substring(0, 2).toUpperCase();
  }

  const firstInitial = firstName[0];
  const lastInitial = parts[parts.length - 1]?.[0] ?? "";

  return (firstInitial + lastInitial).toUpperCase();
}