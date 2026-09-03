import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ExternalLink, Sparkles, Volume2, VolumeX, Play } from 'lucide-react';
import { useCampaigns } from '../../hooks/useCampaigns';
import { SmartImage } from './SmartImage';

export const CampaignPopup: React.FC = () => {
  const { activeCampaign, loading } = useCampaigns();
  const [isOpen, setIsOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!loading && activeCampaign) {
      const hasSeen = sessionStorage.getItem(`seen_campaign_${activeCampaign.id}`);
      if (!hasSeen) {
        const timer = setTimeout(() => {
          setIsOpen(true);
        }, 1200);
        return () => clearTimeout(timer);
      }
    }
  }, [activeCampaign, loading]);

  const handleClose = () => {
    if (activeCampaign) {
      sessionStorage.setItem(`seen_campaign_${activeCampaign.id}`, 'true');
    }
    setIsOpen(false);
  };

  const toggleSound = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  if (!activeCampaign || !isOpen) return null;

  const isVideo = activeCampaign.media_type === 'video' && Boolean(activeCampaign.video_url);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative bg-white rounded-3xl overflow-hidden shadow-2xl max-w-lg w-full max-h-[92vh] flex flex-col border border-gray-100"
          >
            {/* Header com botão fechar */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary to-accent text-white">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-amber-300 animate-pulse" />
                <span className="font-bold text-sm tracking-wide line-clamp-1">
                  {activeCampaign.title || 'Campanha Especial'}
                </span>
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors cursor-pointer"
                title="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            {/* Mídia: Vídeo (até 40s) ou Imagem/Panfleto */}
            <div className="relative overflow-y-auto flex-1 bg-black flex items-center justify-center min-h-[320px]">
              {isVideo ? (
                <div className="relative w-full h-full flex items-center justify-center">
                  <video
                    ref={videoRef}
                    src={activeCampaign.video_url || ''}
                    autoPlay
                    muted={isMuted}
                    playsInline
                    loop
                    controls
                    className="w-full max-h-[68vh] object-contain mx-auto"
                  />
                  {/* Botão de Mutar / Desmutar Flutuante */}
                  <button
                    type="button"
                    onClick={toggleSound}
                    className="absolute bottom-4 right-4 z-10 bg-black/70 hover:bg-black/90 text-white p-2.5 rounded-full backdrop-blur-xs transition-transform hover:scale-110 cursor-pointer shadow-lg"
                    title={isMuted ? 'Ativar som' : 'Silenciar'}
                  >
                    {isMuted ? <VolumeX size={18} className="text-amber-300" /> : <Volume2 size={18} />}
                  </button>
                </div>
              ) : activeCampaign.target_link ? (
                <a
                  href={activeCampaign.target_link}
                  target="_blank"
                  rel="noreferrer"
                  onClick={handleClose}
                  className="block w-full h-full group cursor-pointer relative bg-gray-50"
                >
                  <SmartImage
                    src={activeCampaign.image_url}
                    alt={activeCampaign.title}
                    className="w-full h-auto object-contain max-h-[70vh] mx-auto group-hover:scale-[1.01] transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="bg-primary text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg flex items-center gap-1.5">
                      Acessar Campanha <ExternalLink size={14} />
                    </span>
                  </div>
                </a>
              ) : (
                <SmartImage
                  src={activeCampaign.image_url}
                  alt={activeCampaign.title}
                  className="w-full h-auto object-contain max-h-[70vh] mx-auto bg-gray-50"
                />
              )}
            </div>

            {/* Footer com botão de ação opcional */}
            {activeCampaign.target_link && (
              <div className="p-4 bg-white border-t border-gray-100 flex items-center justify-between gap-3">
                <button
                  onClick={handleClose}
                  className="text-xs font-bold text-gray-500 hover:text-gray-700 px-4 py-2.5 rounded-xl cursor-pointer"
                >
                  Fechar
                </button>
                <a
                  href={activeCampaign.target_link}
                  target="_blank"
                  rel="noreferrer"
                  onClick={handleClose}
                  className="bg-primary hover:bg-accent text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  Ver Detalhes / Chamar no WhatsApp <ExternalLink size={14} />
                </a>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
