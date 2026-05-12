import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Anon Key present:', !!supabaseAnonKey);

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

// Connection state monitoring
let isOnline = navigator?.onLine ?? true;
let retryCount = 0;
const MAX_RETRY_DELAY = 30000; // 30 seconds max

// Monitor connection state
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    isOnline = true;
    retryCount = 0;
    console.log('🟢 Supabase connection restored');
  });

  window.addEventListener('offline', () => {
    isOnline = false;
    console.log('🔴 Supabase connection lost - working offline');
  });

  // Handle page visibility changes to maintain Supabase session
  // Mobile browsers throttle JS timers when page is hidden, breaking autoRefreshToken.
  // When returning to foreground, restart the auto-refresh cycle so Supabase
  // re-validates the token if it expired while in background.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      console.log('📱 App returned to foreground - restarting Supabase auto-refresh');
      supabase.auth.startAutoRefresh();
    }
  });
}

// Enhanced fetch with offline detection and retry
export const fetchWithTimeout = async <T>(
  queryBuilder: any,
  timeoutMs: number = 15000,
  retries: number = 3
): Promise<{ data: T | null; error: any }> => {
  // Check if we're online before making request
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
      
      // Reset retry count on success
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
      
      // Handle timeout/abort errors
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
  
  // Return empty result instead of throwing to prevent app crash
  if (lastError) {
    console.warn('⚠️ Returning empty data after all retries failed');
    return { data: null, error: lastError };
  }
  
  return { data: null, error: lastError };
};
