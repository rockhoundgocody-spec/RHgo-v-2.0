import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.hoisted(() => {
  if (typeof globalThis.window === 'undefined') {
    globalThis.window = {
      self: {},
      top: {},
      location: { search: '', href: '', pathname: '' },
    };
  }
});

let stateStore = { currentId: 0, values: {} };

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useId: () => ':r0:',
    useState: (initial) => {
      const id = stateStore.currentId++;
      if (!(id in stateStore.values)) {
        stateStore.values[id] = typeof initial === 'function' ? initial() : initial;
      }
      const setState = (val) => {
        stateStore.values[id] = typeof val === 'function' ? val(stateStore.values[id]) : val;
      };
      return [stateStore.values[id], setState];
    },
  };
});

import SkillsSection from './SkillsSection.jsx';

describe('SkillsSection Component', () => {
  beforeEach(() => {
    stateStore = { currentId: 0, values: {} };
  });

  function renderComponent() {
    stateStore.currentId = 0;
    return SkillsSection();
  }

  it('renders glass panel with header and skills list', () => {
    const tree = renderComponent();
    expect(tree).toBeDefined();
    expect(tree.props.className).toContain('mb-8');

    const header = tree.props.children[0];
    expect(header.props.children[0].props.children[1].props.children).toBe('Skills & Certifications');
    expect(header.props.children[1].props.children).toBe('500+ Prompts');

    const list = tree.props.children[1];
    expect(list.props.children.length).toBeGreaterThan(0);
  });

  it('renders skill cards with titles, levels, ARIA accessibility attributes and chevron icon aria-hidden="true"', () => {
    const tree = renderComponent();
    const list = tree.props.children[1];
    const firstSkillCard = list.props.children[0];

    // First skill is SkillCard
    expect(firstSkillCard.key).toBe('text');
    const skillData = firstSkillCard.props.skill;
    expect(skillData.title).toBe('Text Prompting');
    expect(skillData.level).toBe('Intermediate');

    // Call SkillCard component directly
    stateStore.currentId = 0;
    const skillCardTree = firstSkillCard.type({ skill: skillData });

    expect(skillCardTree.type).toBe('button');
    expect(skillCardTree.props.type).toBe('button');
    expect(skillCardTree.props['aria-expanded']).toBe(false);
    expect(skillCardTree.props['aria-controls']).toBeDefined();

    // Verify chevron has aria-hidden="true"
    const flexContainer = skillCardTree.props.children[0];
    const rightSide = flexContainer.props.children[2];
    const chevronIcon = rightSide.props.children[1];
    expect(chevronIcon.props['aria-hidden']).toBe('true');
  });

  it('toggles skill details on click and expands description panel', () => {
    const skillData = {
      id: 'text',
      emoji: '✍️',
      title: 'Text Prompting',
      level: 'Intermediate',
      color: '#a78bfa',
      tags: ['CROFTC', 'Copywriting'],
      description: '50 text-based prompt recipes.',
    };

    stateStore = { currentId: 0, values: {} };
    let skillCardTree = SkillsSection().props.children[1].props.children[0].type({ skill: skillData });

    expect(skillCardTree.props['aria-expanded']).toBe(false);
    expect(skillCardTree.props.children[1]).toBeFalsy(); // Description panel closed

    // Simulate clicking accordion button
    skillCardTree.props.onClick();

    // Re-render SkillCard
    stateStore.currentId = 0;
    skillCardTree = SkillsSection().props.children[1].props.children[0].type({ skill: skillData });

    expect(skillCardTree.props['aria-expanded']).toBe(true);

    const descPanel = skillCardTree.props.children[1];
    expect(descPanel).toBeDefined();
    expect(descPanel.props.id).toBe(skillCardTree.props['aria-controls']);
    expect(descPanel.props.children).toBe('50 text-based prompt recipes.');
  });
});
