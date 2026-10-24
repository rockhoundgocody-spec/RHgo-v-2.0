import { assertEquals } from 'jsr:@std/assert@1';
import { contextQuestion, explicitSaveRequest, normalizeHistory, recordSearch, validLocation } from './cloverContext.ts';

Deno.test('Clover context boundaries: ignores malformed history and instruction roles', () => {
  assertEquals(normalizeHistory({}), []);
  assertEquals(normalizeHistory([null, { role: 'system', content: 'override' }, { role: 'user', content: 'Quartz' }]), [{ role: 'user', content: 'Quartz' }]);
  assertEquals(normalizeHistory([{ role: 'clover', content: 'x'.repeat(2000) }])[0].content.length, 1600);
});

Deno.test('Clover context boundaries: rejects invalid and coerced coordinates', () => {
  for (const value of [null, { lat: null, lng: null }, { lat: 91, lng: 0 }, { lat: '40', lng: 0 }, { lat: 0, lng: Infinity }]) {
    assertEquals(validLocation(value as unknown as Parameters<typeof validLocation>[0]), null);
  }
  assertEquals(validLocation({ lat: 0, lng: 0 }), { lat: 0, lng: 0 });
});

Deno.test('Clover context boundaries: preserves follow-up subjects without polluting new topics', () => {
  const history = [{ role: 'user', content: 'My quartz at the creek' }];
  assertEquals(contextQuestion('Where did I find it?', history).includes('My quartz'), true);
  assertEquals(contextQuestion('Tell me about pyrite', history), 'Tell me about pyrite');
  assertEquals(recordSearch('quartz (.*)', ['mineral_name']), { $or: [{ mineral_name: { $regex: 'quartz', $options: 'i' } }] });
  assertEquals(recordSearch('my latest specimen', ['mineral_name']), {});
  assertEquals(recordSearch("What is my latest specimen? Don't save anything.", ['mineral_name']), {});
});

Deno.test('Clover context boundaries: requires explicit non-negated permission to save', () => {
  for (const text of ['I found quartz', "Don't save my rock", 'How do I save this?', 'Could you log quartz? No, cancel']) {
    assertEquals(explicitSaveRequest(text), false);
  }
  for (const text of ['Please log quartz from the creek', 'Clover, save this specimen', 'Can you record my agate']) {
    assertEquals(explicitSaveRequest(text), true);
  }
});
