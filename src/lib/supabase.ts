import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anon Key is missing.');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
   auth: {
     autoRefreshToken: true,
     persistSession: false,
     detectSessionInUrl: false,
     storageKey: 'supabase-auth-token'
   },
   global: {
     headers: {
       'x-application-name': 'gusto-raro-b2b-portal'
     }
   },
   db: {
     timeout: 10000
   }
 });

let isOnline: boolean = true;
let retryCount: number = 0;
const MAX_RETRY_DELAY = 30000;

export const initSupabaseConnectionMonitoring = () => {
  if (typeof window === 'undefined') return;

  isOnline = navigator?.onLine ?? true;
  retryCount = 0;

  window.addEventListener('online', () => {
    isOnline = true;
    retryCount = 0;
    console.log('🟢 Supabase connection restored');
  });

  window.addEventListener('offline', () => {
    isOnline = false;
    console.log('🔴 Supabase connection lost - working offline');
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      console.log('📱 App returned to foreground - restarting Supabase auto-refresh');
      supabase.auth.startAutoRefresh();
    }
  });

  window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
      console.log('📱 App restored from page cache - restarting Supabase auto-refresh');
      supabase.auth.startAutoRefresh();
    }
  });
};

export const fetchWithTimeout = async <T>(
  queryBuilder: any,
  timeoutMs: number = 15000,
  retries: number = 3
): Promise<{ data: T | null; error: any }> => {
  if (!isOnline && retries > 0) {
    console.warn('⚠️ Offline mode - waiting for connection');
    await new Promise(resolve => setTimeout(resolve, 1000));
    return fetchWithTimeout(queryBuilder, timeoutMs, retries - 1);
  }

  let lastError: any = null;

  for (let i = 0; i < retries; i++) {
    const timeoutPromise = new Promise<{ data: T | null; error: any }>((_, reject) => {
      setTimeout(() => reject(new Error(`Request timeout after ${timeoutMs}ms`)), timeoutMs);
    });

    try {
      const queryPromise = queryBuilder.then((result: any) => ({
        data: result.data || result || null,
        error: result.error || null
      }));

      const result = await Promise.race([queryPromise, timeoutPromise]);

      if (!result.error) {
        retryCount = 0;
      }

      if (result && result.error) {
        lastError = result.error;
        if (i < retries - 1) {
          const delay = Math.min(Math.pow(2, i) * 1000, MAX_RETRY_DELAY);
          console.log(`🔄 Retry ${i + 1}/${retries} after ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
      return result;
    } catch (error: any) {
      lastError = error;

      if (error.name === 'AbortError' || error.message?.includes('timeout')) {
        console.warn(`⚠️ Request timeout (attempt ${i + 1}/${retries})`);
        if (i === retries - 1) {
          console.error('❌ Max retries reached - returning cached/empty data');
        }
      }

      if (i < retries - 1) {
        const delay = Math.min(Math.pow(2, i) * 1000, MAX_RETRY_DELAY);
        retryCount++;
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
    }
  }

  if (lastError) {
    console.warn('⚠️ Returning empty data after all retries failed');
    return { data: null, error: lastError };
  }

  return { data: null, error: lastError };
};
