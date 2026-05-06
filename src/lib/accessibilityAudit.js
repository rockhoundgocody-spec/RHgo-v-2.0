/**
 * Accessibility Audit Utilities
 * 
 * WCAG 2.1 AA compliance checking
 * - Color contrast validation (4.5:1 for normal text, 3:1 for large)
 * - Keyboard navigation
 * - ARIA labels and roles
 * - Focus management
 * - Semantic HTML
 */

/**
 * Check color contrast ratio
 * Returns contrast ratio (1-21)
 */
export function getContrastRatio(rgb1, rgb2) {
  const getLuma = (rgb) => {
    const [r, g, b] = rgb.map((c) => {
      const sRGB = c / 255;
      return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const luma1 = getLuma(rgb1);
  const luma2 = getLuma(rgb2);
  const lighter = Math.max(luma1, luma2);
  const darker = Math.min(luma1, luma2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Parse CSS color to RGB
 */
function parseColor(color) {
  const div = document.createElement('div');
  div.style.color = color;
  document.body.appendChild(div);
  const computed = window.getComputedStyle(div).color;
  document.body.removeChild(div);

  const match = computed.match(/\d+/g);
  return match ? match.map(Number).slice(0, 3) : [0, 0, 0];
}

/**
 * Audit color contrast for all text
 */
export function auditColorContrast() {
  const violations = [];
  const elements = document.querySelectorAll('*');

  elements.forEach((el) => {
    const text = el.innerText;
    if (!text || text.trim().length === 0) return;

    const style = window.getComputedStyle(el);
    const fgColor = parseColor(style.color);
    const bgColor = parseColor(style.backgroundColor);
    const fontSize = parseFloat(style.fontSize);
    const isLarge = fontSize >= 18; // 18px or 14px bold
    const minContrast = isLarge ? 3 : 4.5;

    const contrast = getContrastRatio(fgColor, bgColor);
    if (contrast < minContrast) {
      violations.push({
        element: el,
        text: text.substring(0, 50),
        contrast: contrast.toFixed(2),
        required: minContrast,
        fontSize,
        isLarge,
      });
    }
  });

  return violations;
}

/**
 * Audit keyboard navigation
 */
export function auditKeyboardNav() {
  const issues = [];
  const interactiveElements = document.querySelectorAll(
    'button, a, input, textarea, select, [role="button"]'
  );

  interactiveElements.forEach((el) => {
    // Check if element is keyboard accessible
    if (el.getAttribute('tabindex') === '-1') {
      if (!el.hasAttribute('aria-hidden') || el.getAttribute('aria-hidden') !== 'true') {
        issues.push({
          element: el,
          issue: 'Keyboard hidden but not aria-hidden',
        });
      }
    }

    // Check for visible focus indicator
    const focusStyle = window.getComputedStyle(el, ':focus');
    if (!focusStyle.outline || focusStyle.outline === 'none') {
      issues.push({
        element: el,
        issue: 'No visible focus indicator',
      });
    }
  });

  return issues;
}

/**
 * Audit ARIA labels
 */
export function auditARIALabels() {
  const issues = [];
  const interactiveElements = document.querySelectorAll(
    'button, a[href], input, textarea, select, [role="button"], [role="navigation"]'
  );

  interactiveElements.forEach((el) => {
    const hasAriaLabel = el.hasAttribute('aria-label') || el.hasAttribute('aria-labelledby');
    const hasTextContent = el.innerText?.trim().length > 0;
    const hasTitle = el.getAttribute('title');

    if (!hasAriaLabel && !hasTextContent && !hasTitle) {
      issues.push({
        element: el,
        issue: 'No accessible label (aria-label, aria-labelledby, text, or title)',
      });
    }
  });

  return issues;
}

/**
 * Audit heading hierarchy
 */
export function auditHeadingHierarchy() {
  const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
  const issues = [];
  let lastLevel = 0;

  headings.forEach((h) => {
    const level = parseInt(h.tagName[1]);
    if (level > lastLevel + 1) {
      issues.push({
        element: h,
        issue: `Heading hierarchy skipped (h${lastLevel} → h${level})`,
      });
    }
    lastLevel = level;
  });

  // Check for missing H1
  if (!document.querySelector('h1')) {
    issues.push({
      issue: 'Page missing h1 heading',
    });
  }

  return issues;
}

/**
 * Run full accessibility audit
 */
export function runFullAudit() {
  return {
    contrastViolations: auditColorContrast(),
    keyboardIssues: auditKeyboardNav(),
    ariaIssues: auditARIALabels(),
    headingIssues: auditHeadingHierarchy(),
    timestamp: new Date().toISOString(),
  };
}

/**
 * Accessibility checker hook result
 */
export function getAccessibilitySummary() {
  const audit = runFullAudit();
  const totalIssues =
    audit.contrastViolations.length +
    audit.keyboardIssues.length +
    audit.ariaIssues.length +
    audit.headingIssues.length;

  return {
    compliant: totalIssues === 0,
    totalIssues,
    details: audit,
  };
}