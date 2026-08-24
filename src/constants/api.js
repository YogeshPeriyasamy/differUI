const configuredApiBase = import.meta.env.VITE_API_BASE;

export const API_BASE = configuredApiBase || `${window.location.protocol}//${window.location.hostname}:4000`;