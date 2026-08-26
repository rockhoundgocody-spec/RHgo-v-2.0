import React from "react";
/**
 * RockHound-GO Accessibility Framework
 * WCAG 2.1 AA compliance + reduced motion support
 * Voice navigation + screen reader optimization
 */

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Apply safe animations (respects user preferences)
 */
export function applySafeAnimation(animationName, fallback = 'none') {
  return prefersReducedMotion() ? fallback : animationName;
}

/**
 * Screen reader announcement utility
 */
export function announceToScreen(message, priority = 'polite') {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only'; // Visually hidden
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Auto-remove after announcement
  setTimeout(() => announcement.remove(), 2000);
}

/**
 * Keyboard navigation helpers
 */
export const KEYMAP = {
  ESCAPE: 'Escape',
  ENTER: 'Enter',
  SPACE: ' ',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  TAB: 'Tab',
};

/**
 * Handle focus trap (for modals, drawers)
 */
export function createFocusTrap(containerElement) {
  const focusableElements = containerElement.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const handleKeyDown = (e) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        lastElement.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastElement) {
        firstElement.focus();
        e.preventDefault();
      }
    }
  };

  containerElement.addEventListener('keydown', handleKeyDown);

  return () => containerElement.removeEventListener('keydown', handleKeyDown);
}

/**
 * Skip to main content link (always include on pages)
 */
export const SkipToMainLink = () => (
  <a
    href="#main-content"
    className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 bg-amethyst text-black px-4 py-2 font-bold"
  >
    Skip to main content
  </a>
);

/**
 * Color contrast validator (WCAG AA normal text).
 * Supports three- and six-digit hexadecimal colors.
 */
function parseHexColor(value) {
  if (typeof value !== 'string') return null;
  const match = value.trim().match(/^#([\da-f]{3}|[\da-f]{6})$/i);
  if (!match) return null;
  const expanded = match[1].length === 3
    ? [...match[1]].map((character) => character.repeat(2)).join('')
    : match[1];
  return [0, 2, 4].map((offset) => Number.parseInt(expanded.slice(offset, offset + 2), 16));
}

function getRelativeLuminance(color) {
  const channels = parseHexColor(color);
  if (!channels) return null;
  const [red, green, blue] = channels.map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.04045
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

export function getContrastRatio(hexColor1, hexColor2) {
  const l1 = getRelativeLuminance(hexColor1);
  const l2 = getRelativeLuminance(hexColor2);
  if (l1 == null || l2 == null) return null;

  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

export function validateContrast(hexColor1, hexColor2) {
  const contrast = getContrastRatio(hexColor1, hexColor2);
  return contrast != null && contrast >= 4.5;
}

/**
 * Alt text generator for specimen images
 */
export function generateAltText(specimen) {
  const parts = [
    specimen.mineral_name,
    specimen.common_name ? `(${specimen.common_name})` : '',
    `rarity: ${specimen.rarity}`,
    `found: ${new Date(specimen.found_date).toLocaleDateString()}`,
    specimen.verified ? 'verified' : 'unverified',
  ];

  return parts.filter(Boolean).join(', ');
}

/**
 * Enhanced form labels for field entry
 */
export function createAccessibleLabel(labelText, inputId, required = false) {
  return `${labelText}${required ? ' (required)' : ''}`;
}

/**
 * Voice input wrapper (for field discovery)
 */
export async function captureVoiceInput(language = 'en-US') {
  return new Promise((resolve, reject) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      reject(new Error('Speech Recognition not supported'));
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.language = language;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      resolve(transcript);
    };

    recognition.onerror = (event) => {
      reject(new Error(`Speech recognition error: ${event.error}`));
    };

    announceToScreen('Listening for voice input...');
    recognition.start();
  });
}

/**
 * Haptic feedback (respects user settings)
 */
export function triggerHaptic(pattern = 'light') {
  if (!navigator.vibrate) return;

  const patterns = {
    light: [10],
    medium: [30],
    heavy: [50],
    success: [50, 30, 50],
    error: [100, 50, 100],
    warning: [50, 100, 50],
  };

  navigator.vibrate(patterns[pattern] || patterns.light);
}

/**
 * Test suite for accessibility compliance
 */
export async function runA11yTests(containerElement = document.body) {
  const issues = [];

  // Check for alt text on images
  const images = containerElement.querySelectorAll('img');
  images.forEach((img) => {
    if (!img.alt || img.alt.trim() === '') {
      issues.push(`Image missing alt text: ${img.src}`);
    }
  });

  // Check for heading hierarchy
  const headings = containerElement.querySelectorAll('h1, h2, h3, h4, h5, h6');
  let lastLevel = 0;
  headings.forEach((h) => {
    const currentLevel = parseInt(h.tagName[1]);
    if (currentLevel - lastLevel > 1) {
      issues.push(`Heading hierarchy broken: ${h.textContent}`);
    }
    lastLevel = currentLevel;
  });

  // Check form labels
  const inputs = containerElement.querySelectorAll('input, textarea, select');
  inputs.forEach((input) => {
    if (!input.labels || input.labels.length === 0) {
      issues.push(`Form input missing label: ${input.id || input.name}`);
    }
  });

  // Check color contrast (spot check)
  const bodyComputed = window.getComputedStyle(containerElement);
  const bgColor = bodyComputed.backgroundColor;
  const textColor = bodyComputed.color;

  if (!validateContrast(bgColor, textColor)) {
    issues.push(`Low contrast detected: background vs text`);
  }

  return {
    passed: issues.length === 0,
    issues,
    timestamp: new Date().toISOString(),
  };
}
