import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null, auth: any) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  
  // Log full error for internal debugging/monitoring
  console.error('Firestore Error Detail: ', JSON.stringify(errInfo));
  
  // Mask sensitive info in the error thrown to potentially bubble up to UI
  const sanitizedErrInfo = {
    ...errInfo,
    authInfo: {
      userId: auth?.currentUser?.uid ? 'UID_SET' : 'UID_MISSING',
      email: auth?.currentUser?.email ? 'EMAIL_SET' : 'EMAIL_MISSING',
      emailVerified: auth?.currentUser?.emailVerified,
    }
  };

  throw new Error(`[DATA_SERVICE_ERROR] ${JSON.stringify(sanitizedErrInfo)}`);
}
