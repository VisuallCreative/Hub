import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Lock, Mail, User, ArrowLeft, KeyRound,
  CheckCircle2, AlertCircle, X, Shield, Eye, EyeOff,
  UserPlus, LogIn, RefreshCw, Send, Check, Zap
} from 'lucide-react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  signInWithPopup
} from 'firebase/auth';
import { auth, googleProvider, db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

export type AuthMode = 'login' | 'register' | 'resetpassword';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: AuthMode;
  onClose: () => void;
  onSuccess?: (user: any, mode: AuthMode) => void;
  triggerAudio: (type: 'tap' | 'success' | 'levelUp') => void;
  onNavigate: (path: string) => void;
  onAddXP?: (amount: number, reason: string) => void;
}

export default function AuthModal({
  isOpen,
  initialMode = 'login',
  onClose,
  onSuccess,
  triggerAudio,
  onNavigate,
  onAddXP
}: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [registerNickname, setRegisterNickname] = useState('');
  const [registerTagNumber, setRegisterTagNumber] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');

  const [resetEmail, setResetEmail] = useState('');
  const [resetSentSuccess, setResetSentSuccess] = useState(false);

  const [pendingVerification, setPendingVerification] = useState<{
    email: string;
    pass: string;
    tag: string;
    code: string;
  } | null>(null);
  const [codeInputValue, setCodeInputValue] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setErrorMessage(null);
      setSuccessMessage(null);
      setResetSentSuccess(false);
      setPendingVerification(null);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleSwitchMode = (newMode: AuthMode) => {
    triggerAudio('tap');
    setMode(newMode);
    setErrorMessage(null);
    setSuccessMessage(null);
    setResetSentSuccess(false);
    setPendingVerification(null);

    if (newMode === 'login') {
      onNavigate('/login');
    } else if (newMode === 'register') {
      onNavigate('/createaccount');
    } else if (newMode === 'resetpassword') {
      onNavigate('/resetpassword');
    }
  };

  const handleClose = () => {
    triggerAudio('tap');
    onClose();
    onNavigate('/');
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      triggerAudio('success');
      setSuccessMessage(`Conectado como ${result.user.displayName || result.user.email}!`);

      if (result.user) {
        const fullTag = result.user.displayName || `Fa_${result.user.uid.slice(0, 4)}#000`;
        try {
          localStorage.setItem('pkxd_player_tag', fullTag);
          localStorage.setItem('pkxd_username_nickname', fullTag);
        } catch {}
      }

      if (onAddXP) {
        onAddXP(30, 'Login realizado com sucesso');
      }

      if (onSuccess) {
        onSuccess(result.user, mode);
      }

      setTimeout(() => {
        handleClose();
      }, 1100);
    } catch (error: any) {
      console.error('Google Auth failed:', error);
      const code = error?.code || '';
      let msg = error?.message || 'Falha ao conectar com o Google.';
      if (code === 'auth/popup-closed-by-user') {
        msg = 'O login foi cancelado antes de ser concluído.';
      } else if (code === 'auth/unauthorized-domain') {
        msg = `Domínio não autorizado no Firebase. Adicione ${window.location.hostname} aos Domínios Autorizados.`;
      }
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword) {
      setErrorMessage('Por favor, informe seu e-mail e senha.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const result = await signInWithEmailAndPassword(auth, loginEmail.trim(), loginPassword);
      triggerAudio('success');
      setSuccessMessage('Bem-vindo(a) de volta ao PKXD Central!');

      if (onAddXP) {
        onAddXP(20, 'Login diário');
      }

      if (onSuccess) {
        onSuccess(result.user, 'login');
      }

      setTimeout(() => {
        handleClose();
      }, 1000);
    } catch (error: any) {
      console.error('Email Login error:', error);
      const code = error?.code || '';
      let msg = 'Erro ao fazer login. Verifique seus dados.';
      if (code === 'auth/wrong-password' || code === 'auth/invalid-login-credentials' || code === 'auth/invalid-credential') {
        msg = 'Senha incorreta ou e-mail inválido.';
      } else if (code === 'auth/user-not-found') {
        msg = 'Nenhuma conta encontrada com este e-mail. Crie sua conta grátis!';
      } else if (code === 'auth/invalid-email') {
        msg = 'Formato de e-mail inválido.';
      } else if (code === 'auth/too-many-requests') {
        msg = 'Muitas tentativas sem sucesso. Tente novamente mais tarde ou redefina sua senha.';
      }
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNick = registerNickname.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '');
    const cleanNum = registerTagNumber.trim().replace(/[^0-9]/g, '');

    if (!cleanNick || cleanNick.length < 2) {
      setErrorMessage('O Nome no PK XD deve ter pelo menos 2 caracteres.');
      return;
    }
    if (!cleanNum || cleanNum.length < 1) {
      setErrorMessage('Informe a # numérica do seu PK XD (ex: 245 ou 000).');
      return;
    }
    if (!registerEmail.trim()) {
      setErrorMessage('Por favor, informe seu e-mail.');
      return;
    }
    if (registerPassword.length < 6) {
      setErrorMessage('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (registerPassword !== registerConfirmPassword) {
      setErrorMessage('As senhas não coincidem! Verifique e digite novamente.');
      return;
    }

    const fullTag = `${cleanNick}#${cleanNum}`;
    const genCode = Math.floor(100000 + Math.random() * 900000).toString();

    setPendingVerification({
      email: registerEmail.trim(),
      pass: registerPassword,
      tag: fullTag,
      code: genCode
    });
    setCodeInputValue('');
    triggerAudio('tap');
    setSuccessMessage(`Código de confirmação de 6 dígitos gerado: ${genCode}`);
  };

  const handleConfirmRegisterCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingVerification) return;

    if (codeInputValue.trim() !== pendingVerification.code) {
      setErrorMessage('Código de confirmação incorreto. Digite o código de 6 dígitos exibido acima.');
      triggerAudio('tap');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const result = await createUserWithEmailAndPassword(
        auth,
        pendingVerification.email,
        pendingVerification.pass
      );

      const fullTag = pendingVerification.tag;
      const parts = fullTag.split('#');
      const nickOnly = parts[0] || 'Explorador';
      const numberOnly = parts[1] || '000';

      try {
        localStorage.setItem('pkxd_player_tag', fullTag);
        localStorage.setItem('pkxd_nickname', nickOnly);
        localStorage.setItem('pkxd_player_number', numberOnly);
        localStorage.setItem('pkxd_username_nickname', fullTag);
      } catch {}

      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: fullTag
        });

        try {
          await setDoc(doc(db, 'leaderboard', auth.currentUser.uid), {
            name: fullTag,
            level: 1,
            xp: 50,
            flames: 1,
            email: pendingVerification.email,
            createdAt: Date.now()
          }, { merge: true });
        } catch {}
      }

      triggerAudio('levelUp');
      setSuccessMessage(`Conta criada com sua Tag ${fullTag}! Bem-vindo(a) ao PKXD Central!`);

      if (onAddXP) {
        onAddXP(50, 'Criou conta no PKXD Central');
      }

      if (onSuccess) {
        onSuccess(result.user, 'register');
      }

      setTimeout(() => {
        handleClose();
      }, 1300);
    } catch (error: any) {
      console.error('Create User error:', error);
      const code = error?.code || '';
      let msg = 'Não foi possível criar a conta.';
      if (code === 'auth/email-already-in-use') {
        msg = 'Este e-mail já está cadastrado! Faça login ou recupere sua senha.';
      } else if (code === 'auth/weak-password') {
        msg = 'A senha é muito fraca. Digite pelo menos 6 caracteres.';
      } else if (code === 'auth/invalid-email') {
        msg = 'Endereço de e-mail inválido.';
      }
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      setErrorMessage('Por favor, informe seu e-mail cadastrado.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      await sendPasswordResetEmail(auth, resetEmail.trim());
      triggerAudio('success');
      setResetSentSuccess(true);
      setSuccessMessage(`Link de redefinição enviado para ${resetEmail.trim()}. Verifique sua caixa de entrada e spam.`);
    } catch (error: any) {
      console.error('Reset Password error:', error);
      const code = error?.code || '';
      let msg = 'Erro ao enviar e-mail de recuperação.';
      if (code === 'auth/user-not-found') {
        msg = 'Nenhuma conta encontrada com este e-mail.';
      } else if (code === 'auth/invalid-email') {
        msg = 'Endereço de e-mail inválido.';
      }
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      id="pkxd-auth-modal-overlay"
      className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-4 bg-slate-900/55 backdrop-blur-sm animate-fade-in text-left"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        className="w-full max-w-lg bg-white border-2 border-slate-200 rounded-3xl shadow-2xl overflow-hidden relative text-slate-900"
      >
        {/* Top Vibrant Ribbon */}
        <div className="h-2.5 bg-gradient-to-r from-violet-600 via-pink-500 to-sky-500" />

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-5 right-4 p-2 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-600 hover:text-slate-900 rounded-full transition-colors cursor-pointer"
          title="Fechar"
          aria-label="Fechar modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 rounded-2xl bg-violet-600 text-amber-300 flex items-center justify-center shadow-sm shrink-0">
              <Zap className="w-6 h-6 fill-current" />
            </div>
            <div>
              <h2 className="font-display font-bold text-xl sm:text-2xl text-slate-900 tracking-tight">
                PKXD <span className="text-violet-700">Central</span>
              </h2>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {mode === 'login' && 'Entrar na sua Conta'}
                {mode === 'register' && 'Criar Nova Conta'}
                {mode === 'resetpassword' && 'Recuperar Senha'}
              </p>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-slate-100 rounded-2xl border border-slate-200 mt-4">
            <button
              onClick={() => handleSwitchMode('login')}
              className={`py-2 px-1 text-center font-display font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 ${
                mode === 'login'
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Entrar</span>
            </button>

            <button
              onClick={() => handleSwitchMode('register')}
              className={`py-2 px-1 text-center font-display font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 ${
                mode === 'register'
                  ? 'bg-pink-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Criar Conta</span>
            </button>

            <button
              onClick={() => handleSwitchMode('resetpassword')}
              className={`py-2 px-1 text-center font-display font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 ${
                mode === 'resetpassword'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Recuperar</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border-2 border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-800 animate-fade-in font-medium">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 bg-emerald-50 border-2 border-emerald-200 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-800 animate-fade-in font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span className="leading-relaxed">{successMessage}</span>
            </div>
          )}

          {/* 1. LOGIN VIEW */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Seu E-mail *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    placeholder="exemplo@gmail.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:bg-white transition-all font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Sua Senha *
                  </label>
                  <button
                    type="button"
                    onClick={() => handleSwitchMode('resetpassword')}
                    className="text-xs text-sky-700 hover:text-sky-900 font-bold cursor-pointer"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="pkxd-btn-primary w-full py-3.5 font-display font-bold text-sm uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Entrar no PKXD Central</span>
                  </>
                )}
              </button>

              <div className="relative my-4 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <span className="relative px-3 bg-white text-[11px] font-bold uppercase tracking-widest text-slate-400">
                  ou continue com
                </span>
              </div>

              <button
                type="button"
                disabled={isLoading}
                onClick={handleGoogleAuth}
                className="pkxd-btn-outline w-full py-3 font-display font-bold text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Conectar com Google</span>
              </button>

              <p className="text-center text-xs text-slate-600 pt-2">
                Ainda não tem conta?{' '}
                <button
                  type="button"
                  onClick={() => handleSwitchMode('register')}
                  className="text-pink-600 hover:text-pink-800 font-bold underline cursor-pointer"
                >
                  Criar conta grátis
                </button>
              </p>
            </form>
          )}

          {/* 2. REGISTER VIEW */}
          {mode === 'register' && (
            <>
              {!pendingVerification ? (
                <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-pink-700">
                        Nome no PK XD *
                      </label>
                      <div className="relative">
                        <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          required
                          maxLength={16}
                          placeholder="Ex: LUNA ou GABRIEL"
                          value={registerNickname}
                          onChange={(e) => setRegisterNickname(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ''))}
                          className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-pink-500 focus:bg-white transition-all font-mono font-bold"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-pink-700">
                        Número / Tag # *
                      </label>
                      <div className="relative flex items-center">
                        <span className="absolute left-3 font-mono font-bold text-xs text-pink-600">#</span>
                        <input
                          type="text"
                          required
                          maxLength={6}
                          placeholder="245 ou 000"
                          value={registerTagNumber}
                          onChange={(e) => setRegisterTagNumber(e.target.value.replace(/[^0-9]/g, ''))}
                          className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl pl-7 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-pink-500 focus:bg-white transition-all font-mono font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Tag preview */}
                  <div className="p-2.5 bg-violet-50 border border-violet-200 rounded-xl flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-semibold text-xs">Sua Tag PK XD:</span>
                    <span className="font-mono font-bold text-violet-900 bg-white px-2.5 py-0.5 rounded-lg border border-violet-200 text-xs">
                      {registerNickname.trim() || 'SEUNICK'}#{registerTagNumber.trim() || '000'}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
                      Seu E-mail *
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="email"
                        required
                        placeholder="exemplo@gmail.com"
                        value={registerEmail}
                        onChange={(e) => setRegisterEmail(e.target.value)}
                        className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:bg-white transition-all font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
                        Senha (mín. 6 dígitos) *
                      </label>
                      <div className="relative">
                        <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          minLength={6}
                          placeholder="••••••"
                          value={registerPassword}
                          onChange={(e) => setRegisterPassword(e.target.value)}
                          className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:bg-white transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
                        Confirmar Senha *
                      </label>
                      <div className="relative">
                        <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          minLength={6}
                          placeholder="••••••"
                          value={registerConfirmPassword}
                          onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                          className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:bg-white transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="pkxd-btn-primary w-full py-3.5 font-display font-bold text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Avançar e Criar Conta (+50 XP)</span>
                  </button>

                  <div className="relative my-3 flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200" />
                    </div>
                    <span className="relative px-3 bg-white text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      ou
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={handleGoogleAuth}
                    className="pkxd-btn-outline w-full py-2.5 font-display font-bold text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    <span>Cadastrar com Google</span>
                  </button>

                  <p className="text-center text-xs text-slate-600 pt-1">
                    Já possui uma conta?{' '}
                    <button
                      type="button"
                      onClick={() => handleSwitchMode('login')}
                      className="text-sky-700 hover:text-sky-900 font-bold underline cursor-pointer"
                    >
                      Fazer Login
                    </button>
                  </p>
                </form>
              ) : (
                <form onSubmit={handleConfirmRegisterCode} className="space-y-4">
                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-pink-50 border-2 border-pink-200 text-pink-600 flex items-center justify-center mx-auto">
                      <Mail className="w-6 h-6" />
                    </div>
                    <h3 className="font-display font-bold text-base text-slate-900 uppercase">
                      Confirmar E-mail
                    </h3>
                    <p className="text-xs text-slate-600 max-w-sm mx-auto">
                      Digite o código de 6 dígitos para{' '}
                      <strong className="text-violet-700 font-mono">{pendingVerification.email}</strong>
                    </p>
                  </div>

                  <div>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="123456"
                      value={codeInputValue}
                      onChange={(e) => setCodeInputValue(e.target.value.replace(/[^0-9]/g, ''))}
                      className="w-full bg-slate-50 border-2 border-pink-300 rounded-2xl py-3.5 text-center text-xl tracking-[0.5em] font-mono font-bold text-slate-900 focus:outline-none focus:border-pink-500 focus:bg-white transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || codeInputValue.length < 6}
                    className="pkxd-btn-primary w-full py-3.5 font-display font-bold text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Confirmar e Finalizar Cadastro</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-between text-xs pt-2">
                    <button
                      type="button"
                      onClick={() => setPendingVerification(null)}
                      className="text-slate-600 hover:text-slate-900 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Voltar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const newCode = Math.floor(100000 + Math.random() * 900000).toString();
                        setPendingVerification(prev => prev ? { ...prev, code: newCode } : null);
                        setSuccessMessage(`Novo código gerado: ${newCode}`);
                      }}
                      className="text-pink-600 hover:text-pink-800 font-bold cursor-pointer"
                    >
                      Reenviar Código
                    </button>
                  </div>
                </form>
              )}
            </>
          )}

          {/* 3. RESET PASSWORD VIEW */}
          {mode === 'resetpassword' && (
            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div className="text-center space-y-1.5 pb-2">
                <div className="w-12 h-12 rounded-2xl bg-sky-50 border-2 border-sky-200 text-sky-600 flex items-center justify-center mx-auto mb-2">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold text-base text-slate-900 uppercase">
                  Redefinir sua Senha
                </h3>
                <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                  Digite seu e-mail cadastrado abaixo para receber um link seguro e criar uma nova senha.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  E-mail da sua Conta *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    placeholder="seuemail@gmail.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white transition-all font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || resetSentSuccess}
                className="pkxd-btn-cyan w-full py-3.5 font-display font-bold text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>{resetSentSuccess ? 'E-mail Enviado' : 'Enviar Link de Recuperação'}</span>
                  </>
                )}
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => handleSwitchMode('login')}
                  className="text-xs text-violet-700 hover:text-violet-900 font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Voltar para Fazer Login</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-violet-600" />
            <span>Autenticação Segura Firebase</span>
          </div>
          <span>PKXD Central 2.0</span>
        </div>
      </motion.div>
    </div>
  );
}
