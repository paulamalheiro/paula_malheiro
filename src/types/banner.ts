export interface Banner {
  id?: string;
  section: string; // 'hero' | 'about' | 'investment' | 'cta' | string
  title?: string | null;
  subtitle?: string | null;
  tag?: string | null;
  image_path: string;
  button_text?: string | null;
  button_link?: string | null;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

export type BannerSection = 'hero' | 'about' | 'investment' | 'cta';

export interface SectionMeta {
  key: string;
  label: string;
  description: string;
  aspectRatio: string;
  recommendedResolution: string;
  defaultImage: string;
  hasTextConfig?: boolean;
}
