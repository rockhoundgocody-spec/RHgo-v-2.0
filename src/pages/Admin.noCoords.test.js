import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

describe('Admin page bundle', () => {
  it('ships no sample-site coordinates (seed list lives on the server)', () => {
    const src = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/Admin.jsx'), 'utf8');
    expect(src).not.toMatch(/\blat:\s*-?\d/);
    expect(src).not.toMatch(/\blng:\s*-?\d/);
    expect(src).toContain("invoke('seedAdminHotspots'");
  });
});