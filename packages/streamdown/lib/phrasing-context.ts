import { createContext } from "solid-js";

/**
 * Internal: true inside a <p>, where only phrasing content may appear. The
 * HTML parser closes a <p> at any <div>, so server-rendered markup with a div
 * inside a paragraph would not match the tree that hydrates. Components that
 * render a block wrapper (the image) use spans there instead.
 */
export const PhrasingContext = createContext(false);
