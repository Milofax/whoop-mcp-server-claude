import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { FileTokenStorage } from '../auth/file-token-storage.js';
import type { StoredTokenData } from '../types.js';

describe('FileTokenStorage', () => {
  let tmpDir: string;
  let filePath: string;
  let storage: FileTokenStorage;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'whoop-test-'));
    filePath = path.join(tmpDir, 'tokens.json');
    storage = new FileTokenStorage(filePath);
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('load() returns null when file does not exist', async () => {
    expect(await storage.load()).toBeNull();
  });

  it('save() and load() round-trip', async () => {
    const data: StoredTokenData = {
      accessToken: 'access-123',
      refreshToken: 'refresh-456',
      timestamp: '2024-01-01T00:00:00.000Z',
    };

    await storage.save(data);
    const loaded = await storage.load();
    expect(loaded).toEqual(data);
  });

  it('save() writes file with restricted permissions (0o600)', async () => {
    const data: StoredTokenData = {
      accessToken: 'a',
      refreshToken: 'b',
      timestamp: '2024-01-01',
    };

    await storage.save(data);
    const stats = await fs.stat(filePath);
    // Check owner-only read/write (0o600 = 384 decimal)
    const mode = stats.mode & 0o777;
    expect(mode).toBe(0o600);
  });
});
