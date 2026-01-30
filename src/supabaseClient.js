import { createClient } from '@supabase/supabase-js';

// Hardcode dulu untuk test (ganti dengan credentials kamu)
const supabaseUrl = 'https://zmkhsgcuuddxewyqhpjn.supabase.co'; // Ganti dengan URL project kamu
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpta2hzZ2N1dWRkeGV3eXFocGpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NjU0MDIsImV4cCI6MjA4NTI0MTQwMn0.X63ql4c0yHcey4lCKFCC2HrW_Sx4j2jdLdLtmtXa5cc'; // Ganti dengan anon key kamu

export const supabase = createClient(supabaseUrl, supabaseAnonKey);