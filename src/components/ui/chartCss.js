const UNSAFE_CSS_VALUE = /[;{}<>\\\u0000-\u001f\u007f]|\/\*|\*\//;
const CSS_COLOR_CHARACTERS = /^[#(),.%/\s+\-\w]+$/;

export function toSafeCssIdentifier(value) {
  return String(value ?? '')
    .slice(0, 128)
    .replace(/[^a-zA-Z0-9_-]/g, (character) => `-${character.codePointAt(0).toString(16)}-`);
}

function isSafeCssColor(value) {
  if (typeof value !== 'string') return false;
  const color = value.trim();
  return color.length > 0 &&
    color.length <= 128 &&
    !UNSAFE_CSS_VALUE.test(color) &&
    CSS_COLOR_CHARACTERS.test(color);
}

export function buildChartCss(id, config = {}, themes = { light: '', dark: '.dark' }) {
  const safeId = toSafeCssIdentifier(id);
  if (!safeId) return '';

  return Object.entries(themes)
    .map(([theme, prefix]) => {
      const variables = Object.entries(config)
        .map(([key, itemConfig = {}]) => {
          const color = itemConfig.theme?.[theme] || itemConfig.color;
          if (!isSafeCssColor(color)) return null;
          return `  --color-${toSafeCssIdentifier(key)}: ${color.trim()};`;
        })
        .filter(Boolean);

      return variables.length
        ? `${prefix} [data-chart="${safeId}"] {\n${variables.join('\n')}\n}`
        : '';
    })
    .filter(Boolean)
    .join('\n');
}
