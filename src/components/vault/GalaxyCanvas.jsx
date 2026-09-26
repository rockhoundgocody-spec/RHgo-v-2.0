import React, { useEffect, useMemo, useRef } from 'react';
import { GalaxyScene } from './GalaxyScene';

/**
 * GalaxyCanvas — React shell around GalaxyScene. Loaded lazily, so Three.js
 * only downloads when someone opens the Vault Galaxy.
 *
 * Labels are real DOM (readable type, no texture atlases); the scene moves
 * them each frame through refs, so React never re-renders per frame.
 */
export default function GalaxyCanvas({
  graph, matchIds, selectedId, focusRequest, frameRequest, reducedMotion,
  onSelect, onHover, onError, hoverId,
}) {
  const hostRef = useRef(null);
  const sceneRef = useRef(null);
  const labelRefs = useRef(new Map());
  const handlers = useRef({ onSelect, onHover, onError });
  handlers.current = { onSelect, onHover, onError };

  // Create once per mount.
  useEffect(() => {
    let scene;
    try {
      scene = new GalaxyScene(hostRef.current, {
        reducedMotion,
        onSelect: (id) => handlers.current.onSelect?.(id),
        onHover: (id) => handlers.current.onHover?.(id),
        onError: (err) => handlers.current.onError?.(err),
      });
    } catch (err) {
      handlers.current.onError?.(err);
      return undefined;
    }
    sceneRef.current = scene;
    return () => {
      sceneRef.current = null;
      scene.dispose();
    };
  }, [reducedMotion]);

  useEffect(() => { sceneRef.current?.setGraph(graph); }, [graph, reducedMotion]);
  useEffect(() => { sceneRef.current?.setMatches(matchIds); }, [matchIds, graph]);
  useEffect(() => {
    sceneRef.current?.select(selectedId ?? null, { fly: false });
  }, [selectedId, graph]);
  useEffect(() => {
    if (focusRequest?.id) sceneRef.current?.select(focusRequest.id, { fly: true });
  }, [focusRequest]);
  useEffect(() => {
    if (frameRequest) sceneRef.current?.frameAll(true);
  }, [frameRequest]);

  // Always label the hubs; label a find only when it's selected or hovered.
  const labelled = useMemo(() => {
    const ids = new Set(graph.nodes.filter((n) => n.kind === 'species' || n.kind === 'site').map((n) => n.id));
    if (selectedId) ids.add(selectedId);
    if (hoverId) ids.add(hoverId);
    return graph.nodes.filter((n) => ids.has(n.id));
  }, [graph, selectedId, hoverId]);

  useEffect(() => {
    sceneRef.current?.setLabelElements(new Map(labelled.map((n) => [n.id, labelRefs.current.get(n.id)])));
  }, [labelled]);

  return (
    <div className="absolute inset-0">
      <div ref={hostRef} className="absolute inset-0" />
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
        {labelled.map((n) => (
          <span
            key={n.id}
            ref={(el) => { if (el) labelRefs.current.set(n.id, el); else labelRefs.current.delete(n.id); }}
            className="absolute left-0 top-0 whitespace-nowrap rounded-md px-1.5 py-0.5 text-[10px] font-semibold tracking-wide"
            style={{
              opacity: 0,
              color: n.kind === 'site' ? 'hsl(186 90% 82%)' : n.id === selectedId ? '#fff' : 'hsl(270 80% 92%)',
              background: n.id === selectedId || n.id === hoverId ? 'hsla(255,40%,12%,0.85)' : 'transparent',
              textShadow: '0 1px 6px rgba(0,0,0,0.9)',
              willChange: 'transform, opacity',
            }}
          >
            {n.kind === 'site' ? '◇ ' : ''}{n.label}{n.kind === 'species' && n.count > 1 ? ` ×${n.count}` : ''}
          </span>
        ))}
      </div>
    </div>
  );
}
