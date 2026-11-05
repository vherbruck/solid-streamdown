import { createContext } from "solid-js";

/**
 * Internal: Markdown calls this after each parse, so a Block can commit its
 * animate plugin after every parse whatever caused it (upstream commits in a
 * layout effect on every render). Not exported from the package.
 */
export const ParseObserverContext = createContext<(() => void) | undefined>(undefined);
