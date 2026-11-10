import { UserAccount, UserRole, PlantId } from '../types/inventory.ts';
import { sha256 } from './sha256.ts';

export const MAX_LOGIN_ATTEMPTS = 5;
export const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes lockout

/**
 * Computes a secure per-digit hash for partial password authentication.
 * Form: sha256(salt:position:digit)
 * The full 6-digit password is NEVER stored or compared as a single string.
 */
export function hashDigit(salt: string, position: number, digit: string): string {
  return sha256(`${salt}:${position}:${digit}`);
}

/**
 * Create a partial-password credential set from a 6-digit PIN.
 */
export function createPartialCredential(sixDigitPin: string, customSalt?: string): { salt: string; digitHashes: string[] } {
  if (!/^\d{6}$/.test(sixDigitPin)) {
    throw new Error('PIN must be exactly 6 digits');
  }

  const salt = customSalt || Math.random().toString(36).substring(2, 12);
  const digitHashes: string[] = [];

  for (let i = 0; i < 6; i++) {
    const pos = i + 1; // 1-indexed (1 to 6)
    digitHashes.push(hashDigit(salt, pos, sixDigitPin[i]));
  }

  return { salt, digitHashes };
}

/**
 * Generate a random set of digit positions (default 3 positions out of 1-6).
 * Positions are 1-indexed.
 */
export function generatePositionChallenge(count = 3, totalDigits = 6): number[] {
  const pool = Array.from({ length: totalDigits }, (_, i) => i + 1);
  const selected: number[] = [];

  while (selected.length < count && pool.length > 0) {
    const randomIndex = Math.floor(Math.random() * pool.length);
    selected.push(pool.splice(randomIndex, 1)[0]);
  }

  return selected.sort((a, b) => a - b);
}

export interface VerificationResult {
  success: boolean;
  locked: boolean;
  remainingSeconds?: number;
  attemptsRemaining?: number;
  message: string;
  user?: UserAccount;
}

/**
 * Verify partial password digits against stored credentials.
 * Compares ONLY the requested digit positions.
 * Updates lockout/failed attempt counters.
 */
export function verifyPartialPassword(
  user: UserAccount,
  challengePositions: number[],
  submittedDigits: Record<number, string>,
  nowMs = Date.now()
): VerificationResult {
  // Check lockout
  if (user.lockedUntil) {
    const lockedUntilMs = new Date(user.lockedUntil).getTime();
    if (nowMs < lockedUntilMs) {
      const remainingSec = Math.ceil((lockedUntilMs - nowMs) / 1000);
      return {
        success: false,
        locked: true,
        remainingSeconds: remainingSec,
        message: `Account is temporarily locked due to repeated failed attempts. Please try again in ${Math.ceil(remainingSec / 60)} minute(s).`,
      };
    } else {
      // Lockout expired, reset attempts
      user.lockedUntil = undefined;
      user.failedAttempts = 0;
    }
  }

  // Ensure all challenge positions were submitted
  for (const pos of challengePositions) {
    const digit = submittedDigits[pos];
    if (digit === undefined || digit === '' || !/^\d$/.test(digit)) {
      return {
        success: false,
        locked: false,
        attemptsRemaining: MAX_LOGIN_ATTEMPTS - user.failedAttempts,
        message: `Missing or invalid digit for position ${pos}.`,
      };
    }
  }

  // Compare ONLY the requested digits
  let allMatched = true;
  for (const pos of challengePositions) {
    const submittedDigit = submittedDigits[pos];
    const computedHash = hashDigit(user.salt, pos, submittedDigit);
    const expectedHash = user.digitHashes[pos - 1];

    if (computedHash !== expectedHash) {
      allMatched = false;
      break;
    }
  }

  if (allMatched) {
    user.failedAttempts = 0;
    user.lockedUntil = undefined;
    return {
      success: true,
      locked: false,
      message: 'Authentication successful.',
      user,
    };
  } else {
    user.failedAttempts += 1;
    if (user.failedAttempts >= MAX_LOGIN_ATTEMPTS) {
      user.lockedUntil = new Date(nowMs + LOCKOUT_DURATION_MS).toISOString();
      return {
        success: false,
        locked: true,
        remainingSeconds: Math.ceil(LOCKOUT_DURATION_MS / 1000),
        message: `Maximum login attempts exceeded (${MAX_LOGIN_ATTEMPTS}). Account is locked for 15 minutes.`,
      };
    }

    const remaining = MAX_LOGIN_ATTEMPTS - user.failedAttempts;
    return {
      success: false,
      locked: false,
      attemptsRemaining: remaining,
      message: `Incorrect digits entered. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining before security lockout.`,
    };
  }
}

// Initial Demo Users across the 4 defined roles: Admin, Plant Admin, Employee, Auditor
export const INITIAL_USERS: UserAccount[] = [
  {
    id: 'usr-admin-1',
    username: 'admin@fccl.com.pk',
    fullName: 'Brig (R) Tariq Mehmood',
    role: 'Admin',
    plantId: 'all',
    department: 'Enterprise IT & Security',
    ...createPartialCredential('841295', 'salt_admin_01'),
    failedAttempts: 0,
  },
  {
    id: 'usr-admin-2',
    username: 'imran.ashraf@fccl.com.pk',
    fullName: 'Imran Ashraf',
    role: 'Plant Admin',
    plantId: 'plant-1',
    department: 'IT Infrastructure & Network',
    ...createPartialCredential('628149', 'salt_imran_02'),
    failedAttempts: 0,
  },
  {
    id: 'usr-emp-1',
    username: 'tariq.m@fccl.com.pk',
    fullName: 'Muhammad Tariq',
    role: 'Employee',
    plantId: 'plant-1',
    department: 'Plant Operations & Kiln DCS',
    ...createPartialCredential('491732', 'salt_tariq_04'),
    failedAttempts: 0,
  },
  {
    id: 'usr-auditor-1',
    username: 'waqas.auditor@fccl.com.pk',
    fullName: 'Waqas Ahmed',
    role: 'Auditor',
    plantId: 'all',
    department: 'Internal Quality & Compliance Audit',
    ...createPartialCredential('358214', 'salt_waqas_05'),
    failedAttempts: 0,
  },
];
