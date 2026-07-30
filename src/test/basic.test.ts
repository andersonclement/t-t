import { describe, it, expect } from 'vitest';
import { cn, handleFirestoreError, OperationType } from '../lib/utils';

describe('cn utility', () => {
  it('merges class names', () => {
    expect(cn('px-2', 'py-1')).toBe('px-2 py-1');
  });

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'extra')).toBe('base extra');
  });

  it('deduplicates conflicting tailwind classes', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });

  it('handles empty inputs', () => {
    expect(cn()).toBe('');
  });
});

describe('handleFirestoreError', () => {
  it('throws a sanitized error with operation details', () => {
    const mockAuth = {
      currentUser: { uid: 'user-123', email: 'test@test.com', emailVerified: true }
    };

    expect(() =>
      handleFirestoreError(new Error('permission-denied'), OperationType.GET, 'users/123', mockAuth)
    ).toThrow('[DATA_SERVICE_ERROR]');
  });

  it('masks user email in thrown error', () => {
    const mockAuth = {
      currentUser: { uid: 'u1', email: 'secret@mail.com', emailVerified: false }
    };

    try {
      handleFirestoreError(new Error('fail'), OperationType.LIST, 'orders', mockAuth);
    } catch (e: unknown) {
      const msg = (e as Error).message;
      expect(msg).not.toContain('secret@mail.com');
      expect(msg).toContain('EMAIL_SET');
      expect(msg).toContain('"operationType":"list"');
    }
  });

  it('handles missing auth gracefully', () => {
    expect(() =>
      handleFirestoreError('string error', OperationType.CREATE, null, null)
    ).toThrow('[DATA_SERVICE_ERROR]');
  });
});

describe('OperationType enum', () => {
  it('has expected values', () => {
    expect(OperationType.CREATE).toBe('create');
    expect(OperationType.UPDATE).toBe('update');
    expect(OperationType.DELETE).toBe('delete');
    expect(OperationType.LIST).toBe('list');
    expect(OperationType.GET).toBe('get');
    expect(OperationType.WRITE).toBe('write');
  });
});
