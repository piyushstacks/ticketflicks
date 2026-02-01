// Compatibility layer: the codebase is standardizing on the British spelling
// "Theatre". This module now forwards to the canonical Theatre model to avoid
// breaking legacy imports that still reference "Theater".
import Theatre from "./Theatre.js";

export default Theatre;
