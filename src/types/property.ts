export type PropertyActionType = 'instagram' | 'gallery' | 'video' | 'dates_modal' | 'empty';
export type PropertyMediaType = 'photos' | 'videos';

export interface Property {
  id: string;
  title: string;
  tag?: string | null;
  location: string;
  description?: string | null;
  image_url: string;
  is_featured: boolean;       // Exibir em "Empreendimentos em Destaque"
  is_construction: boolean;   // Exibir em "Evolução das Obras"
  action_type: PropertyActionType;
  action_url?: string | null;
  media_type?: PropertyMediaType;     // 'photos' (até 10) | 'videos' (até 2)
  gallery_images: string[];           // URLs das fotos
  gallery_videos?: string[];          // URLs dos vídeos da obra (até 2)
  order_index: number;
  created_at?: string;
  updated_at?: string;
}

export type CampaignMediaType = 'image' | 'video';

export interface Campaign {
  id: string;
  title: string;
  media_type?: CampaignMediaType;     // 'image' | 'video'
  image_url: string;                  // Imagem principal ou poster do vídeo
  video_url?: string | null;          // URL do arquivo de vídeo ou link
  video_duration?: number | null;     // Duração em segundos (máx 40s)
  target_link?: string | null;
  is_active: boolean;
  created_at?: string;
}
