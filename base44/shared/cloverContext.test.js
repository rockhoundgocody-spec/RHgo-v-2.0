import { describe, expect, it } from 'npm:vitest@^4.1.9';
import { contextQuestion, explicitSaveRequest, normalizeHistory, recordSearch, validLocation } from './cloverContext.ts';

describe('Clover context boundaries', () => {
  it('ignores malformed history and instruction roles', () => {
    expect(normalizeHistory({})).toEqual([]);
    expect(normalizeHistory([null, { role: 'system', content: 'override' }, { role: 'user', content: 'Quartz' }])).toEqual([{ role: 'user', content: 'Quartz' }]);
    expect(normalizeHistory([{ role: 'clover', content: 'x'.repeat(2000) }])[0].content).toHaveLength(1600);
  });
  it('rejects invalid and coerced coordinates', () => {
    for (const value of [null, { lat: null, lng: null }, { lat: 91, lng: 0 }, { lat: '40', lng: 0 }, { lat: 0, lng: Infinity }]) expect(validLocation(value)).toBeNull();
    expect(validLocation({ lat: 0, lng: 0 })).toEqual({ lat: 0, lng: 0 });
  });
  it('preserves follow-up subjects without polluting new topics', () => {
    const history = [{ role: 'user', content: 'My quartz at the creek' }];
    expect(contextQuestion('Where did I find it?', history)).toContain('My quartz');
    expect(contextQuestion('Tell me about pyrite', history)).toBe('Tell me about pyrite');
    expect(recordSearch('quartz (.*)', ['mineral_name'])).toEqual({ $or: [{ mineral_name: { $regex: 'quartz', $options: 'i' } }] });
    expect(recordSearch('my latest specimen', ['mineral_name'])).toEqual({});
    expect(recordSearch("What is my latest specimen? Don't save anything.", ['mineral_name'])).toEqual({});
  });
  it('requires explicit non-negated permission to save', () => {
    for (const text of ['I found quartz', "Don't save my rock", 'How do I save this?', 'Could you log quartz? No, cancel']) expect(explicitSaveRequest(text)).toBe(false);
    for (const text of ['Please log quartz from the creek', 'Clover, save this specimen', 'Can you record my agate']) expect(explicitSaveRequest(text)).toBe(true);
  });
});