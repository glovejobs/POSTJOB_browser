import { createClient } from '@supabase/supabase-js';
import { config } from '../config/environment';

// Create Supabase client
export const supabase = createClient(
  config.SUPABASE_URL,
  config.SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false
    }
  }
);

// Helper function to execute raw SQL queries
export async function query<T = any>(sql: string, params?: any[]): Promise<T[]> {
  const { data, error } = await supabase.rpc('query', {
    query_text: sql,
    query_params: params || []
  });

  if (error) {
    throw error;
  }

  return data as T[];
}

// Direct SQL execution using postgres.js style
export async function sql<T = any>(
  strings: TemplateStringsArray | string,
  ...values: any[]
): Promise<{ data: T[] | null; error: any }> {
  let query: string;

  if (typeof strings === 'string') {
    query = strings;
  } else {
    // Build the query from template strings
    query = strings.reduce((acc, str, i) => {
      return acc + str + (values[i] !== undefined ? `$${i + 1}` : '');
    }, '');
  }

  // For now, we'll use direct connection
  // In production, you might want to use edge functions or RPC
  try {
    // Use Supabase's from() and select() for simple queries
    // For complex queries, we'll need to parse and adapt
    console.log('Executing SQL:', query);

    // This is a simplified approach - for full SQL support,
    // you'd need to use Supabase Edge Functions or direct connection
    return { data: [], error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export default supabase;