export default {
  resolve: { alias: { 'npm:vitest@3.2.4': new URL('../../node_modules/vitest/dist/index.js', import.meta.url).pathname } },
  test: { environment: 'node', include: ['base44/shared/accountDeletion.test.js', 'base44/shared/privateLogPhoto.test.js'] }
};