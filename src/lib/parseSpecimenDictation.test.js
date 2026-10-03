import { describe, it, expect, vi } from 'vitest';
import { handleParseSpecimenDictation } from '../../base44/functions/parseSpecimenDictation/parseDictation.ts';

describe('parseSpecimenDictation error sanitization', () => {
  it('returns sanitized error response when handler encounters an exception', async () => {
    const mockBase44 = {
      auth: {
        me: vi.fn().mockRejectedValue(new Error('postgres://user:secret@localhost:5432/db connection error')),
      },
    };

    const spyConsole = vi.spyOn(console, 'error').mockImplementation(() => {});

    const mockReq = new Request('https://api.base44.com/functions/parseSpecimenDictation', {
      method: 'POST',
      body: JSON.stringify({ transcript: 'Found some nice quartz' }),
    });

    const response = await handleParseSpecimenDictation(mockReq, mockBase44);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({ error: 'Failed to parse dictation' });
    expect(json.error).not.toContain('postgres');
    expect(json.error).not.toContain('secret');
    expect(spyConsole).toHaveBeenCalledWith(
      'parseSpecimenDictation error:',
      expect.any(Error)
    );

    spyConsole.mockRestore();
  });
});
