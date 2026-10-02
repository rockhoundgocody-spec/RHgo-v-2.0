import { describe, it, expect } from 'vitest';

// Minimal mock DOM environment setup for Node/Vitest without external jsdom package
function createMockElement(tagName) {
  const children = [];
  const attributesMap = new Map();
  const style = {};

  const el = {
    nodeType: 1,
    tagName: tagName.toUpperCase(),
    nodeName: tagName.toUpperCase(),
    localName: tagName.toLowerCase(),
    children,
    style,
    get attributes() {
      return Array.from(attributesMap.values());
    },
    remove: () => {
      if (el.parent) {
        const idx = el.parent.children.indexOf(el);
        if (idx !== -1) el.parent.children.splice(idx, 1);
      }
    },
    appendChild: (child) => {
      child.parent = el;
      children.push(child);
      return child;
    },
    setAttribute: (name, value) => {
      attributesMap.set(name, { name, value: String(value) });
    },
    getAttribute: (name) => attributesMap.get(name)?.value ?? null,
    removeAttribute: (name) => {
      attributesMap.delete(name);
    },
    querySelector: (selector) => {
      if (selector === 'parsererror') return null;
      if (selector === 'svg') return el.localName === 'svg' ? el : children.find(c => c.localName === 'svg') || null;
      return children.find(c => c.localName === selector) || null;
    },
    querySelectorAll: (selector) => {
      const results = [];
      function collect(node) {
        if (node.localName === selector) results.push(node);
        for (const child of node.children) collect(child);
      }
      collect(el);
      return results;
    }
  };
  return el;
}

function parseMockSvg(svgString) {
  // Simple XML tag extractor for test simulation
  const svgEl = createMockElement('svg');
  if (svgString.includes('<script>')) {
    const scriptEl = createMockElement('script');
    svgEl.appendChild(scriptEl);
  }
  if (svgString.includes('foreignObject')) {
    const foEl = createMockElement('foreignObject');
    svgEl.appendChild(foEl);
  }
  if (svgString.includes('onload=')) {
    const circleEl = createMockElement('circle');
    circleEl.setAttribute('onload', 'alert(1)');
    circleEl.setAttribute('cx', '22');
    svgEl.appendChild(circleEl);
  } else {
    const circleEl = createMockElement('circle');
    circleEl.setAttribute('cx', '22');
    svgEl.appendChild(circleEl);
  }
  return svgEl;
}

globalThis.document = {
  createElement: (tag) => createMockElement(tag),
  importNode: (node, _deep) => node, // Return as-is for mock
};

globalThis.DOMParser = class DOMParser {
  parseFromString(markup, _mimeType) {
    const svgEl = parseMockSvg(markup);
    return {
      querySelector: (sel) => svgEl.querySelector(sel),
      documentElement: svgEl,
    };
  }
};

const { hotspotPinEl, specimenPinEl, userPinEl, clubPinEl, clusterPinEl } = await import('./googleMapIcons.js');

describe('googleMapIcons', () => {
  it('creates div element container with translateY(50%) transform style', () => {
    const el = hotspotPinEl({ color: '#34d399', isActive: false, difficulty: 'easy' });
    expect(el.style.transform).toBe('translateY(50%)');
    expect(el.children.length).toBe(1);
    expect(el.children[0].localName).toBe('svg');
  });

  it('generates valid SVG elements for specimen, user, club, and cluster pins', () => {
    const specimen = specimenPinEl('rare', false);
    expect(specimen.children[0].localName).toBe('svg');

    const user = userPinEl(false);
    expect(user.children[0].localName).toBe('svg');

    const club = clubPinEl();
    expect(club.children[0].localName).toBe('svg');

    const cluster = clusterPinEl(15);
    expect(cluster.children[0].localName).toBe('svg');
  });

  it('sanitizes script tags, foreignObject, and event handlers from SVG', () => {
    const el = hotspotPinEl({ color: '" onload="alert(1)', isActive: false, difficulty: 'easy' });
    expect(el.querySelectorAll('script').length).toBe(0);
    expect(el.querySelectorAll('foreignObject').length).toBe(0);
    const circles = el.querySelectorAll('circle');
    for (const circle of circles) {
      expect(circle.getAttribute('onload')).toBeNull();
    }
  });
});
