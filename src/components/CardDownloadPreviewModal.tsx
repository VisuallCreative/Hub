import React, { useState } from 'react';
import { Download, Copy, Check, X, Share2, Sparkles, Smartphone, ExternalLink } from 'lucide-react';

interface CardDownloadPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  blob?: Blob;
  filename: string;
  nickname: string;
  playerTag: string;
  triggerAudio?: (sound: 'tap' | 'levelUp' | 'pop') => void;
}

export default function CardDownloadPreviewModal({
  isOpen,
  onClose,
  imageUrl,
  blob,
  filename,
  nickname,
  playerTag,
  triggerAudio
}: CardDownloadPreviewModalProps) {
  const [copiedImage, setCopiedImage] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'downloading' | 'done'>('idle');
  const [sharedNative, setSharedNative] = useState(false);

  if (!isOpen || !imageUrl) return null;

  // Compact short share URL
  const cleanTag = encodeURIComponent((playerTag || 'Explorador').replace(/^#/, ''));
  const originUrl = typeof window !== 'undefined' ? window.location.origin : 'https://pkxdcentral.site';
  const shortShareUrl = `${originUrl}/?id=${cleanTag}`;

  // Reliable Direct PNG Download (no target=_blank so browsers trigger file save instead of blank tab)
  const handleDownload = () => {
    setDownloadStatus('downloading');
    try {
      const downloadHref = blob ? URL.createObjectURL(blob) : imageUrl;
      const link = document.createElement('a');
      link.download = filename || 'PKXD_ID.png';
      link.href = downloadHref;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      if (blob) {
        setTimeout(() => URL.revokeObjectURL(downloadHref), 4000);
      }
      setDownloadStatus('done');
      if (triggerAudio) triggerAudio('tap');
      setTimeout(() => setDownloadStatus('idle'), 3000);
    } catch (e) {
      console.warn('Erro ao disparar download:', e);
      setDownloadStatus('done');
    }
  };

  // Native Mobile Share / Save to Gallery API
  const handleSaveToGalleryOrShare = async () => {
    if (!blob) {
      handleDownload();
      return;
    }

    try {
      const file = new File([blob], filename, { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `PKXD ID - ${nickname}`,
          text: 'Meu PKXD ID Oficial no PKXD Central!'
        });
        setSharedNative(true);
        if (triggerAudio) triggerAudio('levelUp');
        setTimeout(() => setSharedNative(false), 2500);
        return;
      }
    } catch (err) {
      console.warn('Native share cancelled or failed:', err);
    }

    handleDownload();
  };

  // Copy Image to Clipboard
  const handleCopyImage = async () => {
    if (!blob) return;
    try {
      if (navigator.clipboard && (window as any).ClipboardItem) {
        const item = new (window as any).ClipboardItem({ 'image/png': blob });
        await navigator.clipboard.write([item]);
        setCopiedImage(true);
        if (triggerAudio) triggerAudio('levelUp');
        setTimeout(() => setCopiedImage(false), 2500);
      }
    } catch (err) {
      console.warn('Clipboard image write not permitted:', err);
    }
  };

  // Copy Short Clean Link
  const handleCopyShortLink = async () => {
    try {
      await navigator.clipboard.writeText(shortShareUrl);
      setCopiedLink(true);
      if (triggerAudio) triggerAudio('tap');
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (err) {
      console.warn('Erro ao copiar link:', err);
    }
  };

  const whatsappMessage = `Olha meu PKXD ID Oficial no PKXD Central!\nNick: ${nickname} (${playerTag})\nPerfil: ${shortShareUrl}`;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 backdrop-blur-sm p-3 sm:p-4 animate-fade-in text-left"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="pkxd-glass-modal rounded-3xl p-5 sm:p-7 w-full max-w-lg relative space-y-4 max-h-[95vh] overflow-y-auto"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 rounded-full cursor-pointer transition-colors"
          title="Fechar"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-2xl bg-[#FFFBEB] border-2 border-amber-200 text-amber-600 flex items-center justify-center mx-auto mb-2">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="font-display font-bold text-xl text-slate-900">
            Seu PKXD ID Está Pronto!
          </h3>
          <p className="text-xs sm:text-sm text-slate-600">
            Cartão em alta definição gerado para <strong className="text-slate-900">{nickname}</strong> ({playerTag})
          </p>
        </div>

        {/* Card Image Preview */}
        <div className="relative rounded-2xl overflow-hidden border-2 border-slate-200 bg-slate-950 shadow-inner max-w-md mx-auto">
          <img
            src={imageUrl}
            alt={`PKXD ID ${nickname}`}
            className="w-full h-auto object-contain"
          />
        </div>

        {/* Clear Touch / Mobile Guidance */}
        <div className="p-3.5 bg-[#EFF8FF] rounded-2xl border border-sky-200 text-xs text-slate-700 space-y-1">
          <p className="flex items-center gap-1.5 font-extrabold text-sky-900">
            <Smartphone className="w-4 h-4 text-[#0284C7] shrink-0" />
            <span>Como salvar no celular ou computador:</span>
          </p>
          <p className="pl-5 leading-relaxed">
            • <strong>No Celular:</strong> Toque em <strong>&ldquo;Salvar na Galeria&rdquo;</strong> ou pressione a imagem acima e escolha <em>&ldquo;Fazer download da imagem&rdquo;</em>.
          </p>
          <p className="pl-5 leading-relaxed">
            • <strong>No Computador:</strong> Clique em <strong>&ldquo;Baixar Imagem (PNG)&rdquo;</strong> para salvar direto nos seus arquivos.
          </p>
        </div>

        {/* Main Action Buttons Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          <button
            onClick={handleDownload}
            className="pkxd-btn-primary w-full py-3 px-3 text-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            {downloadStatus === 'done' ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
            <span>
              {downloadStatus === 'downloading'
                ? 'Salvando...'
                : downloadStatus === 'done'
                ? 'Arquivo Baixado!'
                : 'Baixar Imagem (PNG)'}
            </span>
          </button>

          <button
            onClick={handleSaveToGalleryOrShare}
            className="pkxd-btn-cyan w-full py-3 px-3 text-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            {sharedNative ? <Check className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
            <span>{sharedNative ? 'Compartilhado!' : 'Salvar na Galeria'}</span>
          </button>

          {blob && typeof window !== 'undefined' && (window as any).ClipboardItem && (
            <button
              onClick={handleCopyImage}
              className="pkxd-btn-outline w-full py-2.5 px-3 text-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              {copiedImage ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-[#6D28D9]" />}
              <span>{copiedImage ? 'Imagem Copiada!' : 'Copiar Imagem'}</span>
            </button>
          )}

          <a
            href={imageUrl}
            download={filename || 'PKXD_ID.png'}
            target="_blank"
            rel="noopener noreferrer"
            className={`pkxd-btn-outline w-full py-2.5 px-3 text-xs flex items-center justify-center gap-2 ${
              blob && typeof window !== 'undefined' && (window as any).ClipboardItem ? '' : 'sm:col-span-2'
            }`}
          >
            <ExternalLink className="w-4 h-4 text-[#0284C7]" />
            <span>Abrir Imagem Completa</span>
          </a>

          <a
            href={`https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappMessage)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 bg-[#ECFDF5] hover:bg-emerald-100 text-emerald-800 font-sans font-extrabold text-xs uppercase tracking-wider rounded-2xl transition-colors flex items-center justify-center gap-2 sm:col-span-2 border-2 border-emerald-300"
          >
            <Share2 className="w-4 h-4 text-[#25D366]" />
            <span>Compartilhar no WhatsApp (Link Curto)</span>
          </a>
        </div>

        {/* Clean Short Link Bar */}
        <div className="pt-3 border-t-2 border-slate-100 flex items-center justify-between gap-2 text-xs">
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-sans text-slate-500 uppercase block font-extrabold">
              Link Curto para Compartilhar:
            </span>
            <span className="font-mono text-xs text-[#0284C7] truncate block font-bold">
              {shortShareUrl}
            </span>
          </div>
          <button
            onClick={handleCopyShortLink}
            className="pkxd-btn-outline px-3 py-2 text-xs font-extrabold flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Copiado!' : 'Copiar'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
