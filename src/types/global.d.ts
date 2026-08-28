// Lightweight shims for modules without bundled types to satisfy the typechecker

declare module 'lucide-react';
declare module 'framer-motion';
declare module 'react-router-dom';
declare module '@tanstack/react-query';
declare module 'react/jsx-runtime';
declare module 'react-leaflet';
declare module 'react-day-picker';
declare module 'react-resizable-panels';
declare module 'react-markdown';
declare module 'three';
declare module 'leaflet';
declare module 'sonner';
declare module 'input-otp';
declare module '@googlemaps/markerclusterer';
declare module 'cmdk';

declare global {
  interface Window {
    webkitAudioContext?: any;
    L?: any;
    L_DISABLE_3D?: any;
    deviceXDPI?: any;
    logicalXDPI?: any;
  }
}

// Allow any JSX intrinsic attributes/elements to reduce noisy prop errors
declare namespace JSX {
  interface IntrinsicAttributes { [key: string]: any }
  interface IntrinsicElements { [elemName: string]: any }
}

export {};