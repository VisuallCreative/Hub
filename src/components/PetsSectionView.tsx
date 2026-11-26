import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  PawPrint,
  Plus,
  Search,
  ShieldAlert,
  Copy,
  Check,
  Repeat2,
  Gift,
  UploadCloud,
  Link2,
  X,
  Trash2,
  CheckCircle2,
  RotateCcw,
  Flag,
  KeyRound,
  Edit3,
  Eye,
  AlertTriangle,
  User,
  AtSign,
  MessageCircle,
  Send,
  HeartHandshake,
  BellRing,
  Bell,
} from 'lucide-react';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase';
import { PetListing, PetListingType, PetListingStatus } from '../types';

const PETS_COLLECTION = 'user_passports';
const PETS_ENTITY_TYPE = 'pet_listing';
const PET_INTEREST_ENTITY_TYPE = 'pet_interest_notification';

interface PetsSectionViewProps {
  currentUser: any;
  isAdmin: boolean;
  playerTag?: string;
  hasPushPermission?: boolean;
  onEnablePush?: () => Promise<'granted' | 'denied' | 'default' | 'unsupported' | void> | void;
  onOpenNotifications?: () => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onAddXP?: (amount: number, reason: string, rewardKey?: string) => void;
  triggerAudio: (type: 'tap' | 'success' | 'levelUp') => void;
}

type FilterMode = 'all' | 'doacao' | 'troca' | 'mine';

const PROHIBITED_SALE_PATTERNS: RegExp[] = [
  /\bvend(o|er|a|as|endo|ido)\b/i,
  /\bcompr(o|ar|a|as|ando)\b/i,
  /\bpix\b/i,
  /\br\$\s*\d*/i,
  /\breais\b/i,
  /\bdinheiro\b/i,
  /\bpag(ar|o|amento)\b/i,
  /\bpre[cç]o\b/i,
  /\bcusta(ndo)?\b/i,
  /\bgift\s*card\b/i,
  /\bmercado\s*pago\b/i,
  /\bpaypal\b/i,
  /\bboleto\b/i,
  /\bdep[oó]sito\b/i,
  /\btransfer[eê]ncia\b/i,
  /\bcart[aã]o\b/i,
  /\bpor\s+\d+\s*(reais|real|rs|r\$|gemas|moedas)\b/i,
];

function detectProhibitedSaleTerm(text: string): boolean {
  if (!text) return false;
  return PROHIBITED_SALE_PATTERNS.some((pattern) => pattern.test(text));
}

function formatRelativeDate(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Agora mesmo';
  if (diffMin < 60) return `Há ${diffMin} min`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `Há ${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Ontem';
  if (diffDays < 7) return `Há ${diffDays} dias`;
  return new Date(timestamp).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  });
}

function parsePlayerTag(tag?: string): { name: string; number: string } {
  if (!tag || !tag.includes('#')) {
    return { name: '', number: '' };
  }
  const [rawName, rawNum] = tag.split('#');
  const cleanName = (rawName || '').trim().slice(0, 32);
  const cleanNum = (rawNum || '').replace(/\D/g, '').slice(0, 8);
  return { name: cleanName, number: cleanNum };
}

function compressPetImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Não foi possível ler o arquivo selecionado.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('O arquivo enviado não é uma imagem válida.'));
      img.onload = () => {
        const maxDim = 720;
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (width > maxDim || height > maxDim) {
          if (width >= height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Erro ao processar a imagem no navegador.'));
          return;
        }
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const qualities = [0.8, 0.7, 0.58, 0.45];
        for (const q of qualities) {
          const dataUrl = canvas.toDataURL('image/jpeg', q);
          if (dataUrl.length <= 320000) {
            resolve(dataUrl);
            return;
          }
        }

        // Last resort downscale for very complex screenshots
        const smallCanvas = document.createElement('canvas');
        smallCanvas.width = Math.max(320, Math.round(width * 0.65));
        smallCanvas.height = Math.max(240, Math.round(height * 0.65));
        const smallCtx = smallCanvas.getContext('2d');
        if (!smallCtx) {
          reject(new Error('Imagem muito grande. Tente escolher uma foto menor.'));
          return;
        }
        smallCtx.fillStyle = '#FFFFFF';
        smallCtx.fillRect(0, 0, smallCanvas.width, smallCanvas.height);
        smallCtx.drawImage(img, 0, 0, smallCanvas.width, smallCanvas.height);
        const fallbackUrl = smallCanvas.toDataURL('image/jpeg', 0.55);
        if (fallbackUrl.length > 345000) {
          reject(new Error('A imagem excedeu o tamanho máximo permitido. Escolha outra foto.'));
          return;
        }
        resolve(fallbackUrl);
      };
      img.src = String(reader.result || '');
    };
    reader.readAsDataURL(file);
  });
}

function PetPhotoFrame({
  src,
  alt,
  className = '',
}: {
  src?: string;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return (
      <div
        className={`w-full h-full bg-gradient-to-br from-[#EDE9FE] via-[#FCE7F3] to-[#FEF9C3] flex flex-col items-center justify-center gap-2 p-4 text-[#2D0859] ${className}`}
      >
        <div className="w-12 h-12 rounded-2xl bg-white border-[2.5px] border-[#120624] flex items-center justify-center">
          <PawPrint className="w-6 h-6 text-[#6D28D9]" />
        </div>
        <span className="text-xs font-bold text-[#2D0859]/80 text-center line-clamp-1">
          {alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={`w-full h-full object-cover ${className}`}
    />
  );
}

export default function PetsSectionView({
  currentUser,
  isAdmin,
  playerTag,
  hasPushPermission = false,
  onEnablePush,
  onOpenNotifications,
  onOpenAuth,
  onAddXP,
  triggerAudio,
}: PetsSectionViewProps) {
  const [listings, setListings] = useState<PetListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Filters & search
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [showCompleted, setShowCompleted] = useState(true);
  const [search, setSearch] = useState('');

  // Clipboard & feedback toast
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [feedbackBanner, setFeedbackBanner] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Publish / Edit Modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPet, setEditingPet] = useState<PetListing | null>(null);
  const [listingType, setListingType] = useState<PetListingType>('doacao');
  const [petName, setPetName] = useState('');
  const [photoMode, setPhotoMode] = useState<'upload' | 'url'>('upload');
  const [petPhotoUrl, setPetPhotoUrl] = useState('');
  const [photoUploading, setPhotoUploading] = useState(false);
  const [ownerName, setOwnerName] = useState('');
  const [ownerTagNumber, setOwnerTagNumber] = useState('');
  const [wantedPet, setWantedPet] = useState('');
  const [notes, setNotes] = useState('');
  const [confirmedNoSale, setConfirmedNoSale] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Detail modal & inline delete confirmation
  const [selectedPet, setSelectedPet] = useState<PetListing | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [busyCardId, setBusyCardId] = useState<string | null>(null);

  // Post-publish notification activation modal & reminder
  const [publishedSuccessPet, setPublishedSuccessPet] = useState<{
    petName: string;
    listingType: PetListingType;
  } | null>(null);
  const [pushActionState, setPushActionState] = useState<
    'idle' | 'requesting' | 'enabled' | 'denied' | 'unsupported'
  >('idle');
  const [dismissedNotifReminder, setDismissedNotifReminder] = useState(false);

  const handleRequestPushActivation = async () => {
    triggerAudio('tap');
    setPushActionState('requesting');
    try {
      if (onEnablePush) {
        const result = await onEnablePush();
        if (result === 'granted') {
          setPushActionState('enabled');
        } else if (result === 'denied') {
          setPushActionState('denied');
        } else if (result === 'unsupported') {
          setPushActionState('unsupported');
        } else {
          setPushActionState('idle');
        }
      } else if (typeof window !== 'undefined' && 'Notification' in window) {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
          triggerAudio('success');
          setPushActionState('enabled');
        } else if (perm === 'denied') {
          setPushActionState('denied');
        } else {
          setPushActionState('idle');
        }
      } else {
        setPushActionState('unsupported');
      }
    } catch {
      setPushActionState('idle');
    }
  };

  // "Eu quero!" interest modal state
  const [wantPet, setWantPet] = useState<PetListing | null>(null);
  const [wantName, setWantName] = useState('');
  const [wantTagNumber, setWantTagNumber] = useState('');
  const [wantContactType, setWantContactType] = useState<'social' | 'whatsapp'>('social');
  const [wantContactValue, setWantContactValue] = useState('');
  const [wantMessage, setWantMessage] = useState('');
  const [wantError, setWantError] = useState<string | null>(null);
  const [isSendingWant, setIsSendingWant] = useState(false);
  const [sentInterestIds, setSentInterestIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('pkxd_sent_pet_interests');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const openWantModal = (pet: PetListing) => {
    triggerAudio('tap');
    const parsed = parsePlayerTag(playerTag || localStorage.getItem('pkxd_player_tag') || '');
    setWantPet(pet);
    setWantName(
      parsed.name ||
        (currentUser?.displayName ? String(currentUser.displayName).split('#')[0].slice(0, 32) : '')
    );
    setWantTagNumber(parsed.number || '');
    setWantContactType('social');
    setWantContactValue('');
    setWantMessage('');
    setWantError(null);
  };

  const handleSubmitWant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wantPet) return;
    setWantError(null);

    const cleanSenderName = wantName.trim();
    const cleanSenderTag = wantTagNumber.replace(/\D/g, '').trim();
    const rawContact = wantContactValue.trim();
    const cleanMessage = wantMessage.trim();

    if (cleanSenderName.length < 2 || cleanSenderName.length > 32) {
      setWantError('Informe seu nome no PK XD (entre 2 e 32 caracteres).');
      return;
    }

    if (!/^[0-9]{1,8}$/.test(cleanSenderTag)) {
      setWantError('Informe os números da sua # no PK XD (ex: 1234).');
      return;
    }

    let formattedContact = rawContact;
    if (wantContactType === 'social') {
      const stripped = rawContact.replace(/^@+/, '').trim();
      if (stripped.length < 2 || stripped.length > 60) {
        setWantError('Informe seu @ corretamente (ex: @seuusuario).');
        return;
      }
      formattedContact = `@${stripped}`;
    } else {
      const digits = rawContact.replace(/\D/g, '');
      if (digits.length < 10 || digits.length > 15) {
        setWantError('Informe seu WhatsApp completo com DDD (ex: (11) 99999-9999).');
        return;
      }
      formattedContact = rawContact;
    }

    if (cleanMessage.length > 160) {
      setWantError('O recado deve ter no máximo 160 caracteres.');
      return;
    }

    if (detectProhibitedSaleTerm(cleanMessage)) {
      setWantError(
        'Vendas são extremamente proibidas! Envie apenas mensagens sobre doação gratuita ou troca de pets.'
      );
      return;
    }

    setIsSendingWant(true);
    try {
      const now = Date.now();
      const notifId = `pet_interest_${now}_${Math.random().toString(36).slice(2, 8)}`;
      const payload = {
        id: notifId,
        entityType: PET_INTEREST_ENTITY_TYPE,
        recipientUserId: wantPet.authorId,
        recipientOwnerTag: `${wantPet.ownerName}#${wantPet.ownerTagNumber}`,
        petId: wantPet.id,
        petName: wantPet.petName,
        petListingType: wantPet.listingType,
        senderUserId: currentUser?.uid || '',
        senderName: cleanSenderName,
        senderTagNumber: cleanSenderTag,
        contactType: wantContactType,
        contactValue: formattedContact,
        message: cleanMessage,
        createdAt: now,
      };

      await setDoc(doc(db, PETS_COLLECTION, notifId), payload);

      setSentInterestIds((prev) => {
        const next = Array.from(new Set([...prev, wantPet.id]));
        try {
          localStorage.setItem('pkxd_sent_pet_interests', JSON.stringify(next));
        } catch {}
        return next;
      });

      triggerAudio('success');
      showNotice(
        'success',
        `Pedido "Eu quero!" enviado nas notificações de ${wantPet.ownerName} #${wantPet.ownerTagNumber}!`
      );
      setWantPet(null);
    } catch (err) {
      console.error('[Pets] Erro ao enviar interesse no pet:', err);
      setWantError('Não foi possível enviar seu pedido agora. Tente novamente em instantes.');
    } finally {
      setIsSendingWant(false);
    }
  };

  const showNotice = (type: 'success' | 'error', text: string) => {
    setFeedbackBanner({ type, text });
    setTimeout(() => {
      setFeedbackBanner((prev) => (prev?.text === text ? null : prev));
    }, 4500);
  };

  // Real-time Firestore listener
  useEffect(() => {
    setLoading(true);
    setLoadError(null);
    const colRef = collection(db, PETS_COLLECTION);
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const items: PetListing[] = snapshot.docs
          .map((docSnap) => {
            const data = docSnap.data() as Partial<PetListing> & { entityType?: string };
            if (data.entityType !== PETS_ENTITY_TYPE) return null;
            return {
              id: data.id || docSnap.id,
              petName: data.petName || 'Pet sem nome',
              petPhotoUrl: data.petPhotoUrl || '',
              listingType: data.listingType === 'troca' ? 'troca' : 'doacao',
              ownerName: data.ownerName || 'Jogador',
              ownerTagNumber: data.ownerTagNumber || '000',
              wantedPet: data.wantedPet || '',
              notes: data.notes || '',
              status: data.status === 'concluido' ? 'concluido' : 'disponivel',
              authorId: data.authorId || '',
              reportsCount: typeof data.reportsCount === 'number' ? data.reportsCount : 0,
              reportedBy: Array.isArray(data.reportedBy) ? data.reportedBy : [],
              createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
              updatedAt: typeof data.updatedAt === 'number' ? data.updatedAt : Date.now(),
            } as PetListing;
          })
          .filter((item): item is PetListing => item !== null)
          .sort((a, b) => b.createdAt - a.createdAt);
        setListings(items);
        setLoading(false);
      },
      (err) => {
        console.error('[Pets] Erro ao carregar anúncios de pets:', err);
        setLoadError('Não foi possível carregar os pets no momento. Tente recarregar a página.');
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Keep selectedPet in sync with live Firestore updates
  useEffect(() => {
    if (!selectedPet) return;
    const updated = listings.find((p) => p.id === selectedPet.id);
    if (!updated) {
      setSelectedPet(null);
    } else {
      setSelectedPet(updated);
    }
  }, [listings, selectedPet]);

  const stats = useMemo(() => {
    const available = listings.filter((p) => p.status === 'disponivel');
    return {
      totalAvailable: available.length,
      donations: available.filter((p) => p.listingType === 'doacao').length,
      trades: available.filter((p) => p.listingType === 'troca').length,
      mineCount: currentUser
        ? listings.filter((p) => p.authorId === currentUser.uid).length
        : 0,
    };
  }, [listings, currentUser]);

  const filteredListings = useMemo(() => {
    const q = search.trim().toLowerCase();
    return listings
      .filter((pet) => {
        if (!showCompleted && pet.status === 'concluido') return false;
        if (filterMode === 'doacao' && pet.listingType !== 'doacao') return false;
        if (filterMode === 'troca' && pet.listingType !== 'troca') return false;
        if (filterMode === 'mine' && (!currentUser || pet.authorId !== currentUser.uid)) {
          return false;
        }
        if (!q) return true;
        const fullTag = `${pet.ownerName}#${pet.ownerTagNumber}`.toLowerCase();
        return (
          pet.petName.toLowerCase().includes(q) ||
          pet.ownerName.toLowerCase().includes(q) ||
          pet.ownerTagNumber.toLowerCase().includes(q) ||
          fullTag.includes(q) ||
          (pet.wantedPet || '').toLowerCase().includes(q) ||
          (pet.notes || '').toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        // Keep available pets first, then newest first
        if (a.status !== b.status) {
          return a.status === 'disponivel' ? -1 : 1;
        }
        return b.createdAt - a.createdAt;
      });
  }, [listings, filterMode, showCompleted, search, currentUser]);

  const openPublishModal = (petToEdit?: PetListing) => {
    triggerAudio('tap');
    setFormError(null);
    if (petToEdit) {
      setEditingPet(petToEdit);
      setListingType(petToEdit.listingType);
      setPetName(petToEdit.petName);
      setPetPhotoUrl(petToEdit.petPhotoUrl);
      setPhotoMode(petToEdit.petPhotoUrl.startsWith('https://') ? 'url' : 'upload');
      setOwnerName(petToEdit.ownerName);
      setOwnerTagNumber(petToEdit.ownerTagNumber);
      setWantedPet(petToEdit.wantedPet || '');
      setNotes(petToEdit.notes || '');
      setConfirmedNoSale(true);
    } else {
      const parsed = parsePlayerTag(playerTag || localStorage.getItem('pkxd_player_tag') || '');
      setEditingPet(null);
      setListingType('doacao');
      setPetName('');
      setPetPhotoUrl('');
      setPhotoMode('upload');
      setOwnerName(parsed.name || (currentUser?.displayName ? String(currentUser.displayName).split('#')[0].slice(0, 32) : ''));
      setOwnerTagNumber(parsed.number || '');
      setWantedPet('');
      setNotes('');
      setConfirmedNoSale(false);
    }
    setIsFormOpen(true);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setFormError('Envie apenas arquivos de imagem (PNG, JPG ou WebP).');
      return;
    }
    setFormError(null);
    setPhotoUploading(true);
    try {
      const compressed = await compressPetImage(file);
      setPetPhotoUrl(compressed);
    } catch (err: any) {
      setFormError(err?.message || 'Erro ao processar a foto do pet.');
    } finally {
      setPhotoUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmitPet = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!currentUser?.uid) {
      setFormError('Entre na sua conta PK XD Central antes de publicar seu pet.');
      return;
    }

    const cleanPetName = petName.trim();
    const cleanOwnerName = ownerName.trim();
    const cleanTagNumber = ownerTagNumber.replace(/\D/g, '').trim();
    const cleanPhoto = petPhotoUrl.trim();
    const cleanWanted = listingType === 'troca' ? wantedPet.trim() : '';
    const cleanNotes = notes.trim();

    if (cleanPetName.length < 2 || cleanPetName.length > 60) {
      setFormError('Informe o nome do pet (entre 2 e 60 caracteres).');
      return;
    }

    if (
      !cleanPhoto ||
      cleanPhoto.length < 10 ||
      cleanPhoto.length > 350000 ||
      (!cleanPhoto.startsWith('https://') &&
        !/^data:image\/(jpeg|jpg|png|webp);base64,/.test(cleanPhoto))
    ) {
      setFormError('Envie uma foto do seu pet ou cole um link seguro (https://...).');
      return;
    }

    if (cleanOwnerName.length < 2 || cleanOwnerName.length > 32) {
      setFormError('Informe seu nome no PK XD (entre 2 e 32 caracteres).');
      return;
    }

    if (!/^[0-9]{1,8}$/.test(cleanTagNumber)) {
      setFormError('Informe apenas os números da sua # no PK XD (ex: 1234).');
      return;
    }

    if (cleanWanted.length > 80) {
      setFormError('O campo de pet desejado na troca deve ter no máximo 80 caracteres.');
      return;
    }

    if (cleanNotes.length > 200) {
      setFormError('Os detalhes extras devem ter no máximo 200 caracteres.');
      return;
    }

    if (
      detectProhibitedSaleTerm(cleanPetName) ||
      detectProhibitedSaleTerm(cleanWanted) ||
      detectProhibitedSaleTerm(cleanNotes)
    ) {
      setFormError(
        'VENDAS SÃO EXTREMAMENTE PROIBIDAS! Remova qualquer menção a venda, dinheiro, Pix, preço, valor ou pagamento para publicar como doação ou troca gratuita.'
      );
      return;
    }

    if (!confirmedNoSale) {
      setFormError(
        'Marque a confirmação declarando que o anúncio é apenas para doação ou troca gratuita (sem venda).'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const now = Date.now();
      if (editingPet) {
        const updatePayload: Record<string, any> = {
          entityType: PETS_ENTITY_TYPE,
          petName: cleanPetName,
          petPhotoUrl: cleanPhoto,
          listingType,
          ownerName: cleanOwnerName,
          ownerTagNumber: cleanTagNumber,
          wantedPet: cleanWanted,
          notes: cleanNotes,
          status: editingPet.status,
          updatedAt: now,
        };
        await updateDoc(doc(db, PETS_COLLECTION, editingPet.id), updatePayload);
        triggerAudio('success');
        showNotice('success', `Anúncio de "${cleanPetName}" atualizado com sucesso!`);
      } else {
        const petId = `pet_${now}_${Math.random().toString(36).slice(2, 8)}`;
        const newPet: PetListing & { entityType: string } = {
          id: petId,
          entityType: PETS_ENTITY_TYPE,
          petName: cleanPetName,
          petPhotoUrl: cleanPhoto,
          listingType,
          ownerName: cleanOwnerName,
          ownerTagNumber: cleanTagNumber,
          wantedPet: cleanWanted,
          notes: cleanNotes,
          status: 'disponivel',
          authorId: currentUser.uid,
          reportsCount: 0,
          reportedBy: [],
          createdAt: now,
          updatedAt: now,
        };
        await setDoc(doc(db, PETS_COLLECTION, petId), newPet);
        triggerAudio('success');
        onAddXP?.(15, `Publicou o pet ${cleanPetName} na seção /pets`, `pet_publish_${petId}`);
        showNotice(
          'success',
          `Pet "${cleanPetName}" publicado para ${listingType === 'doacao' ? 'doação gratuita' : 'troca'}!`
        );
        setPushActionState(hasPushPermission ? 'enabled' : 'idle');
        setPublishedSuccessPet({ petName: cleanPetName, listingType });
      }
      setIsFormOpen(false);
      setEditingPet(null);
    } catch (err: any) {
      console.error('[Pets] Erro ao salvar anúncio de pet:', err);
      setFormError(
        'Não foi possível salvar seu anúncio agora. Verifique sua conexão e se você está conectado na sua conta.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyTag = (pet: PetListing) => {
    triggerAudio('tap');
    const tagString = `${pet.ownerName}#${pet.ownerTagNumber}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(tagString).catch(() => {});
    }
    setCopiedId(pet.id);
    setTimeout(() => {
      setCopiedId((prev) => (prev === pet.id ? null : prev));
    }, 2200);
  };

  const handleToggleStatus = async (pet: PetListing) => {
    if (!currentUser) return;
    triggerAudio('tap');
    const nextStatus: PetListingStatus =
      pet.status === 'disponivel' ? 'concluido' : 'disponivel';
    setBusyCardId(pet.id);
    try {
      await updateDoc(doc(db, PETS_COLLECTION, pet.id), {
        status: nextStatus,
        updatedAt: Date.now(),
      });
      triggerAudio('success');
      showNotice(
        'success',
        nextStatus === 'concluido'
          ? `"${pet.petName}" marcado como ${pet.listingType === 'doacao' ? 'doado' : 'trocado'}!`
          : `"${pet.petName}" reaberto como disponível.`
      );
    } catch (err) {
      console.error('[Pets] Erro ao atualizar status:', err);
      showNotice('error', 'Não foi possível atualizar o status do pet.');
    } finally {
      setBusyCardId(null);
    }
  };

  const handleDeletePet = async (pet: PetListing) => {
    triggerAudio('tap');
    setBusyCardId(pet.id);
    try {
      await deleteDoc(doc(db, PETS_COLLECTION, pet.id));
      setConfirmDeleteId(null);
      if (selectedPet?.id === pet.id) {
        setSelectedPet(null);
      }
      showNotice('success', `Anúncio de "${pet.petName}" removido.`);
    } catch (err) {
      console.error('[Pets] Erro ao excluir pet:', err);
      showNotice('error', 'Não foi possível remover o anúncio.');
    } finally {
      setBusyCardId(null);
    }
  };

  const handleReportSale = async (pet: PetListing) => {
    if (!currentUser?.uid) {
      onOpenAuth('login');
      return;
    }
    if (pet.authorId === currentUser.uid) return;
    if (pet.reportedBy.includes(currentUser.uid)) {
      showNotice('error', 'Você já denunciou este anúncio para revisão da moderação.');
      return;
    }

    triggerAudio('tap');
    setBusyCardId(pet.id);
    try {
      await updateDoc(doc(db, PETS_COLLECTION, pet.id), {
        reportsCount: pet.reportsCount + 1,
        reportedBy: [...pet.reportedBy, currentUser.uid].slice(0, 50),
        updatedAt: Date.now(),
      });
      showNotice(
        'success',
        'Denúncia enviada! A equipe de moderação vai revisar se há tentativa de venda proibida.'
      );
    } catch (err) {
      console.error('[Pets] Erro ao denunciar anúncio:', err);
      showNotice('error', 'Não foi possível registrar a denúncia agora.');
    } finally {
      setBusyCardId(null);
    }
  };

  return (
    <div className="w-full animate-fade-in">
      {/* HERO & FILTER BAND */}
      <section className="pkxd-band-purple py-10 sm:py-14 border-b-[4px] border-[#120624]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
            <div className="space-y-2.5 max-w-2xl">
              <h1 className="pkxd-comic-title text-4xl sm:text-5xl font-bold leading-tight text-balance">
                Pets PK XD: Doação e Troca
              </h1>
              <p className="text-sm sm:text-base text-white/95 font-medium leading-relaxed">
                Encontre um novo lar para seu pet ou combine trocas gratuitas com outros jogadores. Informe o nome do pet, a foto e seu nome com # para receber pedidos de amizade no jogo.
              </p>
              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm font-semibold text-white/85 tabular-nums pt-1">
                <span>{stats.totalAvailable} disponíveis</span>
                <span aria-hidden="true">·</span>
                <span>{stats.donations} para doação</span>
                <span aria-hidden="true">·</span>
                <span>{stats.trades} para troca</span>
              </div>
            </div>

            <button
              id="pets-publish-btn"
              type="button"
              onClick={() => openPublishModal()}
              className="pkxd-btn-gold px-6 py-3 text-sm font-extrabold inline-flex items-center justify-center gap-2 cursor-pointer self-start shrink-0 whitespace-nowrap"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>Publicar meu Pet</span>
            </button>
          </div>

          {/* STRICT ANTI-SALE WARNING BANNER */}
          <div
            role="note"
            aria-label="Regra contra vendas de pets"
            className="rounded-2xl bg-[#FFF1F2] border-[3px] border-[#120624] shadow-[0_4px_0_#16032E] p-4 sm:p-5 text-[#881337] flex items-start gap-3.5"
          >
            <div className="w-10 h-10 rounded-xl bg-[#E11D48] border-2 border-[#120624] text-white flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="space-y-1 text-left">
              <h2 className="font-display font-bold text-base sm:text-lg text-[#881337] leading-snug">
                Vendas são extremamente proibidas
              </h2>
              <p className="text-xs sm:text-sm font-semibold text-[#9F1239] leading-relaxed">
                Este espaço é exclusivamente para <strong>doação gratuita</strong> ou <strong>troca de pets</strong> entre jogadores. É terminantemente proibido vender pets por dinheiro real, Pix, gift cards, moedas ou gemas. Anúncios de venda são removidos imediatamente.
              </p>
            </div>
          </div>

          {/* FEEDBACK BANNER */}
          {feedbackBanner && (
            <div
              role="status"
              className={`rounded-2xl border-[2.5px] border-[#120624] px-4 py-3 text-sm font-bold flex items-center justify-between gap-3 ${
                feedbackBanner.type === 'success'
                  ? 'bg-[#DCFCE7] text-[#14532D]'
                  : 'bg-[#FEE2E2] text-[#991B1B]'
              }`}
            >
              <span>{feedbackBanner.text}</span>
              <button
                type="button"
                onClick={() => setFeedbackBanner(null)}
                className="p-1 rounded-lg hover:bg-black/10 cursor-pointer shrink-0"
                aria-label="Fechar aviso"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* REMINDER BAR FOR PUBLISHERS WITHOUT NOTIFICATIONS ENABLED */}
          {currentUser && stats.mineCount > 0 && !hasPushPermission && !dismissedNotifReminder && (
            <div
              role="region"
              aria-label="Ativar notificações para seus pets"
              className="rounded-2xl bg-[#FEF9C3] border-[3px] border-[#120624] shadow-[0_4px_0_#16032E] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[#120624]"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#F9C826] border-2 border-[#120624] text-[#120624] flex items-center justify-center shrink-0">
                  <BellRing className="w-5 h-5" />
                </div>
                <div className="space-y-0.5 text-left">
                  <h3 className="font-display font-bold text-sm sm:text-base text-[#120624]">
                    Ative as notificações para saber quem quer seu pet!
                  </h3>
                  <p className="text-xs font-semibold text-slate-700 leading-relaxed">
                    Quando alguém clicar em <strong>"Eu quero!"</strong>, enviamos o Nome #, @ ou WhatsApp direto nas suas notificações.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <button
                  type="button"
                  disabled={pushActionState === 'requesting'}
                  onClick={handleRequestPushActivation}
                  className="pkxd-btn-purple px-4 py-2 text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap disabled:opacity-60"
                >
                  <BellRing className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {pushActionState === 'requesting'
                      ? 'Ativando...'
                      : 'Ativar Notificações'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setDismissedNotifReminder(true)}
                  className="p-2 rounded-xl hover:bg-black/10 text-[#120624] cursor-pointer"
                  aria-label="Dispensar lembrete"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* FILTER CONTROLS + SEARCH BAR */}
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between pt-1">
            <div className="flex flex-wrap items-center gap-2">
              {(
                [
                  { id: 'all', label: 'Todos' },
                  { id: 'doacao', label: 'Doação' },
                  { id: 'troca', label: 'Troca' },
                  ...(currentUser
                    ? [{ id: 'mine', label: `Meus Pets (${stats.mineCount})` }]
                    : []),
                ] as { id: FilterMode; label: string }[]
              ).map((tab) => {
                const active = filterMode === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      triggerAudio('tap');
                      setFilterMode(tab.id);
                    }}
                    className={`px-4 py-2 rounded-full border-[2.5px] border-[#120624] text-xs font-extrabold cursor-pointer whitespace-nowrap shrink-0 transition-colors ${
                      active
                        ? 'bg-[#F9C826] text-[#120624] shadow-[0_3px_0_#120624]'
                        : 'bg-white text-[#120624] hover:bg-[#FEF9C3]'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => {
                  triggerAudio('tap');
                  setShowCompleted((prev) => !prev);
                }}
                className={`px-3.5 py-2 rounded-full border-[2.5px] border-[#120624] text-xs font-extrabold cursor-pointer whitespace-nowrap shrink-0 transition-colors ${
                  !showCompleted
                    ? 'bg-[#DCFCE7] text-[#14532D]'
                    : 'bg-white/15 text-white hover:bg-white/25'
                }`}
              >
                {showCompleted ? 'Ocultar concluídos' : 'Mostrando só disponíveis'}
              </button>
            </div>

            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar pet, dono ou #tag..."
                aria-label="Buscar pets"
                className="w-full pl-10 pr-4 py-2.5 rounded-full bg-white border-[2.5px] border-[#120624] text-sm font-semibold text-[#120624] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#F9C826]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CATALOG GRID BAND */}
      <section className="pkxd-band-purple-2 py-10 sm:py-14 min-h-[460px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {loadError ? (
            <div className="pkxd-pop-card p-8 text-center space-y-3 max-w-xl mx-auto">
              <div className="w-14 h-14 rounded-full bg-rose-100 border-[3px] border-[#120624] flex items-center justify-center mx-auto">
                <AlertTriangle className="w-7 h-7 text-rose-600" />
              </div>
              <h2 className="font-display font-bold text-2xl text-[#120624]">
                Erro ao carregar pets
              </h2>
              <p className="text-sm text-slate-600">{loadError}</p>
            </div>
          ) : loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="pkxd-pop-card overflow-hidden animate-pulse"
                >
                  <div className="aspect-[4/3] bg-slate-200 border-b-[3px] border-[#120624]" />
                  <div className="p-5 space-y-3">
                    <div className="h-3.5 w-28 bg-slate-200 rounded" />
                    <div className="h-6 w-48 bg-slate-200 rounded" />
                    <div className="h-11 w-full bg-slate-100 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="pkxd-pop-card p-10 text-center space-y-4 max-w-xl mx-auto">
              <div className="w-16 h-16 rounded-full bg-[#FEF9C3] border-[3px] border-[#120624] flex items-center justify-center mx-auto">
                <PawPrint className="w-8 h-8 text-[#6D28D9]" />
              </div>
              <h2 className="font-display font-bold text-2xl text-[#120624]">
                {listings.length === 0
                  ? 'Nenhum pet publicado ainda'
                  : 'Nenhum pet encontrado nesse filtro'}
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                {listings.length === 0
                  ? 'Seja o primeiro jogador a anunciar um pet para doação gratuita ou troca com a comunidade PK XD Central.'
                  : 'Tente limpar a busca ou escolher outra modalidade acima.'}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                {listings.length === 0 || filterMode === 'mine' ? (
                  <button
                    type="button"
                    onClick={() => openPublishModal()}
                    className="pkxd-btn-gold px-5 py-2.5 text-xs font-extrabold inline-flex items-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Publicar meu Pet</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setFilterMode('all');
                      setSearch('');
                      setShowCompleted(true);
                    }}
                    className="pkxd-btn-purple px-5 py-2.5 text-xs font-extrabold cursor-pointer"
                  >
                    Limpar Filtros
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredListings.map((pet) => {
                const isOwner = Boolean(currentUser?.uid && pet.authorId === currentUser.uid);
                const canModerate = isOwner || isAdmin;
                const isCompleted = pet.status === 'concluido';
                const fullPlayerTag = `${pet.ownerName} #${pet.ownerTagNumber}`;

                return (
                  <article
                    key={pet.id}
                    className={`pkxd-pop-card overflow-hidden flex flex-col justify-between transition-transform duration-200 hover:-translate-y-0.5 ${
                      isCompleted ? 'opacity-80' : ''
                    }`}
                  >
                    <div>
                      {/* 4:3 PET PHOTO */}
                      <button
                        type="button"
                        onClick={() => {
                          triggerAudio('tap');
                          setSelectedPet(pet);
                        }}
                        className="relative block w-full aspect-[4/3] bg-slate-100 border-b-[3px] border-[#120624] overflow-hidden cursor-pointer group text-left"
                        aria-label={`Ver detalhes do pet ${pet.petName}`}
                      >
                        <PetPhotoFrame
                          src={pet.petPhotoUrl}
                          alt={pet.petName}
                          className="group-hover:scale-105 transition-transform duration-300"
                        />
                        {isCompleted && (
                          <div className="absolute inset-0 bg-[#120624]/55 flex items-center justify-center p-4">
                            <span className="px-4 py-1.5 rounded-xl bg-white border-[2.5px] border-[#120624] text-[#120624] font-display font-bold text-sm">
                              {pet.listingType === 'doacao' ? 'Pet já doado' : 'Pet já trocado'}
                            </span>
                          </div>
                        )}
                      </button>

                      {/* CARD BODY */}
                      <div className="p-5 space-y-3">
                        {/* Unboxed Metadata Line */}
                        <div className="flex flex-wrap items-center gap-1.5 text-xs font-extrabold">
                          <span
                            className={`inline-flex items-center gap-1 ${
                              pet.listingType === 'doacao'
                                ? 'text-emerald-700'
                                : 'text-[#6D28D9]'
                            }`}
                          >
                            {pet.listingType === 'doacao' ? (
                              <Gift className="w-3.5 h-3.5 shrink-0" />
                            ) : (
                              <Repeat2 className="w-3.5 h-3.5 shrink-0" />
                            )}
                            {pet.listingType === 'doacao' ? 'Doação gratuita' : 'Troca de pet'}
                          </span>
                          <span className="text-slate-400" aria-hidden="true">
                            ·
                          </span>
                          <span className="text-slate-500 font-semibold">
                            {formatRelativeDate(pet.createdAt)}
                          </span>
                          {isAdmin && pet.reportsCount > 0 && (
                            <>
                              <span className="text-slate-400" aria-hidden="true">
                                ·
                              </span>
                              <span className="text-rose-700 tabular-nums">
                                {pet.reportsCount}{' '}
                                {pet.reportsCount === 1 ? 'denúncia' : 'denúncias'}
                              </span>
                            </>
                          )}
                        </div>

                        {/* PET NAME */}
                        <h2 className="font-display font-bold text-xl text-[#120624] leading-snug line-clamp-1">
                          {pet.petName}
                        </h2>

                        {/* WANTED PET / NOTES */}
                        {pet.listingType === 'troca' && pet.wantedPet && (
                          <p className="text-xs sm:text-sm text-[#4C1D95] font-semibold line-clamp-2">
                            Troca por: <span className="font-bold">{pet.wantedPet}</span>
                          </p>
                        )}

                        {pet.notes && (
                          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-2">
                            {pet.notes}
                          </p>
                        )}

                        {/* OWNER PK XD IDENTITY & COPY TAG */}
                        <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <span className="block text-[11px] font-bold text-slate-500">
                              Jogador no PK XD
                            </span>
                            <p className="text-sm font-extrabold text-[#120624] truncate">
                              {pet.ownerName}{' '}
                              <span className="font-mono text-[#6D28D9] tabular-nums">
                                #{pet.ownerTagNumber}
                              </span>
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleCopyTag(pet)}
                            aria-label={`Copiar ${fullPlayerTag}`}
                            className={`px-3 py-2 rounded-xl border-2 border-[#120624] text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 transition-colors ${
                              copiedId === pet.id
                                ? 'bg-[#DCFCE7] text-[#14532D]'
                                : 'bg-[#FEF9C3] hover:bg-[#F9C826] text-[#120624]'
                            }`}
                          >
                            {copiedId === pet.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 shrink-0" />
                                <span>Copiado</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 shrink-0" />
                                <span>Copiar #</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* CARD FOOTER ACTIONS */}
                    <div className="px-5 pb-5 pt-1 space-y-2.5">
                      {!isCompleted && !isOwner && (
                        <button
                          type="button"
                          onClick={() => openWantModal(pet)}
                          className={`w-full min-h-[42px] px-4 py-2 rounded-2xl border-[2.5px] border-[#120624] text-xs font-extrabold inline-flex items-center justify-center gap-2 cursor-pointer transition-colors whitespace-nowrap ${
                            sentInterestIds.includes(pet.id)
                              ? 'bg-[#DCFCE7] text-[#14532D]'
                              : 'pkxd-btn-gold'
                          }`}
                        >
                          {sentInterestIds.includes(pet.id) ? (
                            <>
                              <Check className="w-4 h-4 shrink-0" />
                              <span>Interesse enviado (Enviar de novo)</span>
                            </>
                          ) : (
                            <>
                              <HeartHandshake className="w-4 h-4 shrink-0" />
                              <span>Eu quero!</span>
                            </>
                          )}
                        </button>
                      )}

                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            triggerAudio('tap');
                            setSelectedPet(pet);
                          }}
                          className="text-xs font-extrabold text-[#2D0859] hover:text-[#6D28D9] inline-flex items-center gap-1.5 py-1.5 cursor-pointer whitespace-nowrap"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver detalhes</span>
                        </button>

                        {canModerate && (
                        <div className="flex items-center gap-1.5">
                          {isOwner && (
                            <>
                              <button
                                type="button"
                                disabled={busyCardId === pet.id}
                                onClick={() => handleToggleStatus(pet)}
                                title={
                                  isCompleted
                                    ? 'Reabrir anúncio'
                                    : pet.listingType === 'doacao'
                                    ? 'Marcar como doado'
                                    : 'Marcar como trocado'
                                }
                                className="px-2.5 py-1.5 rounded-xl border-2 border-[#120624] bg-white hover:bg-slate-100 text-[#120624] text-[11px] font-extrabold inline-flex items-center gap-1 cursor-pointer whitespace-nowrap disabled:opacity-50"
                              >
                                {isCompleted ? (
                                  <>
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    <span>Reabrir</span>
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                                    <span>Concluir</span>
                                  </>
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => openPublishModal(pet)}
                                aria-label="Editar anúncio"
                                className="p-1.5 rounded-xl border-2 border-[#120624] bg-white hover:bg-slate-100 text-[#120624] cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          {confirmDeleteId === pet.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                disabled={busyCardId === pet.id}
                                onClick={() => handleDeletePet(pet)}
                                className="px-2.5 py-1.5 rounded-xl border-2 border-[#120624] bg-rose-600 text-white text-[11px] font-extrabold cursor-pointer whitespace-nowrap"
                              >
                                Confirmar
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-2 py-1.5 rounded-xl border-2 border-[#120624] bg-white text-[#120624] text-[11px] font-extrabold cursor-pointer"
                              >
                                Não
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(pet.id)}
                              aria-label="Excluir anúncio"
                              className="p-1.5 rounded-xl border-2 border-[#120624] bg-rose-50 hover:bg-rose-100 text-rose-700 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* PUBLISH / EDIT PET MODAL (PORTAL CENTERED) */}
      {isFormOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] bg-[#120624]/75 backdrop-blur-[2px] flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
            onClick={() => !isSubmitting && setIsFormOpen(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="pet-form-modal-title"
              className="w-full max-w-xl bg-white text-[#120624] border-[3.5px] border-[#120624] rounded-[28px] shadow-[0_8px_0_#16032E] max-h-[92vh] overflow-y-auto my-auto"
            >
              {/* Modal Header */}
              <div className="sticky top-0 z-10 bg-[#2D0859] text-white px-5 sm:px-6 py-4 border-b-[3px] border-[#120624] flex items-center justify-between gap-3">
                <div>
                  <h2
                    id="pet-form-modal-title"
                    className="font-display font-bold text-xl sm:text-2xl text-white"
                  >
                    {editingPet ? 'Editar anúncio do Pet' : 'Publicar Pet para Doação ou Troca'}
                  </h2>
                  <p className="text-xs text-white/80 font-medium">
                    100% gratuito · Vendas são extremamente proibidas
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => !isSubmitting && setIsFormOpen(false)}
                  className="w-9 h-9 rounded-full bg-[#F9C826] border-2 border-[#120624] text-[#120624] flex items-center justify-center cursor-pointer shrink-0"
                  aria-label="Fechar janela"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 sm:p-6">
                {!currentUser ? (
                  <div className="text-center space-y-4 py-4">
                    <div className="w-14 h-14 rounded-2xl bg-[#FEF9C3] border-[2.5px] border-[#120624] flex items-center justify-center mx-auto">
                      <KeyRound className="w-7 h-7 text-[#2D0859]" />
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="font-display font-bold text-xl text-[#120624]">
                        Entre na sua conta para publicar
                      </h3>
                      <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                        Para manter a segurança da comunidade e permitir que você edite ou marque seu pet como doado/trocado depois, faça login na sua conta PK XD Central.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsFormOpen(false);
                        onOpenAuth('login');
                      }}
                      className="pkxd-btn-primary px-6 py-3 text-sm font-extrabold inline-flex items-center gap-2 cursor-pointer"
                    >
                      <KeyRound className="w-4 h-4" />
                      <span>Entrar ou Criar Conta</span>
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitPet} className="space-y-5">
                    {/* Prohibited Sale Reminder */}
                    <div className="rounded-2xl bg-[#FFF1F2] border-2 border-[#E11D48] p-3.5 text-xs font-bold text-[#881337] flex items-start gap-2.5">
                      <ShieldAlert className="w-4 h-4 text-[#E11D48] shrink-0 mt-0.5" />
                      <span>
                        Lembrete: <strong>vendas são extremamente proibidas</strong>. Anuncie apenas pets para doação gratuita ou troca por outro pet dentro do jogo.
                      </span>
                    </div>

                    {/* Listing Type Segmented Selector */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-extrabold text-[#120624]">
                        Modalidade do anúncio *
                      </label>
                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          onClick={() => {
                            triggerAudio('tap');
                            setListingType('doacao');
                          }}
                          className={`min-h-[48px] px-4 py-2.5 rounded-2xl border-[2.5px] border-[#120624] font-extrabold text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                            listingType === 'doacao'
                              ? 'bg-[#DCFCE7] text-[#14532D] shadow-[0_3px_0_#120624]'
                              : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <Gift className="w-4 h-4 shrink-0" />
                          <span>Doação (Grátis)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            triggerAudio('tap');
                            setListingType('troca');
                          }}
                          className={`min-h-[48px] px-4 py-2.5 rounded-2xl border-[2.5px] border-[#120624] font-extrabold text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                            listingType === 'troca'
                              ? 'bg-[#EDE9FE] text-[#4C1D95] shadow-[0_3px_0_#120624]'
                              : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <Repeat2 className="w-4 h-4 shrink-0" />
                          <span>Troca de Pet</span>
                        </button>
                      </div>
                    </div>

                    {/* Pet Name */}
                    <div className="space-y-1.5">
                      <label
                        htmlFor="pet-name-input"
                        className="block text-xs font-extrabold text-[#120624]"
                      >
                        Nome do Pet *
                      </label>
                      <input
                        id="pet-name-input"
                        type="text"
                        required
                        maxLength={60}
                        value={petName}
                        onChange={(e) => setPetName(e.target.value)}
                        placeholder="Ex: Dragão Galáxia, Gato Nuvem, Cachorro Robô..."
                        className="w-full px-4 py-2.5 rounded-xl bg-white border-2 border-[#120624] text-sm font-semibold text-[#120624] focus:outline-none focus:ring-2 focus:ring-[#6D28D9]"
                      />
                    </div>

                    {/* Pet Photo Upload / URL */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <label className="text-xs font-extrabold text-[#120624]">
                          Foto do Pet *
                        </label>
                        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-100 border border-slate-300">
                          <button
                            type="button"
                            onClick={() => setPhotoMode('upload')}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer ${
                              photoMode === 'upload'
                                ? 'bg-white text-[#120624] shadow-sm'
                                : 'text-slate-600'
                            }`}
                          >
                            <UploadCloud className="w-3.5 h-3.5" />
                            <span>Enviar foto</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setPhotoMode('url')}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer ${
                              photoMode === 'url'
                                ? 'bg-white text-[#120624] shadow-sm'
                                : 'text-slate-600'
                            }`}
                          >
                            <Link2 className="w-3.5 h-3.5" />
                            <span>Link</span>
                          </button>
                        </div>
                      </div>

                      {photoMode === 'upload' ? (
                        <div>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                          {petPhotoUrl ? (
                            <div className="space-y-2">
                              <div className="aspect-[4/3] max-h-56 w-full rounded-2xl border-2 border-[#120624] overflow-hidden bg-slate-100">
                                <PetPhotoFrame src={petPhotoUrl} alt={petName || 'Prévia do pet'} />
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => fileInputRef.current?.click()}
                                  className="px-3.5 py-2 rounded-xl border-2 border-[#120624] bg-[#FEF9C3] text-xs font-extrabold text-[#120624] cursor-pointer"
                                >
                                  Trocar foto
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setPetPhotoUrl('')}
                                  className="px-3.5 py-2 rounded-xl border-2 border-[#120624] bg-white text-xs font-extrabold text-rose-700 cursor-pointer"
                                >
                                  Remover
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              disabled={photoUploading}
                              onClick={() => fileInputRef.current?.click()}
                              className="w-full py-7 px-4 rounded-2xl border-2 border-dashed border-[#6D28D9] bg-[#F5F3FF] hover:bg-[#EDE9FE] text-center flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors"
                            >
                              <UploadCloud className="w-7 h-7 text-[#6D28D9]" />
                              <span className="text-sm font-extrabold text-[#2D0859]">
                                {photoUploading
                                  ? 'Otimizando foto do pet...'
                                  : 'Toque para enviar um print ou foto do seu pet'}
                              </span>
                              <span className="text-xs text-slate-600">
                                PNG, JPG ou WebP · redimensionamento automático
                              </span>
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <input
                            type="url"
                            value={petPhotoUrl.startsWith('data:') ? '' : petPhotoUrl}
                            onChange={(e) => setPetPhotoUrl(e.target.value)}
                            placeholder="https://exemplo.com/foto-do-meu-pet.png"
                            className="w-full px-4 py-2.5 rounded-xl bg-white border-2 border-[#120624] text-sm font-semibold text-[#120624] focus:outline-none focus:ring-2 focus:ring-[#6D28D9]"
                          />
                          {petPhotoUrl.startsWith('https://') && (
                            <div className="aspect-[4/3] max-h-48 w-full rounded-2xl border-2 border-[#120624] overflow-hidden bg-slate-100">
                              <PetPhotoFrame src={petPhotoUrl} alt={petName || 'Prévia do pet'} />
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Owner PK XD Name + #Tag */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2 space-y-1.5">
                        <label
                          htmlFor="pet-owner-name"
                          className="block text-xs font-extrabold text-[#120624]"
                        >
                          Seu Nome no PK XD *
                        </label>
                        <input
                          id="pet-owner-name"
                          type="text"
                          required
                          maxLength={32}
                          value={ownerName}
                          onChange={(e) => setOwnerName(e.target.value)}
                          placeholder="Seu nick exato no jogo"
                          className="w-full px-4 py-2.5 rounded-xl bg-white border-2 border-[#120624] text-sm font-semibold text-[#120624] focus:outline-none focus:ring-2 focus:ring-[#6D28D9]"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label
                          htmlFor="pet-owner-tag"
                          className="block text-xs font-extrabold text-[#120624]"
                        >
                          Sua # no PK XD *
                        </label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono font-bold text-[#6D28D9]">
                            #
                          </span>
                          <input
                            id="pet-owner-tag"
                            type="text"
                            inputMode="numeric"
                            required
                            maxLength={8}
                            value={ownerTagNumber}
                            onChange={(e) =>
                              setOwnerTagNumber(e.target.value.replace(/\D/g, '').slice(0, 8))
                            }
                            placeholder="1234"
                            className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-white border-2 border-[#120624] text-sm font-mono font-bold text-[#120624] tabular-nums focus:outline-none focus:ring-2 focus:ring-[#6D28D9]"
                          />
                        </div>
                      </div>
                    </div>

                    {(ownerName.trim() || ownerTagNumber.trim()) && (
                      <p className="text-xs font-semibold text-slate-600 -mt-2">
                        Contato exibido no cartão:{' '}
                        <strong className="text-[#120624]">
                          {ownerName.trim() || 'SeuNome'}{' '}
                          <span className="font-mono text-[#6D28D9] tabular-nums">
                            #{ownerTagNumber.trim() || '0000'}
                          </span>
                        </strong>
                      </p>
                    )}

                    {/* Wanted pet when Troca */}
                    {listingType === 'troca' && (
                      <div className="space-y-1.5">
                        <label
                          htmlFor="pet-wanted-input"
                          className="block text-xs font-extrabold text-[#120624]"
                        >
                          Qual pet você gostaria na troca? (opcional)
                        </label>
                        <input
                          id="pet-wanted-input"
                          type="text"
                          maxLength={80}
                          value={wantedPet}
                          onChange={(e) => setWantedPet(e.target.value)}
                          placeholder="Ex: Procuro Unicórnio, Raposa ou Coruja"
                          className="w-full px-4 py-2.5 rounded-xl bg-white border-2 border-[#120624] text-sm font-semibold text-[#120624] focus:outline-none focus:ring-2 focus:ring-[#6D28D9]"
                        />
                      </div>
                    )}

                    {/* Optional Notes */}
                    <div className="space-y-1.5">
                      <label
                        htmlFor="pet-notes-input"
                        className="block text-xs font-extrabold text-[#120624]"
                      >
                        Detalhes do Pet (opcional)
                      </label>
                      <textarea
                        id="pet-notes-input"
                        rows={2}
                        maxLength={200}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Ex: Nível 5, evoluído, me adicione no jogo para combinarmos!"
                        className="w-full px-4 py-2.5 rounded-xl bg-white border-2 border-[#120624] text-sm font-semibold text-[#120624] focus:outline-none focus:ring-2 focus:ring-[#6D28D9] resize-none"
                      />
                    </div>

                    {/* Mandatory Anti-Sale Checkbox */}
                    <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border-2 border-[#120624] cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={confirmedNoSale}
                        onChange={(e) => setConfirmedNoSale(e.target.checked)}
                        className="mt-0.5 w-5 h-5 rounded accent-[#6D28D9] shrink-0 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-[#120624] leading-relaxed">
                        Confirmo que este pet é apenas para <strong>doação gratuita ou troca</strong> e estou ciente de que qualquer tipo de venda é extremamente proibida.
                      </span>
                    </label>

                    {/* Form Error */}
                    {formError && (
                      <div
                        role="alert"
                        className="rounded-xl bg-rose-100 border-2 border-rose-600 p-3 text-xs font-bold text-rose-900"
                      >
                        {formError}
                      </div>
                    )}

                    {/* Submit / Cancel Buttons */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => setIsFormOpen(false)}
                        className="px-5 py-2.5 rounded-full border-2 border-[#120624] bg-white hover:bg-slate-100 text-xs font-extrabold text-[#120624] cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting || photoUploading}
                        className="pkxd-btn-gold px-6 py-2.5 text-sm font-extrabold cursor-pointer disabled:opacity-50"
                      >
                        {isSubmitting
                          ? 'Salvando...'
                          : editingPet
                          ? 'Salvar alterações'
                          : 'Publicar Pet'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* PET DETAIL MODAL (PORTAL CENTERED) */}
      {selectedPet &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] bg-[#120624]/75 backdrop-blur-[2px] flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
            onClick={() => setSelectedPet(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="pet-detail-title"
              className="w-full max-w-lg bg-white text-[#120624] border-[3.5px] border-[#120624] rounded-[28px] shadow-[0_8px_0_#16032E] overflow-hidden max-h-[92vh] overflow-y-auto my-auto"
            >
              <div className="relative aspect-[4/3] bg-slate-100 border-b-[3px] border-[#120624]">
                <PetPhotoFrame src={selectedPet.petPhotoUrl} alt={selectedPet.petName} />
                <button
                  type="button"
                  onClick={() => setSelectedPet(null)}
                  className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white border-[2.5px] border-[#120624] text-[#120624] flex items-center justify-center cursor-pointer shadow-[0_3px_0_#120624]"
                  aria-label="Fechar detalhes"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 sm:p-6 space-y-4">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-1.5 text-xs font-extrabold">
                    <span
                      className={
                        selectedPet.listingType === 'doacao'
                          ? 'text-emerald-700'
                          : 'text-[#6D28D9]'
                      }
                    >
                      {selectedPet.listingType === 'doacao'
                        ? 'Doação gratuita'
                        : 'Troca de pet'}
                    </span>
                    <span className="text-slate-400" aria-hidden="true">
                      ·
                    </span>
                    <span className="text-slate-500">
                      {selectedPet.status === 'disponivel'
                        ? 'Disponível'
                        : selectedPet.listingType === 'doacao'
                        ? 'Já doado'
                        : 'Já trocado'}
                    </span>
                    <span className="text-slate-400" aria-hidden="true">
                      ·
                    </span>
                    <span className="text-slate-500 font-semibold">
                      {formatRelativeDate(selectedPet.createdAt)}
                    </span>
                  </div>

                  <h2
                    id="pet-detail-title"
                    className="font-display font-bold text-2xl sm:text-3xl text-[#120624]"
                  >
                    {selectedPet.petName}
                  </h2>
                </div>

                {selectedPet.listingType === 'troca' && selectedPet.wantedPet && (
                  <div className="rounded-2xl bg-[#F5F3FF] border-2 border-[#120624] p-3.5">
                    <span className="block text-[11px] font-extrabold text-[#6D28D9]">
                      Pet desejado na troca
                    </span>
                    <p className="text-sm font-bold text-[#120624] mt-0.5">
                      {selectedPet.wantedPet}
                    </p>
                  </div>
                )}

                {selectedPet.notes && (
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                    {selectedPet.notes}
                  </p>
                )}

                {/* Contact Box */}
                <div className="rounded-2xl bg-[#FEF9C3] border-[2.5px] border-[#120624] p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-white border-2 border-[#120624] flex items-center justify-center shrink-0">
                        <User className="w-5 h-5 text-[#2D0859]" />
                      </div>
                      <div className="min-w-0">
                        <span className="block text-[11px] font-bold text-slate-600">
                          Adicione no PK XD
                        </span>
                        <p className="text-base font-extrabold text-[#120624] truncate">
                          {selectedPet.ownerName}{' '}
                          <span className="font-mono text-[#6D28D9] tabular-nums">
                            #{selectedPet.ownerTagNumber}
                          </span>
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyTag(selectedPet)}
                      className="pkxd-btn-purple px-4 py-2 text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap"
                    >
                      {copiedId === selectedPet.id ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Copiar Nome #</span>
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-xs font-semibold text-slate-700 leading-relaxed">
                    Copie o nome com a <strong>#</strong> acima e envie pedido de amizade dentro do PK XD. Nunca pague dinheiro, Pix ou compartilhe sua senha — vendas são extremamente proibidas.
                  </p>
                </div>

                {/* EU QUERO CTA INSIDE DETAIL MODAL */}
                {selectedPet.status === 'disponivel' &&
                  (!currentUser || selectedPet.authorId !== currentUser.uid) && (
                    <button
                      type="button"
                      onClick={() => {
                        const target = selectedPet;
                        setSelectedPet(null);
                        openWantModal(target);
                      }}
                      className="w-full min-h-[46px] pkxd-btn-gold px-5 py-3 text-sm font-extrabold inline-flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <HeartHandshake className="w-4 h-4 shrink-0" />
                      <span>
                        Eu quero! Enviar meu @ ou WhatsApp + Nome #
                      </span>
                    </button>
                  )}

                {/* Bottom Actions */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200">
                  {(!currentUser || selectedPet.authorId !== currentUser.uid) && (
                    <button
                      type="button"
                      disabled={
                        busyCardId === selectedPet.id ||
                        Boolean(
                          currentUser?.uid &&
                            selectedPet.reportedBy.includes(currentUser.uid)
                        )
                      }
                      onClick={() => handleReportSale(selectedPet)}
                      className="text-xs font-extrabold text-rose-700 hover:text-rose-900 inline-flex items-center gap-1.5 py-2 cursor-pointer disabled:opacity-50"
                    >
                      <Flag className="w-3.5 h-3.5" />
                      <span>
                        {currentUser?.uid &&
                        selectedPet.reportedBy.includes(currentUser.uid)
                          ? 'Denúncia registrada'
                          : 'Denunciar venda proibida'}
                      </span>
                    </button>
                  )}

                  {isAdmin && (
                    <button
                      type="button"
                      disabled={busyCardId === selectedPet.id}
                      onClick={() => handleDeletePet(selectedPet)}
                      className="px-4 py-2 rounded-full border-2 border-[#120624] bg-rose-100 text-rose-800 text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remover (Admin)</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* "EU QUERO!" INTEREST MODAL (PORTAL CENTERED) */}
      {wantPet &&
        createPortal(
          <div
            className="fixed inset-0 z-[110] bg-[#120624]/75 backdrop-blur-[2px] flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
            onClick={() => !isSendingWant && setWantPet(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="pet-want-modal-title"
              className="w-full max-w-lg bg-white text-[#120624] border-[3.5px] border-[#120624] rounded-[28px] shadow-[0_8px_0_#16032E] max-h-[92vh] overflow-y-auto my-auto"
            >
              <div className="sticky top-0 z-10 bg-[#2D0859] text-white px-5 sm:px-6 py-4 border-b-[3px] border-[#120624] flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h2
                    id="pet-want-modal-title"
                    className="font-display font-bold text-xl sm:text-2xl text-white truncate"
                  >
                    Eu quero: {wantPet.petName}
                  </h2>
                  <p className="text-xs text-white/85 font-medium">
                    Enviará uma notificação direta para {wantPet.ownerName} #{wantPet.ownerTagNumber}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => !isSendingWant && setWantPet(null)}
                  className="w-9 h-9 rounded-full bg-[#F9C826] border-2 border-[#120624] text-[#120624] flex items-center justify-center cursor-pointer shrink-0"
                  aria-label="Fechar janela"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitWant} className="p-5 sm:p-6 space-y-4">
                <div className="rounded-2xl bg-[#F8FAFC] border-2 border-[#120624] p-3 flex items-center gap-3">
                  <div className="w-16 h-12 rounded-xl border-2 border-[#120624] overflow-hidden shrink-0 bg-slate-100">
                    <PetPhotoFrame src={wantPet.petPhotoUrl} alt={wantPet.petName} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold text-[#6D28D9]">
                      {wantPet.listingType === 'doacao' ? 'Doação gratuita' : 'Troca de pet'}
                    </p>
                    <p className="font-display font-bold text-base text-[#120624] truncate">
                      {wantPet.petName}
                    </p>
                    <p className="text-xs font-semibold text-slate-600 truncate">
                      Publicado por {wantPet.ownerName} #{wantPet.ownerTagNumber}
                    </p>
                  </div>
                </div>

                {/* Interested Player Name + #Tag */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1.5">
                    <label
                      htmlFor="want-player-name"
                      className="block text-xs font-extrabold text-[#120624]"
                    >
                      Seu Nome no PK XD *
                    </label>
                    <input
                      id="want-player-name"
                      type="text"
                      required
                      maxLength={32}
                      value={wantName}
                      onChange={(e) => setWantName(e.target.value)}
                      placeholder="Seu nick no jogo"
                      className="w-full px-4 py-2.5 rounded-xl bg-white border-2 border-[#120624] text-sm font-semibold text-[#120624] focus:outline-none focus:ring-2 focus:ring-[#6D28D9]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="want-player-tag"
                      className="block text-xs font-extrabold text-[#120624]"
                    >
                      Sua # no PK XD *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono font-bold text-[#6D28D9]">
                        #
                      </span>
                      <input
                        id="want-player-tag"
                        type="text"
                        inputMode="numeric"
                        required
                        maxLength={8}
                        value={wantTagNumber}
                        onChange={(e) =>
                          setWantTagNumber(e.target.value.replace(/\D/g, '').slice(0, 8))
                        }
                        placeholder="1234"
                        className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-white border-2 border-[#120624] text-sm font-mono font-bold text-[#120624] tabular-nums focus:outline-none focus:ring-2 focus:ring-[#6D28D9]"
                      />
                    </div>
                  </div>
                </div>

                {/* Preferred Contact Choice: @ or WhatsApp */}
                <div className="space-y-2">
                  <label className="block text-xs font-extrabold text-[#120624]">
                    Como prefere que a pessoa fale com você? *
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        triggerAudio('tap');
                        setWantContactType('social');
                        setWantContactValue('');
                      }}
                      className={`min-h-[44px] px-3 py-2 rounded-2xl border-[2.5px] border-[#120624] text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                        wantContactType === 'social'
                          ? 'bg-[#EDE9FE] text-[#4C1D95] shadow-[0_3px_0_#120624]'
                          : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <AtSign className="w-4 h-4 shrink-0" />
                      <span>Meu @ (Rede Social)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        triggerAudio('tap');
                        setWantContactType('whatsapp');
                        setWantContactValue('');
                      }}
                      className={`min-h-[44px] px-3 py-2 rounded-2xl border-[2.5px] border-[#120624] text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                        wantContactType === 'whatsapp'
                          ? 'bg-[#DCFCE7] text-[#14532D] shadow-[0_3px_0_#120624]'
                          : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <MessageCircle className="w-4 h-4 shrink-0" />
                      <span>WhatsApp</span>
                    </button>
                  </div>

                  {wantContactType === 'social' ? (
                    <input
                      type="text"
                      required
                      maxLength={60}
                      value={wantContactValue}
                      onChange={(e) => setWantContactValue(e.target.value)}
                      placeholder="Ex: @seuinstagram ou @seutiktok"
                      className="w-full px-4 py-2.5 rounded-xl bg-white border-2 border-[#120624] text-sm font-semibold text-[#120624] focus:outline-none focus:ring-2 focus:ring-[#6D28D9]"
                    />
                  ) : (
                    <input
                      type="tel"
                      required
                      maxLength={24}
                      value={wantContactValue}
                      onChange={(e) => setWantContactValue(e.target.value)}
                      placeholder="Ex: (11) 99999-9999"
                      className="w-full px-4 py-2.5 rounded-xl bg-white border-2 border-[#120624] text-sm font-mono font-semibold text-[#120624] tabular-nums focus:outline-none focus:ring-2 focus:ring-[#6D28D9]"
                    />
                  )}
                </div>

                {/* Optional Short Message */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="want-message-input"
                    className="block text-xs font-extrabold text-[#120624]"
                  >
                    {wantPet.listingType === 'troca'
                      ? 'Qual pet você oferece na troca? (opcional)'
                      : 'Recado rápido (opcional)'}
                  </label>
                  <textarea
                    id="want-message-input"
                    rows={2}
                    maxLength={160}
                    value={wantMessage}
                    onChange={(e) => setWantMessage(e.target.value)}
                    placeholder={
                      wantPet.listingType === 'troca'
                        ? 'Ex: Tenho Unicórnio nível 5 ou Raposa para trocar!'
                        : 'Ex: Oi! Eu adoraria adotar esse pet, já vou te adicionar no PK XD!'
                    }
                    className="w-full px-4 py-2.5 rounded-xl bg-white border-2 border-[#120624] text-sm font-semibold text-[#120624] focus:outline-none focus:ring-2 focus:ring-[#6D28D9] resize-none"
                  />
                </div>

                {wantError && (
                  <div
                    role="alert"
                    className="rounded-xl bg-rose-100 border-2 border-rose-600 p-3 text-xs font-bold text-rose-900"
                  >
                    {wantError}
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-1">
                  <button
                    type="button"
                    disabled={isSendingWant}
                    onClick={() => setWantPet(null)}
                    className="px-5 py-2.5 rounded-full border-2 border-[#120624] bg-white hover:bg-slate-100 text-xs font-extrabold text-[#120624] cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSendingWant}
                    className="pkxd-btn-gold px-6 py-2.5 text-sm font-extrabold inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-4 h-4 shrink-0" />
                    <span>{isSendingWant ? 'Enviando...' : 'Enviar "Eu quero!"'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* POST-PUBLISH NOTIFICATION ACTIVATION MODAL (PORTAL CENTERED) */}
      {publishedSuccessPet &&
        createPortal(
          <div
            className="fixed inset-0 z-[120] bg-[#120624]/80 backdrop-blur-[2px] flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
            onClick={() => setPublishedSuccessPet(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="pet-published-notif-title"
              className="w-full max-w-md bg-white text-[#120624] border-[3.5px] border-[#120624] rounded-[28px] shadow-[0_8px_0_#16032E] overflow-hidden my-auto"
            >
              <div className="bg-[#2D0859] text-white px-5 sm:px-6 py-4 border-b-[3px] border-[#120624] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-white border-2 border-[#120624] flex items-center justify-center p-1 shrink-0">
                    <img
                      src="/assets/aistudio/file_000000004688820e877cea70c3a4dcc9_6049124b.png"
                      alt="PK XD Central"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <h2
                    id="pet-published-notif-title"
                    className="font-display font-bold text-lg sm:text-xl text-white truncate"
                  >
                    Pet publicado!
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setPublishedSuccessPet(null)}
                  className="w-9 h-9 rounded-full bg-[#F9C826] border-2 border-[#120624] text-[#120624] flex items-center justify-center cursor-pointer shrink-0"
                  aria-label="Fechar aviso"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 sm:p-6 space-y-4 text-center">
                <div className="w-14 h-14 rounded-2xl bg-[#DCFCE7] border-[2.5px] border-[#120624] text-[#14532D] flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div className="space-y-1.5">
                  <h3 className="font-display font-bold text-xl text-[#120624] leading-snug">
                    "{publishedSuccessPet.petName}" já está no ar!
                  </h3>
                  <p className="text-xs sm:text-sm font-semibold text-slate-600 leading-relaxed">
                    Seu pet foi anunciado para{' '}
                    <strong>
                      {publishedSuccessPet.listingType === 'doacao'
                        ? 'doação gratuita'
                        : 'troca'}
                    </strong>
                    .
                  </p>
                </div>

                {hasPushPermission || pushActionState === 'enabled' ? (
                  <div className="rounded-2xl bg-[#DCFCE7] border-2 border-[#120624] p-4 text-left flex items-start gap-3">
                    <Bell className="w-5 h-5 text-[#14532D] shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-extrabold text-[#14532D]">
                        Notificações Pop-up ativadas!
                      </p>
                      <p className="text-xs font-semibold text-[#166534] leading-relaxed">
                        Assim que alguém clicar em <strong>"Eu quero!"</strong> no seu pet, vai subir um <strong>pop-up na hora</strong> com o <strong>Nome #</strong> e o <strong>@ ou WhatsApp</strong> da pessoa.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl bg-[#FEF9C3] border-[2.5px] border-[#120624] p-4 text-left space-y-3">
                    <div className="flex items-start gap-2.5">
                      <BellRing className="w-5 h-5 text-[#2D0859] shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-sm font-extrabold text-[#120624]">
                          Importante: ative as notificações pop-up!
                        </p>
                        <p className="text-xs font-semibold text-slate-800 leading-relaxed">
                          Quando alguém clicar em <strong>"Eu quero!"</strong> no seu pet, o <strong>Nome #</strong> e o <strong>@ ou WhatsApp</strong> dessa pessoa chegam em um <strong>pop-up na sua tela</strong> e nas <strong>Notificações</strong>. Ative agora para não perder!
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={pushActionState === 'requesting'}
                      onClick={handleRequestPushActivation}
                      className="w-full min-h-[46px] pkxd-btn-gold px-5 py-2.5 text-sm font-extrabold inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      <BellRing className="w-4 h-4 shrink-0" />
                      <span>
                        {pushActionState === 'requesting'
                          ? 'Solicitando permissão...'
                          : 'Ativar Notificações Pop-up Agora'}
                      </span>
                    </button>

                    {pushActionState === 'denied' && (
                      <p className="text-xs font-bold text-rose-800 bg-rose-100 border border-rose-300 rounded-xl p-2.5 leading-relaxed">
                        Seu navegador bloqueou as notificações. Clique no cadeado ao lado do endereço do site para permitir, ou acompanhe seus pedidos pelo sino de Notificações aqui no site.
                      </p>
                    )}

                    {pushActionState === 'unsupported' && (
                      <p className="text-xs font-bold text-amber-900 bg-amber-100 border border-amber-300 rounded-xl p-2.5 leading-relaxed">
                        Este navegador não suporta alertas push, mas você receberá todos os pedidos "Eu quero!" no sino de Notificações do site.
                      </p>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
                  {onOpenNotifications && (
                    <button
                      type="button"
                      onClick={() => {
                        triggerAudio('tap');
                        setPublishedSuccessPet(null);
                        onOpenNotifications();
                      }}
                      className="px-4 py-2.5 rounded-full border-2 border-[#120624] bg-[#F5F3FF] hover:bg-[#EDE9FE] text-xs font-extrabold text-[#2D0859] inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Bell className="w-3.5 h-3.5" />
                      <span>Ver Notificações</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      triggerAudio('tap');
                      setPublishedSuccessPet(null);
                    }}
                    className="pkxd-btn-purple px-5 py-2.5 text-xs font-extrabold cursor-pointer"
                  >
                    Entendi, ver pets
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
