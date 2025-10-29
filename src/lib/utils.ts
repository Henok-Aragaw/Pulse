import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export const VALID_DOMAIN = () => {
  const domains = ['gmail.com', 'outlook.com', 'yahoo.com', 'hotmail.com'];

  if(process.env.NODE_ENV === 'development'){
    domains.push('example.com')
  }

  return domains;
}

export function normalizeName(name: string) {
  return name
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^a-zA-Z\s'-]/g, "")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}