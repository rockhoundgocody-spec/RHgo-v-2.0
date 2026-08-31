import { beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useState: (initial) => [typeof initial === 'function' ? initial() : initial, vi.fn()],
  };
});

vi.mock('@/api/base44Client', () => ({
  base44: {
    functions: { invoke: vi.fn() },
  },
}));

function findByProp(node, prop, value, matches = []) {
  if (!node) return matches;
  if (Array.isArray(node)) {
    for (const item of node) findByProp(item, prop, value, matches);
    return matches;
  }
  if (typeof node !== 'object') return matches;
  if (node.props?.[prop] === value) matches.push(node);
  const children = node.props?.children;
  if (children) {
    if (Array.isArray(children)) {
      for (const child of children) findByProp(child, prop, value, matches);
    } else {
      findByProp(children, prop, value, matches);
    }
  }
  return matches;
}

function findByType(node, type, matches = []) {
  if (!node) return matches;
  if (Array.isArray(node)) {
    for (const item of node) findByType(item, type, matches);
    return matches;
  }
  if (typeof node !== 'object') return matches;
  if (node.type === type) matches.push(node);
  const children = node.props?.children;
  if (children) {
    if (Array.isArray(children)) {
      for (const child of children) findByType(child, type, matches);
    } else {
      findByType(children, type, matches);
    }
  }
  return matches;
}

let PostCard;

beforeAll(async () => {
  const mockWindow = { location: { origin: 'http://localhost' } };
  mockWindow.self = mockWindow;
  mockWindow.top = mockWindow;
  globalThis.window = mockWindow;
  PostCard = (await import('./PostCard.jsx')).default;
});

describe('PostCard pure rendering and accessibility', () => {
  const samplePost = {
    id: 'post-1',
    author_name: 'Alex',
    created_date: new Date().toISOString(),
    body: 'Found a great specimen! §topic:crystalsystem§',
    image_url: 'https://example.com/specimen.jpg',
    mineral_name: 'Amethyst',
    rarity: 'rare',
    post_type: 'find_share',
    reactions: { fire: 2, gem: 1, clap: 0, wow: 0 },
    reactors: [],
    comments: [],
  };

  it('renders image with descriptive alt attribute matching mineral name', () => {
    const tree = PostCard({ post: samplePost, myEmail: 'alex@example.com', myVoteId: null });
    const imgs = findByType(tree, 'img');
    expect(imgs.length).toBeGreaterThan(0);
    expect(imgs[0].props.alt).toBe('Amethyst specimen');
  });

  it('provides ARIA attributes for voting, reactions, and comments toggle', () => {
    const tree = PostCard({ post: samplePost, myEmail: 'alex@example.com', myVoteId: null });

    // Vote button
    const voteBtn = findByProp(tree, 'aria-label', 'Vote for Find of the Week');
    expect(voteBtn).toHaveLength(1);
    expect(voteBtn[0].props['aria-pressed']).toBe(false);

    // Reaction buttons
    const fireReactBtn = findByProp(tree, 'aria-label', 'React with fire');
    expect(fireReactBtn).toHaveLength(1);
    expect(fireReactBtn[0].props['aria-pressed']).toBe(false);

    // Comments toggle button
    const commentToggleBtn = findByProp(tree, 'aria-label', 'Show comments');
    expect(commentToggleBtn).toHaveLength(1);
    expect(commentToggleBtn[0].props['aria-expanded']).toBe(false);
    expect(commentToggleBtn[0].props['aria-controls']).toBe('comments-post-1');
  });
});
