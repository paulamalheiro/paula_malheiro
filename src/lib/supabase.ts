import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

export const getImageUrl = (imagePath: string) => {
  if (!imagePath) return '';
  
  // If it's already a full URL, return it
  if (imagePath.startsWith('http')) return imagePath;

  // If Supabase is configured, use it
  if (supabase) {
    const bucketName = import.meta.env.VITE_SUPABASE_BUCKET_NAME || 'images';
    // Remove leading slash if present
    const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
    const { data } = supabase.storage.from(bucketName).getPublicUrl(cleanPath);
    return data.publicUrl;
  }

  // Fallback to local path
  return imagePath;
};
