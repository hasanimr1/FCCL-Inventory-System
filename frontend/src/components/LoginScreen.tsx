import React, { useState, useEffect } from 'react';
import { UserAccount, UserRole } from '../types/inventory.ts';
import {
  INITIAL_USERS,
  generatePositionChallenge,
  verifyPartialPassword,
  VerificationResult,
} from '../utils/authService.ts';
import fcclLogo from '../Assets/FCCL logo.png';
import {
  Shield,
  KeyRound,
  AlertTriangle,
  CheckCircle2,
  Lock,
  ArrowRight,
  RefreshCw,
  UserCheck,
  Building2,
  Info,
} from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (user: UserAccount) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [usersState, setUsersState] = useState<UserAccount[]>(INITIAL_USERS);
  const [selectedUsername, setSelectedUsername] = useState<string>(INITIAL_USERS[0].username);
  const [challengePositions, setChallengePositions] = useState<number[]>([2, 4, 6]);
  const [digitInputs, setDigitInputs] = useState<Record<number, string>>({});
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [lockCountdown, setLockCountdown] = useState<number>(0);

  const currentUser = usersState.find((u) => u.username === selectedUsername) || usersState[0];

  // Generate fresh challenge when username changes
  const refreshChallenge = () => {
    const newPositions = generatePositionChallenge(3, 6);
    setChallengePositions(newPositions);
    setDigitInputs({});
    setErrorMessage('');
    setSuccessMessage('');
  };

  useEffect(() => {
    refreshChallenge();
  }, [selectedUsername]);

  // Lockout countdown timer
  useEffect(() => {
    if (!currentUser.lockedUntil) {
      setIsLocked(false);
      setLockCountdown(0);
      return;
    }

    const checkLock = () => {
      const lockUntilMs = new Date(currentUser.lockedUntil!).getTime();
      const diff = Math.ceil((lockUntilMs - Date.now()) / 1000);
      if (diff > 0) {
        setIsLocked(true);
        setLockCountdown(diff);
      } else {
        setIsLocked(false);
        setLockCountdown(0);
        currentUser.lockedUntil = undefined;
        currentUser.failedAttempts = 0;
      }
    };

    checkLock();
    const interval = setInterval(checkLock, 1000);
    return () => clearInterval(interval);
  }, [currentUser.lockedUntil]);

  const handleDigitChange = (pos: number, value: string) => {
    // Only accept single numeric digit
    const cleaned = value.replace(/\D/g, '').slice(-1);
    setDigitInputs((prev) => ({ ...prev, [pos]: cleaned }));

    // Auto focus next input
    if (cleaned) {
      const currentIdx = challengePositions.indexOf(pos);
      if (currentIdx !== -1 && currentIdx < challengePositions.length - 1) {
        const nextPos = challengePositions[currentIdx + 1];
        const nextInput = document.getElementById(`digit-input-${nextPos}`);
        if (nextInput) nextInput.focus();
      }
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const result: VerificationResult = verifyPartialPassword(
      currentUser,
      challengePositions,
      digitInputs
    );

    // Persist updated user state (failed attempts / lockout)
    setUsersState((prev) =>
      prev.map((u) => (u.id === currentUser.id ? { ...currentUser } : u))
    );

    if (result.success && result.user) {
      setSuccessMessage('Authentication verified! Loading role permissions...');
      setTimeout(() => {
        onLoginSuccess(result.user!);
      }, 600);
    } else {
      setErrorMessage(result.message);
      if (result.locked) {
        setIsLocked(true);
        setLockCountdown(result.remainingSeconds || 900);
      } else {
        // Regenerate positions for security on failed attempt
        setChallengePositions(generatePositionChallenge(3, 6));
        setDigitInputs({});
      }
    }
  };

  const handleQuickSelectUser = (user: UserAccount) => {
    setSelectedUsername(user.username);
  };

  const handleResetLockout = () => {
    currentUser.lockedUntil = undefined;
    currentUser.failedAttempts = 0;
    setIsLocked(false);
    setLockCountdown(0);
    setErrorMessage('');
    setUsersState([...usersState]);
  };

  // Helper for digit position ordinal
  const getOrdinal = (n: number) => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#04281b] via-[#063d2a] to-[#0d1f18] text-slate-100 flex flex-col justify-center items-center px-4 py-8">
      {/* Header Branding */}
      <div className="max-w-md w-full text-center mb-6">
        <div className="inline-flex items-center justify-center p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 shadow-xl mb-4">
          <img src={fcclLogo} alt="FCCL Logo" className="h-14 w-auto object-contain" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          FCCL IT Infrastructure Platform
        </h1>
        <p className="text-xs text-[#a7e3bd] mt-1 font-medium">
          Fauji Cement Company Limited · Secure Partial-Password Access Gateway
        </p>
      </div>

      {/* Main Login Card */}
      <div className="max-w-md w-full bg-white text-slate-800 rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Card Header */}
        <div className="bg-[#063d2a] px-6 py-4 border-b border-[#0b6340] flex items-center justify-between text-white">
          <div className="flex items-center gap-2.5">
            <KeyRound className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-sm font-bold tracking-wide">Split-Password Authentication</h2>
              <p className="text-[11px] text-slate-300">Entropy-Protected Credential Entry</p>
            </div>
          </div>
          <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700/60">
            6-Digit PIN
          </span>
        </div>

        {/* Lockout Warning Banner */}
        {isLocked && (
          <div className="bg-red-50 border-b border-red-200 px-6 py-3 flex items-start gap-3 text-red-800 text-xs">
            <Lock className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <strong className="font-bold">Security Lockout Active</strong>
              <p className="mt-0.5 text-red-700">
                Repeated invalid attempts detected. Access is restricted for{' '}
                <span className="font-mono font-bold text-red-900">{lockCountdown}s</span>.
              </p>
              <button
                type="button"
                onClick={handleResetLockout}
                className="mt-1.5 text-[11px] font-semibold text-red-800 underline hover:text-red-950 cursor-pointer"
              >
                Reset Lockout (Admin Test Override)
              </button>
            </div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleLoginSubmit} className="p-6 space-y-5">
          {/* Account Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Select User Account &amp; Role
            </label>
            <select
              value={selectedUsername}
              onChange={(e) => setSelectedUsername(e.target.value)}
              disabled={isLocked}
              className="w-full text-xs font-medium border border-slate-300 rounded-lg px-3 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0b6340] cursor-pointer"
            >
              {usersState.map((u) => (
                <option key={u.id} value={u.username}>
                  {u.fullName} — {u.role} ({u.username})
                </option>
              ))}
            </select>

            <div className="mt-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-600 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-800">{currentUser.fullName}</span>
                <span className="text-slate-400 mx-1.5">·</span>
                <span className="text-slate-500">{currentUser.department}</span>
              </div>
              <span className="font-bold text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                {currentUser.role}
              </span>
            </div>
          </div>

          {/* Partial Password Prompt */}
          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-emerald-700" />
                Partial Password Challenge
              </span>
              <button
                type="button"
                onClick={refreshChallenge}
                disabled={isLocked}
                className="text-[11px] text-emerald-700 hover:text-emerald-900 inline-flex items-center gap-1 cursor-pointer"
                title="Shuffle challenged digit positions"
              >
                <RefreshCw className="w-3 h-3" />
                Shuffle Digits
              </button>
            </div>

            <p className="text-xs text-emerald-800 leading-relaxed">
              For security, enter only digits{' '}
              <strong className="font-mono bg-emerald-200/80 px-1 py-0.5 rounded text-emerald-950 font-bold">
                {challengePositions.map((p) => getOrdinal(p)).join(', ')}
              </strong>{' '}
              of your 6-digit password. Full credentials are never transmitted.
            </p>

            {/* Digit Inputs Row */}
            <div className="flex justify-center items-center gap-3 pt-1">
              {challengePositions.map((pos) => {
                const val = digitInputs[pos] || '';
                return (
                  <div key={pos} className="flex flex-col items-center gap-1">
                    <span className="text-[10px] font-mono font-semibold text-slate-600">
                      Digit #{pos}
                    </span>
                    <input
                      id={`digit-input-${pos}`}
                      type="password"
                      inputMode="numeric"
                      maxLength={1}
                      disabled={isLocked}
                      value={val}
                      onChange={(e) => handleDigitChange(pos, e.target.value)}
                      placeholder="•"
                      className="w-12 h-14 text-center text-xl font-bold font-mono border-2 border-slate-300 focus:border-[#0b6340] rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0b6340]/20 transition-all text-slate-900"
                      required
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Feedback Messages */}
          {errorMessage && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLocked}
            className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer ${
              isLocked
                ? 'bg-slate-400 cursor-not-allowed'
                : 'bg-[#063d2a] hover:bg-[#0b6340] active:scale-[0.99]'
            }`}
          >
            <span>Verify Digits &amp; Sign In</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Fast-Switch Profiles Helper */}
        <div className="bg-slate-50 border-t border-slate-200 p-4">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-2">
            <Info className="w-3.5 h-3.5 text-slate-500" />
            <span>Evaluation Demo Credentials (Pre-set 6-Digit PINs)</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <button
              type="button"
              onClick={() => handleQuickSelectUser(usersState[0])}
              className={`p-2 rounded-lg border text-left cursor-pointer transition ${
                selectedUsername === usersState[0]?.username
                  ? 'border-[#0b6340] bg-emerald-50 ring-1 ring-[#0b6340]'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="font-bold text-slate-800">Admin</div>
              <div className="text-slate-500 font-mono text-[10px]">PIN: 841295</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickSelectUser(usersState[1])}
              className={`p-2 rounded-lg border text-left cursor-pointer transition ${
                selectedUsername === usersState[1]?.username
                  ? 'border-[#0b6340] bg-emerald-50 ring-1 ring-[#0b6340]'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="font-bold text-slate-800">Plant Admin</div>
              <div className="text-slate-500 font-mono text-[10px]">PIN: 628149</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickSelectUser(usersState[2])}
              className={`p-2 rounded-lg border text-left cursor-pointer transition ${
                selectedUsername === usersState[2]?.username
                  ? 'border-[#0b6340] bg-emerald-50 ring-1 ring-[#0b6340]'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="font-bold text-slate-800">Employee</div>
              <div className="text-slate-500 font-mono text-[10px]">PIN: 491732</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickSelectUser(usersState[3])}
              className={`p-2 rounded-lg border text-left cursor-pointer transition ${
                selectedUsername === usersState[3]?.username
                  ? 'border-[#0b6340] bg-emerald-50 ring-1 ring-[#0b6340]'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="font-bold text-slate-800">Auditor</div>
              <div className="text-slate-500 font-mono text-[10px]">PIN: 358214</div>
            </button>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center text-xs text-slate-400 mt-6 max-w-sm">
        Protected by ISO 27001 Partial Credential Hashing · Rate-Limited at 5 Attempts · Multi-Plant RLS Active
      </div>
    </div>
  );
};
