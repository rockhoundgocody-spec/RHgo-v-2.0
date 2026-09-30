import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, role, 'aria-label': ariaLabel, className, style }) => (
      <div role={role} aria-label={ariaLabel} className={className} style={style}>
        {children}
      </div>
    ),
  },
}));

import WeatherPanel from './WeatherPanel.jsx';

describe('WeatherPanel accessibility and markup', () => {
  it('renders accessibility attributes on root container and close button', () => {
    const html = renderToStaticMarkup(
      <WeatherPanel userLocation={null} hudMode={true} onClose={() => {}} />
    );

    expect(html).toContain('role="region"');
    expect(html).toContain('aria-label="Beach Weather Conditions"');
    expect(html).toContain('aria-label="Close weather conditions"');
    expect(html).toContain('focus-visible:ring-hud-cyan/60');
  });

  it('renders prompt when location is missing', () => {
    const html = renderToStaticMarkup(
      <WeatherPanel userLocation={null} hudMode={false} onClose={() => {}} />
    );

    expect(html).toContain('Enable location to see beach conditions.');
  });
});
