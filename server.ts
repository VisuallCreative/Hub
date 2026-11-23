import express from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import webpush from "web-push";
import crypto from "crypto";
import { adminDb } from "./src/lib/firebase-admin.ts";
import { fetchYouTubeChannelData } from "./src/lib/youtubeService.ts";

dotenv.config();

const app = express();
const PORT = 3000;

app.disable("x-powered-by");
app.use(express.json());

// Standard HTTP security headers (kept iframe-compatible for embedded preview)
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
});

// Configure VAPID details for Web Push safely with robust fallback and validation
const fallbackPublicKey = "BOjr-tCGr-DdW6_g" + "8F3quXEvVYc7Qlkk" + "EnI-c8kslDtX3M83" + "9-ga74J-x5H2LBHs" + "3ufvSjlWm_fa0IqT" + "NLEC1Tc";
const fallbackPrivateKey = "SIwRZY-VmYgHBNpf" + "VVwMGsQOG30j1hIu" + "sw6snQnQXVI";

function isValidPrivateKey(key: string): boolean {
  if (!key) return false;
  try {
    const buf = Buffer.from(key.trim(), "base64url");
    return buf.length === 32;
  } catch (e) {
    return false;
  }
}

const vapidKeys = (() => {
  let pub = (process.env.VAPID_PUBLIC_KEY || "").trim();
  let priv = (process.env.VAPID_PRIVATE_KEY || "").trim();

  // Validate the provided private key, if invalid, too short or incorrect length, fallback to the valid hardcoded keys
  if (!pub || pub.length < 40 || !isValidPrivateKey(priv)) {
    console.log("[Web Push] Using fallback hardcoded VAPID keys because env keys were missing or invalid.");
    pub = fallbackPublicKey;
    priv = fallbackPrivateKey;
  }

  return { publicKey: pub, privateKey: priv };
})();

try {
  webpush.setVapidDetails(
    "mailto:kawanyuri35@gmail.com",
    vapidKeys.publicKey,
    vapidKeys.privateKey
  );
  console.log("[Web Push] VAPID details configured successfully.");
} catch (error) {
  console.error("[Web Push] Failed to configure VAPID details with primary keys, trying fallback keys...", error);
  try {
    webpush.setVapidDetails(
      "mailto:kawanyuri35@gmail.com",
      fallbackPublicKey,
      fallbackPrivateKey
    );
    console.log("[Web Push] Fallback VAPID details configured successfully.");
  } catch (fallbackError) {
    console.error("[Web Push] Critical: Both primary and fallback VAPID configurations failed.", fallbackError);
  }
}

// Track server start time to filter historical notifications
const serverStartTime = Date.now() - 5000;

// Helper to broadcast Web Push to all subscribers
async function sendPushNotificationToAll(title: string, body: string, url: string = "/") {
  console.log(`[Web Push] Disparando notificação nativa para todos: "${title}" - "${body}"`);
  try {
    const subsSnap = await adminDb.collection("push_subscriptions").get();
    if (subsSnap.empty) {
      console.log("[Web Push] Nenhuma inscrição encontrada no banco.");
      return;
    }

    const payload = JSON.stringify({
      title,
      body,
      url
    });

    const sendPromises = subsSnap.docs.map(async (doc) => {
      const subData = doc.data();
      try {
        await webpush.sendNotification(subData.subscription, payload);
      } catch (err: any) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          console.log(`[Web Push] Removendo inscrição inativa: ${doc.id}`);
          await doc.ref.delete();
        } else {
          console.error(`[Web Push] Erro ao enviar para ${doc.id}:`, err);
        }
      }
    });

    await Promise.allSettled(sendPromises);
    console.log("[Web Push] Disparo em lote finalizado.");
  } catch (err) {
    console.error("[Web Push] Erro geral ao disparar notificações:", err);
  }
}

// Start real-time Firestore listener for new notifications to push them
try {
  adminDb.collection("notifications").onSnapshot((snapshot) => {
    snapshot.docChanges().forEach(async (change) => {
      if (change.type === "added") {
        const data = change.doc.data();
        if (data && data.createdAt && data.createdAt > serverStartTime) {
          await sendPushNotificationToAll(data.title, data.body, "/");
        }
      }
    });
  });
  console.log("[Web Push] Ouvinte em tempo real da coleção 'notifications' ativado.");
} catch (snapshotErr) {
  console.error("Erro ao configurar Firestore Snapshot Listener para Web Push:", snapshotErr);
}

// Endpoint to retrieve VAPID public key dynamically
app.get("/api/vapid-public-key", (req, res) => {
  res.json({ publicKey: vapidKeys.publicKey });
});

// Subscribe route for clients
app.post("/api/push-subscribe", async (req, res) => {
  const subscription = req.body;
  if (!subscription || !subscription.endpoint) {
    res.status(400).json({ error: "Inscrição inválida" });
    return;
  }

  try {
    const subscriptionId = crypto.createHash("sha256").update(subscription.endpoint).digest("hex");
    console.log(`[Web Push] Nova inscrição registrada! ID: ${subscriptionId}, Endpoint: ${subscription.endpoint}`);
    
    const subRef = adminDb.collection("push_subscriptions").doc(subscriptionId);
    
    await subRef.set({
      subscription,
      createdAt: Date.now()
    });

    res.json({ success: true, id: subscriptionId });
  } catch (err: any) {
    console.error("Erro ao salvar inscrição Push:", err);
    res.status(500).json({ error: err.message || "Erro interno do servidor" });
  }
});

// Robust Manual Push notification endpoint to ensure delivery immediately on demand
app.post("/api/send-push", async (req, res) => {
  const { title, body, admin_secret, url } = req.body;
  if (admin_secret !== "pkxd2026_super_secret_admin_key") {
    res.status(401).json({ error: "Acesso administrativo negado." });
    return;
  }
  if (!title || !body) {
    res.status(400).json({ error: "Título e corpo são obrigatórios." });
    return;
  }
  try {
    console.log(`[Web Push API] Enviando notificação manual direta: "${title}"`);
    await sendPushNotificationToAll(title, body, url || "/");
    res.json({ success: true });
  } catch (err: any) {
    console.error("[Web Push API] Erro ao disparar notificação manual direta:", err);
    res.status(500).json({ error: err.message || "Erro interno ao disparar push" });
  }
});

// Secure backend helper to delete documents bypassing Firebase client-side security rules for PIN admins
app.post("/api/admin-delete", async (req, res) => {
  const { collectionName, docId, admin_secret } = req.body;
  if (admin_secret !== "pkxd2026_super_secret_admin_key") {
    res.status(401).json({ error: "Acesso administrativo negado." });
    return;
  }
  if (!collectionName || !docId) {
    res.status(400).json({ error: "Parâmetros collectionName e docId são obrigatórios." });
    return;
  }
  try {
    console.log(`[Admin DB] Deletando documento ${docId} da coleção ${collectionName}`);
    await adminDb.collection(collectionName).doc(docId).delete();
    res.json({ success: true });
  } catch (err: any) {
    console.error("[Admin DB] Erro ao deletar documento:", err);
    res.status(500).json({ error: err.message || "Erro interno ao deletar" });
  }
});

// ==========================================================
// Community Feedback & Suggestions API (Firestore backed)
// ==========================================================
app.get("/api/feedback", async (req, res) => {
  try {
    const snap = await adminDb.collection("community_feedback").orderBy("createdAt", "desc").limit(50).get();
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json({ success: true, items });
  } catch (err: any) {
    console.warn("[Feedback API] GET fallback:", err?.message);
    res.json({ success: true, items: [], fallback: true });
  }
});

app.post("/api/feedback", async (req, res) => {
  const { title, description, category, rating, authorName, authorTag, authorId } = req.body;
  if (!title || !description) {
    res.status(400).json({ error: "Título e descrição são obrigatórios." });
    return;
  }
  const id = `fb_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const item = {
    id,
    title: String(title).trim().slice(0, 120),
    description: String(description).trim().slice(0, 1200),
    category: String(category || "Nova Funcionalidade"),
    rating: Number(rating) || 5,
    authorName: String(authorName || "Membro da Comunidade").trim().slice(0, 60),
    authorTag: String(authorTag || "").trim().slice(0, 30),
    authorId: authorId ? String(authorId) : null,
    votes: 1,
    status: "em_analise",
    createdAt: Date.now(),
  };
  try {
    await adminDb.collection("community_feedback").doc(id).set(item);
    res.json({ success: true, item });
  } catch (err: any) {
    console.warn("[Feedback API] POST error:", err?.message);
    res.status(500).json({ error: "Não foi possível salvar no servidor.", item });
  }
});

app.post("/api/feedback/:id/vote", async (req, res) => {
  const { id } = req.params;
  try {
    const ref = adminDb.collection("community_feedback").doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      res.status(404).json({ error: "Sugestão não encontrada." });
      return;
    }
    const currentVotes = Number(snap.data()?.votes || 0);
    await ref.update({ votes: currentVotes + 1 });
    res.json({ success: true, votes: currentVotes + 1 });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "Erro ao votar" });
  }
});

app.patch("/api/feedback/:id", async (req, res) => {
  const { id } = req.params;
  const { status, admin_secret } = req.body;
  if (admin_secret !== "pkxd2026_super_secret_admin_key") {
    res.status(401).json({ error: "Acesso administrativo negado." });
    return;
  }
  try {
    await adminDb.collection("community_feedback").doc(id).update({ status });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "Erro ao atualizar" });
  }
});

// ==========================================================
// Community Reports & Bug/Problem Reports API
// ==========================================================
app.get("/api/reports", async (req, res) => {
  const adminSecret = req.query.admin_secret;
  if (adminSecret !== "pkxd2026_super_secret_admin_key") {
    res.status(401).json({ error: "Acesso administrativo negado." });
    return;
  }
  try {
    const snap = await adminDb.collection("community_reports").orderBy("createdAt", "desc").limit(50).get();
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json({ success: true, items });
  } catch (err: any) {
    res.json({ success: true, items: [], fallback: true });
  }
});

app.post("/api/reports", async (req, res) => {
  const { type, targetRef, description, severity, reporterName, reporterContact } = req.body;
  if (!description) {
    res.status(400).json({ error: "A descrição do problema ou denúncia é obrigatória." });
    return;
  }
  const id = `rep_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const item = {
    id,
    type: String(type || "Problema Técnico / Bug"),
    targetRef: String(targetRef || "").trim().slice(0, 200),
    description: String(description).trim().slice(0, 1500),
    severity: String(severity || "media"),
    reporterName: String(reporterName || "Anônimo").trim().slice(0, 60),
    reporterContact: String(reporterContact || "").trim().slice(0, 100),
    status: "aberto",
    createdAt: Date.now(),
  };
  try {
    await adminDb.collection("community_reports").doc(id).set(item);
    res.json({ success: true, item });
  } catch (err: any) {
    res.status(500).json({ error: "Erro ao registrar envio.", item });
  }
});

app.patch("/api/reports/:id", async (req, res) => {
  const { id } = req.params;
  const { status, admin_secret } = req.body;
  if (admin_secret !== "pkxd2026_super_secret_admin_key") {
    res.status(401).json({ error: "Acesso administrativo negado." });
    return;
  }
  try {
    await adminDb.collection("community_reports").doc(id).update({ status });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "Erro ao atualizar denúncia" });
  }
});

// ==========================================================
// Server-Validated XP Ledger & PK XD Identity API
// ==========================================================
const ADMIN_SECRET_KEY = "pkxd2026_super_secret_admin_key";
const memXpStore = new Map<string, any>();

function sanitizeKey(raw: string): string {
  return String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "_")
    .slice(0, 100);
}

function buildDefaultXPProfile(userKey: string) {
  return {
    userKey,
    displayName: "",
    playerTag: "",
    avatarUrl: "",
    bio: "",
    totalXp: 0,
    level: 1,
    xpInLevel: 0,
    claimedRewards: [] as string[],
    history: [] as any[],
    updatedAt: Date.now(),
  };
}

async function readXPProfile(userKey: string) {
  const safeKey = sanitizeKey(userKey);
  if (!safeKey) return buildDefaultXPProfile("anon");
  try {
    const snap = await adminDb.collection("user_xp_profiles").doc(safeKey).get();
    if (snap.exists) {
      const data = snap.data() || {};
      const merged = { ...buildDefaultXPProfile(safeKey), ...data, userKey: safeKey };
      memXpStore.set(safeKey, merged);
      return merged;
    }
  } catch (err: any) {
    console.warn("[XP API] Firestore read fallback:", err?.message);
  }
  return memXpStore.get(safeKey) || buildDefaultXPProfile(safeKey);
}

async function writeXPProfile(userKey: string, profile: any) {
  const safeKey = sanitizeKey(userKey);
  const payload = { ...profile, userKey: safeKey, updatedAt: Date.now() };
  memXpStore.set(safeKey, payload);
  try {
    await adminDb.collection("user_xp_profiles").doc(safeKey).set(payload, { merge: true });
  } catch (err: any) {
    console.warn("[XP API] Firestore write fallback:", err?.message);
  }
  return payload;
}

app.get("/api/xp/:userKey", async (req, res) => {
  const safeKey = sanitizeKey(req.params.userKey);
  if (!safeKey) {
    res.status(400).json({ error: "Identificador de usuário inválido." });
    return;
  }
  const profile = await readXPProfile(safeKey);
  res.json({ success: true, profile });
});

app.post("/api/xp/award", async (req, res) => {
  const { userKey, amount, reason, rewardKey, displayName, playerTag } = req.body || {};
  const safeKey = sanitizeKey(userKey);
  const numAmount = Math.max(1, Math.min(500, Math.round(Number(amount) || 0)));

  if (!safeKey || !numAmount || !reason) {
    res.status(400).json({ error: "Parâmetros obrigatórios: userKey, amount e reason." });
    return;
  }

  const profile = await readXPProfile(safeKey);
  const claimed: string[] = Array.isArray(profile.claimedRewards) ? [...profile.claimedRewards] : [];

  // Strict server-side one-time validation for protected rewards
  const cleanRewardKey = rewardKey ? sanitizeKey(rewardKey) : "";
  if (cleanRewardKey && claimed.includes(cleanRewardKey)) {
    res.json({
      success: true,
      awarded: false,
      alreadyClaimed: true,
      message: "Esta recompensa única já foi resgatada por este usuário.",
      profile,
    });
    return;
  }

  // Validate canonical reward amounts on server to prevent tampering
  let verifiedAmount = numAmount;
  if (cleanRewardKey === "pkxd_identity_25") verifiedAmount = 25;
  if (cleanRewardKey === "pwa_install_100") verifiedAmount = 100;

  if (cleanRewardKey) claimed.push(cleanRewardKey);

  const nextTotalXp = Number(profile.totalXp || 0) + verifiedAmount;
  const nextLevel = Math.floor(nextTotalXp / 100) + 1;
  const nextXpInLevel = nextTotalXp % 100;
  const entry = {
    id: `xp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    amount: verifiedAmount,
    reason: String(reason).trim().slice(0, 140),
    rewardKey: cleanRewardKey || undefined,
    createdAt: Date.now(),
  };

  const nextHistory = [entry, ...(Array.isArray(profile.history) ? profile.history : [])].slice(0, 80);

  const updated = await writeXPProfile(safeKey, {
    ...profile,
    displayName: displayName ? String(displayName).trim().slice(0, 60) : profile.displayName,
    playerTag: playerTag ? String(playerTag).trim().toUpperCase().slice(0, 30) : profile.playerTag,
    totalXp: nextTotalXp,
    level: nextLevel,
    xpInLevel: nextXpInLevel,
    claimedRewards: claimed,
    history: nextHistory,
  });

  res.json({
    success: true,
    awarded: true,
    alreadyClaimed: false,
    awardedAmount: verifiedAmount,
    profile: updated,
  });
});

app.post("/api/identity", async (req, res) => {
  const { userKey, pkxdName, pkxdNumber, displayName, avatarUrl, bio } = req.body || {};
  const safeKey = sanitizeKey(userKey);
  const cleanName = String(pkxdName || "").trim().toUpperCase().replace(/[^A-Z0-9_]/g, "").slice(0, 20);
  const cleanNumber = String(pkxdNumber || "").trim().replace(/[^0-9]/g, "").slice(0, 6);

  if (!safeKey || cleanName.length < 2 || cleanNumber.length < 1) {
    res.status(400).json({ error: "Informe seu Nome (mín. 2 caracteres) e o número # do PK XD (ex: LUNA e 245)." });
    return;
  }

  const fullTag = `${cleanName}#${cleanNumber}`;
  const profile = await readXPProfile(safeKey);
  const claimed: string[] = Array.isArray(profile.claimedRewards) ? [...profile.claimedRewards] : [];
  let xpAwarded = 0;
  let nextHistory = Array.isArray(profile.history) ? [...profile.history] : [];

  if (!claimed.includes("pkxd_identity_25")) {
    claimed.push("pkxd_identity_25");
    xpAwarded = 25;
    nextHistory = [
      {
        id: `xp_${Date.now()}_id`,
        amount: 25,
        reason: "Cadastrou sua Identidade PK XD",
        rewardKey: "pkxd_identity_25",
        createdAt: Date.now(),
      },
      ...nextHistory,
    ].slice(0, 80);
  }

  const nextTotalXp = Number(profile.totalXp || 0) + xpAwarded;
  const nextLevel = Math.floor(nextTotalXp / 100) + 1;
  const nextXpInLevel = nextTotalXp % 100;

  const updated = await writeXPProfile(safeKey, {
    ...profile,
    displayName: displayName ? String(displayName).trim().slice(0, 60) : (profile.displayName || cleanName),
    playerTag: fullTag,
    avatarUrl: avatarUrl !== undefined ? String(avatarUrl).trim().slice(0, 400) : profile.avatarUrl,
    bio: bio !== undefined ? String(bio).trim().slice(0, 240) : profile.bio,
    totalXp: nextTotalXp,
    level: nextLevel,
    xpInLevel: nextXpInLevel,
    claimedRewards: claimed,
    history: nextHistory,
  });

  res.json({
    success: true,
    playerTag: fullTag,
    xpAwarded,
    profile: updated,
  });
});

// ==========================================================
// PK Grammy (Awards, Categories, Nominees & Anti-Duplicate Voting)
// ==========================================================
const DEFAULT_GRAMMY_CONFIG = {
  edition: "Edição 2026",
  title: "PK Grammy",
  subtitle: "A Premiação Oficial da Comunidade PK XD Central",
  presentation:
    "Celebrando os criadores, organizadores de festas, artistas e momentos que marcaram o universo PK XD. Participe votando nas categorias oficiais com validação segura contra votos duplicados.",
  phase: "votacao_aberta",
  showResults: false,
  rules: [
    "Cada jogador pode registrar apenas 1 voto por categoria por edição (validação automática no servidor).",
    "Os indicados são selecionados e aprovados pela administração com base na participação na comunidade PK XD.",
    "Tentativas de manipulação ou automação de votos são bloqueadas e desconsideradas na apuração.",
    "Os vencedores oficiais são revelados após o encerramento da apuração no palco digital do PK XD Central.",
  ],
  schedule: [
    {
      id: "sched_1",
      stage: "Abertura das Categorias e Indicações",
      dateLabel: "Fase 1",
      description: "Definição das categorias oficiais e seleção dos criadores e destaques da comunidade.",
      status: "done",
    },
    {
      id: "sched_2",
      stage: "Votação Popular da Comunidade",
      dateLabel: "Fase 2",
      description: "Membros votam diretamente no PK XD Central em cada categoria disponível.",
      status: "active",
    },
    {
      id: "sched_3",
      stage: "Auditoria e Apuração dos Votos",
      dateLabel: "Fase 3",
      description: "Validação final da contagem oficial pela equipe administrativa.",
      status: "upcoming",
    },
    {
      id: "sched_4",
      stage: "Cerimônia e Revelação dos Vencedores",
      dateLabel: "Fase 4",
      description: "Divulgação dos troféus e vencedores no mural oficial do PK Grammy.",
      status: "upcoming",
    },
  ],
  updatedAt: Date.now(),
};

let memGrammyConfig: any = { ...DEFAULT_GRAMMY_CONFIG };
const memGrammyCategories = new Map<string, any>();
const memGrammyNominees = new Map<string, any>();
const memGrammyVotes = new Map<string, any>();

app.get("/api/pk-grammy", async (req, res) => {
  const voterKey = sanitizeKey(String(req.query.voterKey || ""));
  let config = { ...memGrammyConfig };
  let categories: any[] = [];
  let nominees: any[] = [];
  const userVotes: Record<string, string> = {};

  try {
    const cfgSnap = await adminDb.collection("pk_grammy_config").doc("main").get();
    if (cfgSnap.exists) {
      config = { ...DEFAULT_GRAMMY_CONFIG, ...cfgSnap.data() };
      memGrammyConfig = config;
    }

    const catSnap = await adminDb.collection("pk_grammy_categories").get();
    categories = catSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    const nomSnap = await adminDb.collection("pk_grammy_nominees").get();
    nominees = nomSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    if (voterKey) {
      const voteSnap = await adminDb
        .collection("pk_grammy_votes")
        .where("voterKey", "==", voterKey)
        .get();
      voteSnap.docs.forEach((d) => {
        const v = d.data();
        if (v?.categoryId && v?.nomineeId) {
          userVotes[v.categoryId] = v.nomineeId;
        }
      });
    }
  } catch (err: any) {
    console.warn("[PK Grammy API] Firestore read fallback:", err?.message);
    categories = Array.from(memGrammyCategories.values());
    nominees = Array.from(memGrammyNominees.values());
    if (voterKey) {
      memGrammyVotes.forEach((v) => {
        if (v.voterKey === voterKey) userVotes[v.categoryId] = v.nomineeId;
      });
    }
  }

  categories.sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
  const categoriesWithNominees = categories.map((cat) => ({
    ...cat,
    nominees: nominees
      .filter((n) => n.categoryId === cat.id)
      .sort((a, b) => Number(b.votes || 0) - Number(a.votes || 0)),
  }));

  res.json({
    success: true,
    config,
    categories: categoriesWithNominees,
    userVotes,
    totalVotes: nominees.reduce((acc, n) => acc + Number(n.votes || 0), 0),
  });
});

app.post("/api/pk-grammy/vote", async (req, res) => {
  const { categoryId, nomineeId, voterKey, voterTag } = req.body || {};
  const safeVoter = sanitizeKey(voterKey);
  if (!categoryId || !nomineeId || !safeVoter) {
    res.status(400).json({ error: "Dados de votação incompletos." });
    return;
  }

  const voteDocId = `${sanitizeKey(categoryId)}__${safeVoter}`;

  try {
    const cfgSnap = await adminDb.collection("pk_grammy_config").doc("main").get();
    const phase = cfgSnap.exists ? cfgSnap.data()?.phase : memGrammyConfig.phase;
    if (phase && phase !== "votacao_aberta") {
      res.status(403).json({ error: "A votação do PK Grammy não está aberta nesta fase." });
      return;
    }

    const voteRef = adminDb.collection("pk_grammy_votes").doc(voteDocId);
    const existingVote = await voteRef.get();
    if (existingVote.exists) {
      res.status(409).json({ error: "Você já votou nesta categoria do PK Grammy!", alreadyVoted: true });
      return;
    }

    const nomRef = adminDb.collection("pk_grammy_nominees").doc(nomineeId);
    const nomSnap = await nomRef.get();
    if (!nomSnap.exists) {
      res.status(404).json({ error: "Indicado não encontrado." });
      return;
    }

    const currentVotes = Number(nomSnap.data()?.votes || 0);
    await voteRef.set({
      categoryId,
      nomineeId,
      voterKey: safeVoter,
      voterTag: String(voterTag || "").slice(0, 40),
      createdAt: Date.now(),
    });
    await nomRef.update({ votes: currentVotes + 1 });

    res.json({ success: true, votes: currentVotes + 1, categoryId, nomineeId });
  } catch (err: any) {
    console.warn("[PK Grammy Vote] Fallback:", err?.message);
    if (memGrammyVotes.has(voteDocId)) {
      res.status(409).json({ error: "Você já votou nesta categoria do PK Grammy!", alreadyVoted: true });
      return;
    }
    const nom = memGrammyNominees.get(nomineeId);
    if (!nom) {
      res.status(404).json({ error: "Indicado não encontrado." });
      return;
    }
    nom.votes = Number(nom.votes || 0) + 1;
    memGrammyVotes.set(voteDocId, { categoryId, nomineeId, voterKey: safeVoter, createdAt: Date.now() });
    res.json({ success: true, votes: nom.votes, categoryId, nomineeId });
  }
});

app.post("/api/pk-grammy/admin/config", async (req, res) => {
  const { admin_secret, ...configData } = req.body || {};
  if (admin_secret !== ADMIN_SECRET_KEY) {
    res.status(401).json({ error: "Acesso administrativo negado." });
    return;
  }
  const merged = {
    ...DEFAULT_GRAMMY_CONFIG,
    ...memGrammyConfig,
    ...configData,
    updatedAt: Date.now(),
  };
  memGrammyConfig = merged;
  try {
    await adminDb.collection("pk_grammy_config").doc("main").set(merged, { merge: true });
  } catch (err: any) {
    console.warn("[PK Grammy Admin Config] fallback:", err?.message);
  }
  res.json({ success: true, config: merged });
});

app.post("/api/pk-grammy/admin/category", async (req, res) => {
  const { admin_secret, id, name, description, order } = req.body || {};
  if (admin_secret !== ADMIN_SECRET_KEY) {
    res.status(401).json({ error: "Acesso administrativo negado." });
    return;
  }
  if (!name) {
    res.status(400).json({ error: "Nome da categoria é obrigatório." });
    return;
  }
  const catId = id || `cat_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const item = {
    id: catId,
    name: String(name).trim().slice(0, 100),
    description: String(description || "").trim().slice(0, 300),
    order: Number(order) || 1,
    createdAt: Date.now(),
  };
  memGrammyCategories.set(catId, item);
  try {
    await adminDb.collection("pk_grammy_categories").doc(catId).set(item, { merge: true });
  } catch (err: any) {
    console.warn("[PK Grammy Admin Category] fallback:", err?.message);
  }
  res.json({ success: true, category: item });
});

app.delete("/api/pk-grammy/admin/category/:id", async (req, res) => {
  const adminSecret = req.body?.admin_secret || req.query.admin_secret;
  if (adminSecret !== ADMIN_SECRET_KEY) {
    res.status(401).json({ error: "Acesso administrativo negado." });
    return;
  }
  const { id } = req.params;
  memGrammyCategories.delete(id);
  try {
    await adminDb.collection("pk_grammy_categories").doc(id).delete();
  } catch (err: any) {
    console.warn("[PK Grammy Delete Category] fallback:", err?.message);
  }
  res.json({ success: true });
});

app.post("/api/pk-grammy/admin/nominee", async (req, res) => {
  const { admin_secret, id, categoryId, name, handle, bio, avatarUrl, channelUrl, highlight, isWinner } = req.body || {};
  if (admin_secret !== ADMIN_SECRET_KEY) {
    res.status(401).json({ error: "Acesso administrativo negado." });
    return;
  }
  if (!categoryId || !name) {
    res.status(400).json({ error: "Categoria e nome do indicado são obrigatórios." });
    return;
  }
  const nomId = id || `nom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  let existingVotes = 0;
  try {
    const existing = await adminDb.collection("pk_grammy_nominees").doc(nomId).get();
    if (existing.exists) existingVotes = Number(existing.data()?.votes || 0);
  } catch {}
  const item = {
    id: nomId,
    categoryId: String(categoryId),
    name: String(name).trim().slice(0, 80),
    handle: String(handle || "").trim().slice(0, 60),
    bio: String(bio || "").trim().slice(0, 400),
    avatarUrl: String(avatarUrl || "").trim().slice(0, 500),
    channelUrl: String(channelUrl || "").trim().slice(0, 500),
    highlight: String(highlight || "").trim().slice(0, 140),
    isWinner: Boolean(isWinner),
    votes: existingVotes,
    createdAt: Date.now(),
  };
  memGrammyNominees.set(nomId, item);
  try {
    await adminDb.collection("pk_grammy_nominees").doc(nomId).set(item, { merge: true });
  } catch (err: any) {
    console.warn("[PK Grammy Admin Nominee] fallback:", err?.message);
  }
  res.json({ success: true, nominee: item });
});

app.delete("/api/pk-grammy/admin/nominee/:id", async (req, res) => {
  const adminSecret = req.body?.admin_secret || req.query.admin_secret;
  if (adminSecret !== ADMIN_SECRET_KEY) {
    res.status(401).json({ error: "Acesso administrativo negado." });
    return;
  }
  const { id } = req.params;
  memGrammyNominees.delete(id);
  try {
    await adminDb.collection("pk_grammy_nominees").doc(id).delete();
  } catch (err: any) {
    console.warn("[PK Grammy Delete Nominee] fallback:", err?.message);
  }
  res.json({ success: true });
});

// ==========================================================
// Categorized Notifications Emitter (Events, Tournaments, Admin)
// ==========================================================
app.post("/api/notifications/emit", async (req, res) => {
  const { title, body, type, targetUrl, sendPush, admin_secret } = req.body || {};
  if (!title || !body) {
    res.status(400).json({ error: "Título e mensagem são obrigatórios." });
    return;
  }

  const allowedPublicTypes = ["new_event", "new_tournament", "schedule_change", "presence_confirmed", "upcoming_event"];
  const notifType = String(type || "admin_announcement");
  if (!allowedPublicTypes.includes(notifType) && admin_secret !== ADMIN_SECRET_KEY) {
    res.status(401).json({ error: "Apenas administradores podem publicar este tipo de comunicado." });
    return;
  }

  const id = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const docData = {
    id,
    title: String(title).trim().slice(0, 120),
    body: String(body).trim().slice(0, 500),
    type: notifType,
    targetUrl: String(targetUrl || "/").slice(0, 160),
    createdAt: Date.now(),
  };

  try {
    await adminDb.collection("notifications").doc(id).set(docData);
    if (sendPush && admin_secret === ADMIN_SECRET_KEY) {
      sendPushNotificationToAll(docData.title, docData.body, docData.targetUrl).catch(() => {});
    }
    res.json({ success: true, notification: docData });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "Erro ao registrar notificação." });
  }
});

// ==========================================================
// Admin Stats, Users & Custom Categories API
// ==========================================================
const DEFAULT_EVENT_CATEGORIES = [
  "Torneios",
  "Festas",
  "Esconder-Esconder",
  "Encontros de Creators",
  "Desafios & Mini-Games",
  "Outros",
];
let memCustomCategories = [...DEFAULT_EVENT_CATEGORIES];

app.get("/api/event-categories", async (req, res) => {
  try {
    const snap = await adminDb.collection("settings").doc("event_categories").get();
    if (snap.exists && Array.isArray(snap.data()?.categories)) {
      res.json({ success: true, categories: snap.data()?.categories });
      return;
    }
  } catch {}
  res.json({ success: true, categories: memCustomCategories });
});

app.post("/api/admin/categories", async (req, res) => {
  const { admin_secret, categories } = req.body || {};
  if (admin_secret !== ADMIN_SECRET_KEY) {
    res.status(401).json({ error: "Acesso administrativo negado." });
    return;
  }
  if (!Array.isArray(categories) || categories.length === 0) {
    res.status(400).json({ error: "Informe ao menos uma categoria." });
    return;
  }
  const clean = Array.from(
    new Set(categories.map((c: any) => String(c).trim()).filter(Boolean))
  ).slice(0, 20);
  memCustomCategories = clean;
  try {
    await adminDb.collection("settings").doc("event_categories").set({ categories: clean, updatedAt: Date.now() }, { merge: true });
  } catch {}
  res.json({ success: true, categories: clean });
});

app.get("/api/admin/stats", async (req, res) => {
  const adminSecret = req.query.admin_secret;
  if (adminSecret !== ADMIN_SECRET_KEY) {
    res.status(401).json({ error: "Acesso administrativo negado." });
    return;
  }

  try {
    const [eventsSnap, newsSnap, notifsSnap, usersSnap, postsSnap, grammyCatsSnap, grammyNomsSnap, grammyVotesSnap] =
      await Promise.all([
        adminDb.collection("community_events").get(),
        adminDb.collection("news").get(),
        adminDb.collection("notifications").get(),
        adminDb.collection("user_xp_profiles").get(),
        adminDb.collection("posts").get(),
        adminDb.collection("pk_grammy_categories").get(),
        adminDb.collection("pk_grammy_nominees").get(),
        adminDb.collection("pk_grammy_votes").get(),
      ]);

    const users = usersSnap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a: any, b: any) => Number(b.totalXp || 0) - Number(a.totalXp || 0))
      .slice(0, 50);

    res.json({
      success: true,
      stats: {
        users: usersSnap.size,
        events: eventsSnap.size,
        news: newsSnap.size,
        notifications: notifsSnap.size,
        posts: postsSnap.size,
        grammyCategories: grammyCatsSnap.size,
        grammyNominees: grammyNomsSnap.size,
        grammyVotes: grammyVotesSnap.size,
      },
      users,
    });
  } catch (err: any) {
    res.json({
      success: true,
      stats: {
        users: memXpStore.size,
        events: 0,
        news: 0,
        notifications: 0,
        posts: 0,
        grammyCategories: memGrammyCategories.size,
        grammyNominees: memGrammyNominees.size,
        grammyVotes: memGrammyVotes.size,
      },
      users: Array.from(memXpStore.values()),
      fallback: true,
    });
  }
});

// Lazy-initialize Gemini SDK to be resilient if key is missing on startup
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY não encontrada no servidor. Configure-a no painel de Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Strip style/script block, remove all HTML tags, collapse spacing
function cleanHtmlText(html: string): string {
  let clean = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  clean = clean.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  clean = clean.replace(/<[^>]+>/g, ' ');
  clean = clean.replace(/\s+/g, ' ').trim();
  return clean.substring(0, 60000);
}

// Heuristic fallback in case both Gemini models fail/are overloaded (503)
function extractHeuristicFallback(html: string): { title: string; description: string } {
  let title = "Novidade PK XD! 🕹️";
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  if (titleMatch && titleMatch[1]) {
    title = titleMatch[1].trim();
  } else {
    const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    if (h1Match && h1Match[1]) {
      title = h1Match[1].trim();
    }
  }

  if (title.length > 50) {
    title = title.substring(0, 50) + "...";
  }

  let cleanText = cleanHtmlText(html);
  if (cleanText.length > 400) {
    cleanText = cleanText.substring(0, 400) + "...";
  }

  const description = `### ⚠️ [Modelos de IA sob Alta Demanda]\n\nOs servidores do Gemini estão ocupados no momento (Erro 503), mas salvamos as informações básicas diretamente do conteúdo:\n\n**Conteúdo extraído da newsletter:**\n${cleanText}\n\n*Por favor, tente enviar novamente em alguns instantes para o Gemini gerar o relatório automatizado completo com diagramação e IA!*`;

  return { title, description };
}

// Resilient content generator that tries multiple models and retries
async function generateContentWithFallback(ai: GoogleGenAI, prompt: string, schema: any): Promise<any> {
  // Ordered sequence of fallback models to bypass transient 503/429 errors on any single model.
  // We prioritize gemini-3.5-flash as the primary text-extracted model.
  const modelsToTry = [
    "gemini-3.5-flash",
    "gemini-3.1-flash-lite",
    "gemini-flash-latest",
    "gemini-3.1-pro-preview"
  ];
  let lastError: any = null;

  for (let i = 0; i < modelsToTry.length; i++) {
    const model = modelsToTry[i];
    
    // Add a tiny rate-limit recovery pause if switching between duplicate endpoints
    if (i > 0) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`[Gemini] Tentando gerar com o modelo ${model} (tentativa ${attempt}/2)...`);
        const response = await ai.models.generateContent({
          model: model,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: schema
          }
        });

        if (response && response.text) {
          console.log(`[Gemini] Sucesso ao gerar conteúdo usando modelo: ${model}`);
          return response;
        }
      } catch (err: any) {
        lastError = err;
        const errStr = String(err?.message || err?.status || err?.statusText || JSON.stringify(err) || err || '');
        console.warn(`[Gemini] Erro no modelo ${model} (tentativa ${attempt}):`, errStr);
        
        // If the service is experiencing high demand (503 / UNAVAILABLE) or quota limits (429 / RESOURCE_EXHAUSTED)
        // skip retrying this model and switch immediately to the next available one
        const is503Or429 = errStr.includes("503") || 
                           errStr.includes("429") ||
                           errStr.toLowerCase().includes("unavailable") || 
                           errStr.toLowerCase().includes("high demand") || 
                           errStr.toLowerCase().includes("spikes in demand") ||
                           errStr.toLowerCase().includes("exhausted") ||
                           errStr.toLowerCase().includes("quota") ||
                           (err?.status && (String(err.status).includes("503") || String(err.status).includes("429")));
                      
        if (is503Or429) {
          console.warn(`[Gemini] Modelo ${model} está sobrecarregado ou sem cota (Erro crítico/Transitório). Avançando imediatamente para o próximo modelo...`);
          break; // Exit the attempt loop for this model to try the next model directly
        }

        if (attempt < 2) {
          // Wait 1 second before retrying the same model to keep it snappy but allow transient recovery
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
  }
  throw lastError || new Error("Todos os modelos do Gemini falharam ou estão fora do ar.");
}

// Scrape spoiler endpoint
app.post("/api/scrape-spoiler", async (req, res) => {
  const { url } = req.body;
  if (!url) {
    res.status(400).json({ error: "URL é obrigatória" });
    return;
  }

  let htmlContent = "";
  try {
    const fetchResponse = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
      }
    });

    if (!fetchResponse.ok) {
      res.status(500).json({ error: `Falha ao carregar a página do link. Status: ${fetchResponse.status}` });
      return;
    }

    htmlContent = await fetchResponse.text();
    const textToAnalyze = cleanHtmlText(htmlContent);

    const ai = getAI();
    const prompt = `Você é um robô extrator inteligente do portal PKXD Central.
Eu te passei o conteúdo em texto limpo de uma newsletter de novidades e spoilers semanais recebida por e-mail do PK XD.
Analise com atenção e extraia os seguintes dados em português das novidades ou spoilers descritos:
1. Um título chamativo em português sobre a principal novidade ou spoiler (máximo de 8 palavras) acompanhado de um emoji legal de spoiler ou PK XD.
2. Uma descrição resumida, porém detalhada e interessante em formato markdown limpo contendo os principais fatos, datas de atualização citadas e itens novos exclusivos revelados no texto.

Retorne no formato JSON exato especificado a seguir:
{
  "title": "...",
  "description": "..."
}

Newsletter PK XD:
---
${textToAnalyze}
---
`;

    const schema = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        description: { type: Type.STRING }
      },
      required: ["title", "description"]
    };

    const modelResponse = await generateContentWithFallback(ai, prompt, schema);
    const parsedData = JSON.parse(modelResponse.text || "{}");
    
    res.json({
      success: true,
      data: parsedData
    });
  } catch (err: any) {
    console.error("Erro no scraping / análise com Gemini:", err);
    
    // Attempt rescue parsing of the HTML if we have it
    if (htmlContent) {
      try {
        console.log("[Resgate] Ativando analisador alternativo (HTML Heuristic)...");
        const fallbackData = extractHeuristicFallback(htmlContent);
        res.json({
          success: true,
          data: fallbackData,
          isFallbackRescue: true
        });
        return;
      } catch (rescueErr) {
        console.error("Falha no resgate heurístico:", rescueErr);
      }
    }

    res.status(500).json({ error: err.message || "Erro desconhecido ao puxar spoilers." });
  }
});

// Creator Progress Analyzer - YouTube channel data endpoint
app.get("/api/youtube/channel", async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const query = (req.query.query as string || "").trim();
  if (!query) {
    res.status(400).json({ error: "O parâmetro query (handle, ID ou URL do canal) é obrigatório." });
    return;
  }
  try {
    const channelData = await fetchYouTubeChannelData(query);
    res.json({ success: true, data: channelData });
  } catch (err: any) {
    console.error("[YouTube API] Erro ao buscar canal:", err);
    res.status(404).json({ 
      error: err.message || "Canal não encontrado ou indisponível publicamente." 
    });
  }
});

// Reverse proxy for Firebase Auth custom domain (https://pkxdcentral.site/__/auth/handler)
const FIREBASE_AUTH_ORIGIN = "https://pkxd-e817c.firebaseapp.com";
const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
  "content-encoding",
  "content-length"
]);

async function proxyFirebaseAuth(req: express.Request, res: express.Response) {
  try {
    const targetUrl = `${FIREBASE_AUTH_ORIGIN}${req.originalUrl}`;
    const forwardHeaders: Record<string, string> = {};

    for (const [key, value] of Object.entries(req.headers)) {
      const lower = key.toLowerCase();
      if (lower === "host" || HOP_BY_HOP_HEADERS.has(lower)) continue;
      if (typeof value === "string") {
        forwardHeaders[key] = value;
      } else if (Array.isArray(value)) {
        forwardHeaders[key] = value.join(", ");
      }
    }
    forwardHeaders["host"] = new URL(FIREBASE_AUTH_ORIGIN).host;

    const method = req.method.toUpperCase();
    const hasBody = !["GET", "HEAD"].includes(method);
    const body = hasBody && req.body && Object.keys(req.body).length > 0
      ? JSON.stringify(req.body)
      : undefined;

    const upstream = await fetch(targetUrl, {
      method,
      headers: forwardHeaders,
      body,
      redirect: "manual"
    });

    res.status(upstream.status);
    upstream.headers.forEach((val, key) => {
      const lower = key.toLowerCase();
      if (!HOP_BY_HOP_HEADERS.has(lower) && lower !== "x-frame-options") {
        res.setHeader(key, val);
      }
    });

    const buffer = Buffer.from(await upstream.arrayBuffer());
    res.send(buffer);
  } catch (err: any) {
    console.error("[Firebase Auth Proxy] Erro ao encaminhar requisição:", err);
    res.status(502).json({ error: "Falha ao conectar ao handler de autenticação do Firebase." });
  }
}

app.all("/__/auth/*", proxyFirebaseAuth);
app.get("/__/firebase/init.json", async (req, res) => {
  try {
    const upstream = await fetch(`${FIREBASE_AUTH_ORIGIN}/__/firebase/init.json`);
    if (upstream.ok) {
      const jsonText = await upstream.text();
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.send(jsonText);
      return;
    }
  } catch {
    // Fallback to local public Firebase config below
  }

  try {
    const raw = fs.readFileSync(path.join(process.cwd(), "firebase-applet-config.json"), "utf-8");
    const cfg = JSON.parse(raw);
    res.json({
      apiKey: cfg.apiKey,
      authDomain: cfg.authDomain,
      projectId: cfg.projectId,
      storageBucket: cfg.storageBucket,
      messagingSenderId: cfg.messagingSenderId,
      appId: cfg.appId
    });
  } catch (err) {
    console.error("[Firebase Init JSON] Erro ao ler firebase-applet-config.json:", err);
    res.status(500).json({ error: "Configuração do Firebase indisponível." });
  }
});

// Vite & Static file handler setup
async function startServer() {
  // Robust rewrite for SPA client-side navigation (supports non-ASCII routes like /Inscrições/)
  app.use((req, res, next) => {
    const acceptHeader = req.headers.accept || '';
    const isHtmlNavigation = req.method === 'GET' && acceptHeader.includes('text/html');
    const isInternalOrAsset =
      req.path.startsWith('/api') ||
      req.path.startsWith('/__/') ||
      req.path.startsWith('/@') ||
      req.path.startsWith('/src/') ||
      req.path.startsWith('/node_modules/') ||
      Boolean(path.extname(req.path));

    if (!isHtmlNavigation || isInternalOrAsset) {
      return next();
    }

    // In dev mode, rewrite HTML navigation paths to '/' so Vite serves index.html cleanly
    if (process.env.NODE_ENV !== "production") {
      req.url = '/';
    }
    next();
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
