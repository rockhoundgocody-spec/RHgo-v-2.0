// Browser-facing re-export of the same governance contract used by backend
// recommendation functions. Keeping one contract prevents policy drift.
export * from '../../base44/shared/locationGovernance.js';
