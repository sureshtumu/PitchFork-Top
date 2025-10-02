export const FUNCTION_BASE_URL = import.meta.env.VITE_SUPABASE_FUNCTION_URL!;

if (!FUNCTION_BASE_URL) {
  console.warn("Missing VITE_SUPABASE_FUNCTION_URL environment variable");
}

export type FunctionBaseUrl = string;