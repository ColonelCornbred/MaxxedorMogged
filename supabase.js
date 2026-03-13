import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://oekeytcwebhyibguetpa.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9la2V5dGN3ZWJoeWliZ3VldHBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMjg0MTMsImV4cCI6MjA4ODkwNDQxM30.M8h5ndYwxb22RZh6gx_0JDkjhYXH5uVXTdeoPOOAbCI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});