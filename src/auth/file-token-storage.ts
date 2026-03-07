import fs from 'node:fs/promises';
import type { ITokenStorage, StoredTokenData } from '../types.js';

export class FileTokenStorage implements ITokenStorage {
  constructor(private readonly filePath: string) {}

  async load(): Promise<StoredTokenData | null> {
    try {
      const raw = await fs.readFile(this.filePath, 'utf8');
      return JSON.parse(raw) as StoredTokenData;
    } catch {
      return null;
    }
  }

  async save(data: StoredTokenData): Promise<void> {
    await fs.writeFile(this.filePath, JSON.stringify(data, null, 2), { mode: 0o600 });
  }
}
