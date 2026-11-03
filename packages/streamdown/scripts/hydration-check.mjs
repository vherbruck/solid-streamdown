// Hydration check for the built package (run `bun run build` first).
//
// The server half renders Streamdown under Node's default conditions, which
// resolve the package to dist/server.js. The client half loads that markup
// into jsdom under the "browser" condition (dist/index.js), hydrates it,
// then streams updates into the hydrated tree. A second client pass adds the
// "development" condition: Solid's dev build throws on a hydration key it
// cannot find, where the production build silently creates a new node.
//
// Usage: node scripts/hydration-check.mjs
// Exits non-zero on any failed check and prints "hydration ok" on success.

import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT = fileURLToPath(import.meta.url);
const DIST = fileURLToPath(new URL("../dist/", import.meta.url));

const DOCUMENT = "# Hi\n\nSome **bold** text\n\n- a\n- b";
const DOCUMENT_UPDATES = [
  "# Hi\n\nSome **bold** text and more\n\n- a\n- b",
  "# Hi\n\nSome **bold** text and more still\n\n- a\n- b",
  "# Hi\n\nSome **bold** text and more still\n\n- a\n- b\n\nA new paragraph",
];
const TABLE = "| Name | Age |\n| --- | --- |\n| Alice | 30 |";
const TABLE_THEN_PROSE = `${TABLE}\n\nText after the table`;
const CARET_CLASS = "after:content-[var(--streamdown-caret)]";
// Void elements the renderer emits itself (hard break, task-list checkbox,
// raw HTML), each followed by hydrated content, so a stray component created
// for a void element's children would shift every later hydration key.
const VOIDS = [
  "line one  \nline two [after break](https://example.com)",
  "- [ ] open task [after checkbox](https://example.com)\n- [x] done task",
  "a<wbr>b and <kbd>key</kbd> [after wbr](https://example.com)",
  "| a | b |\n| --- | --- |\n| 1 | 2 |",
].join("\n\n");
// A Mermaid block with a stub diagram plugin: Mermaid itself needs a real
// layout engine, and core's side is what hydrates.
const DIAGRAM = "```mermaid\ngraph TD; A-->B\n```\n\n[after diagram](https://example.com)";
const diagramPlugin = {
  name: "mermaid",
  type: "diagram",
  language: "mermaid",
  getMermaid: () => ({
    initialize: () => {},
    render: async () => ({ svg: '<svg data-stub-diagram="" viewBox="0 0 100 50"></svg>' }),
  }),
};
// Code highlighted by the real plugin after hydration.
const HIGHLIGHTED = "```ts\nconst answer: number = 42;\n```\n\n[after code](https://example.com)";
// Animated streaming: word spans revealed while streaming, removed on settle.
const ANIMATED = { animation: "fadeIn", duration: 150, stagger: 0 };
const ANIMATED_STEPS = ["one two", "one two three", "one two three\n\n- four"];
// Interactive UI: a code block, a table, an image and a guarded link.
const UI = [
  "```js\nconst a = 1;\n```",
  "| A | B |\n| --- | --- |\n| 1 | 2 |",
  "![logo](https://example.com/logo.png)",
  "Text with ![inline](https://example.com/inline.png) beside it.",
  "[docs](https://example.com)",
].join("\n\n");
const CARET_HIDDEN = "data-sd-caret-hidden";

// Each pass names the package entry and the solid-js/web build it must load.
const CLIENT_PASSES = [
  { conditions: ["browser"], entry: "index.js", solid: "web.js" },
  { conditions: ["browser", "development"], entry: "dev.js", solid: "dev.js" },
];

// The client half captures console output, so failures report through this.
const printError = console.error.bind(console);

const failures = [];
const check = (ok, message) => {
  if (!ok) {
    failures.push(message);
  }
};
const finish = (label) => {
  if (failures.length > 0) {
    printError(`${label} failed:\n${failures.map((f) => `  - ${f}`).join("\n")}`);
    process.exit(1);
  }
};

// Imports the package after checking that this process's conditions resolve
// it, and Solid, to the expected builds.
const importPackage = async (entry, solid) => {
  const resolved = fileURLToPath(import.meta.resolve("solid-streamdown"));
  check(resolved === join(DIST, entry), `solid-streamdown resolved to ${resolved}, expected dist/${entry}`);
  const solidWeb = fileURLToPath(import.meta.resolve("solid-js/web"));
  check(solidWeb.endsWith(join("web", "dist", solid)), `solid-js/web resolved to ${solidWeb}, expected web/dist/${solid}`);
  finish("module resolution");
  return import("solid-streamdown");
};

// Both builds must be compiled with `hydratable: true` (tsup.config.ts). A
// server entry built for the DOM, or a client entry without hydration
// support, would make every check below meaningless.
const checkBuildOutput = async () => {
  const server = await readFile(join(DIST, "server.js"), "utf8");
  check(server.includes("ssrHydrationKey"), "dist/server.js has no ssrHydrationKey: not hydratable SSR output");
  check(/\bssr(Element)?\(/.test(server), "dist/server.js has no ssr()/ssrElement() calls: not SSR output");
  check(!server.includes("getNextElement"), "dist/server.js uses getNextElement: it holds client output");
  for (const { entry } of CLIENT_PASSES) {
    const client = await readFile(join(DIST, entry), "utf8");
    check(client.includes("getNextElement"), `dist/${entry} has no getNextElement: not hydratable client output`);
    check(!client.includes("ssrHydrationKey"), `dist/${entry} uses ssrHydrationKey: it holds server output`);
  }
  finish("build output check (see tsup.config.ts)");
};

const runServer = async (dir) => {
  const { generateHydrationScript, renderToString } = await import("solid-js/web");
  const { Streamdown } = await importPackage("server.js", "server.js");
  const documentHtml = renderToString(() => Streamdown({ children: DOCUMENT }), { renderId: "d" });
  const caretHtml = renderToString(
    () => Streamdown({ caret: "block", children: TABLE, isAnimating: true }),
    { renderId: "c" }
  );
  const uiHtml = renderToString(() => Streamdown({ children: UI, mode: "static" }), { renderId: "u" });
  const { code } = await import("@solid-streamdown/code");
  const highlightedHtml = renderToString(
    () => Streamdown({ children: HIGHLIGHTED, mode: "static", plugins: { code } }),
    { renderId: "h" }
  );
  const diagramHtml = renderToString(
    () => Streamdown({ children: DIAGRAM, mode: "static", plugins: { mermaid: diagramPlugin } }),
    { renderId: "m" }
  );
  const voidsHtml = renderToString(() => Streamdown({ children: VOIDS, mode: "static" }), { renderId: "v" });
  const animatedHtml = renderToString(
    () => Streamdown({ animated: ANIMATED, children: ANIMATED_STEPS[0], isAnimating: true }),
    { renderId: "a" }
  );
  const page =
    `<!doctype html><html><head>${generateHydrationScript()}</head><body>` +
    `<div id="document">${documentHtml}</div><div id="caret">${caretHtml}</div>` +
    `<div id="ui">${uiHtml}</div><div id="animated">${animatedHtml}</div>` +
    `<div id="voids">${voidsHtml}</div><div id="highlighted">${highlightedHtml}</div>` +
    `<div id="diagram">${diagramHtml}</div></body></html>`;
  await writeFile(join(dir, "server.html"), page);
};

const textNodes = (root) => {
  const nodes = [];
  const walker = root.ownerDocument.createTreeWalker(root, 4 /* NodeFilter.SHOW_TEXT */);
  while (walker.nextNode()) {
    nodes.push(walker.currentNode);
  }
  return nodes;
};

const occurrences = (haystack, needle) => haystack.split(needle).length - 1;

// Attribute values in a comparable form. Styles go through the CSSOM, since
// the server writes `a:b` where the client's setProperty serializes `a: b;`.
const attributeValue = (node, attribute) =>
  attribute.name === "style" ? node.style.cssText : attribute.value.trim();

// A comparable outline of a container's content: tags, attributes and text,
// without comments and hydration keys.
const outline = (container) => [...container.childNodes].map(outlineNode).join("");

const outlineNode = (node) => {
  if (node.nodeType === 3) {
    // A client render leaves an empty text node where a closed <Show> sits
    // among siblings; hydration does not create one. Neither renders anything.
    return node.data === "" ? "" : JSON.stringify(node.data);
  }
  if (node.nodeType !== 1) {
    return "";
  }
  const attributes = [...node.attributes]
    .filter((a) => a.name !== "data-hk")
    .map((a) => ` ${a.name}=${JSON.stringify(attributeValue(node, a))}`)
    .sort();
  return `<${node.localName}${attributes.join("")}>${outline(node)}</${node.localName}>`;
};

const runClient = async (dir, entry, solid) => {
  const { JSDOM } = await import("jsdom");
  const dom = new JSDOM(await readFile(join(dir, "server.html"), "utf8"), {
    runScripts: "dangerously",
    // Provides requestAnimationFrame, which the scroll pinning in tables and
    // code blocks uses.
    pretendToBeVisual: true,
  });
  const { window } = dom;
  for (const name of [
    "window",
    "document",
    "Node",
    "Element",
    "HTMLElement",
    "SVGElement",
    "Text",
    "Comment",
    "DocumentFragment",
    "requestAnimationFrame",
    "cancelAnimationFrame",
    // Solid's Portal checks for a <head> mount; the UI checks dispatch events.
    "HTMLHeadElement",
    "MouseEvent",
    "KeyboardEvent",
  ]) {
    globalThis[name] = window[name];
  }
  // jsdom has no IntersectionObserver; deferred diagrams wait on one. This
  // stub records observers so the check can report the diagram as visible.
  const observers = [];
  globalThis.IntersectionObserver = class {
    constructor(callback) {
      this.callback = callback;
      observers.push(this);
    }
    observe() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  };
  // jsdom has no scrolling; the scroll pinning in tables and code blocks calls it.
  window.HTMLElement.prototype.scrollTo = () => {};
  check(window._$HY !== undefined, "the hydration script did not run (no _$HY)");
  globalThis._$HY = window._$HY;

  const logged = [];
  for (const level of ["error", "warn"]) {
    console[level] = (...args) => logged.push(`console.${level}: ${args.join(" ")}`);
  }

  const { createSignal } = await import("solid-js");
  const { hydrate, render } = await import("solid-js/web");
  const { Streamdown } = await importPackage(entry, solid);

  // What a client-only render of the same props produces.
  const freshOutline = (props) => {
    const container = document.createElement("div");
    const dispose = render(() => Streamdown(props), container);
    const result = outline(container);
    dispose();
    return result;
  };
  const matchesFresh = (root, props, step) => {
    const expected = freshOutline(props);
    const actual = outline(root);
    check(actual === expected, `${step}: hydrated DOM differs from a client render\n    hydrated: ${actual}\n    client:   ${expected}`);
  };

  // A document streamed into after hydration.
  const docRoot = document.getElementById("document");
  const serverElements = [...docRoot.querySelectorAll("*")];
  const serverText = textNodes(docRoot);
  const serverParagraph = docRoot.querySelector("p");
  const serverTail = serverParagraph?.lastChild;
  check(serverTail?.nodeType === 3 && serverTail.data === " text", `server paragraph does not end in " text": ${serverParagraph?.outerHTML}`);

  const [markdown, setMarkdown] = createSignal(DOCUMENT);
  const disposeDocument = hydrate(
    () => Streamdown({ get children() { return markdown(); } }),
    docRoot,
    { renderId: "d" }
  );

  const bodyText = docRoot.textContent;
  check(occurrences(bodyText, "Hi") === 1, `"Hi" appears ${occurrences(bodyText, "Hi")} times after hydration`);
  check(occurrences(bodyText, "Some bold text") === 1, `"Some bold text" appears ${occurrences(bodyText, "Some bold text")} times after hydration`);
  check(docRoot.querySelectorAll("h1").length === 1, `${docRoot.querySelectorAll("h1").length} h1 elements after hydration`);
  check(docRoot.querySelectorAll("li").length === 2, `${docRoot.querySelectorAll("li").length} li elements after hydration`);
  const strongCount = docRoot.querySelectorAll('[data-streamdown="strong"]').length;
  check(strongCount === 1, `${strongCount} strong elements after hydration`);

  // Hydration adopts every server node instead of rendering its own.
  const hydratedElements = [...docRoot.querySelectorAll("*")];
  check(
    hydratedElements.length === serverElements.length && hydratedElements.every((el, i) => el === serverElements[i]),
    "hydration replaced server elements"
  );
  const hydratedText = textNodes(docRoot);
  check(
    hydratedText.length === serverText.length && hydratedText.every((node, i) => node === serverText[i]),
    "hydration replaced server text nodes"
  );
  check(serverParagraph?.lastChild === serverTail, "the paragraph's server text node was not adopted");
  matchesFresh(docRoot, { children: DOCUMENT }, "after hydration");

  // The first update after hydration takes over the server's text node; from
  // then on the paragraph's tail node must stay the same node.
  const tails = [];
  for (const [step, next] of DOCUMENT_UPDATES.entries()) {
    setMarkdown(next);
    const paragraph = docRoot.querySelector("p");
    const expectedText = next.split("\n\n")[1].replaceAll("**", "");
    check(paragraph === serverParagraph, `update ${step + 1}: the paragraph element was replaced`);
    check(paragraph?.textContent === expectedText, `update ${step + 1}: paragraph reads ${JSON.stringify(paragraph?.textContent)}, expected ${JSON.stringify(expectedText)}`);
    tails.push(paragraph?.lastChild);
    matchesFresh(docRoot, { children: next }, `update ${step + 1}`);
  }
  check(tails.every((tail) => tail?.isConnected), "a paragraph tail text node is detached");
  check(tails.every((tail) => tail === tails[0]), "the paragraph's tail text node changed after the first update");
  const finalText = docRoot.textContent;
  check(occurrences(finalText, "Some bold text and more still") === 1, "the streamed paragraph is duplicated or missing");
  check(occurrences(finalText, "A new paragraph") === 1, "the paragraph added after hydration is duplicated or missing");

  // Caret suppression across hydration (upstream caret-suppression "hydrates
  // without a mismatch when the caret is suppressed").
  const caretRoot = document.getElementById("caret");
  const [caretMarkdown, setCaretMarkdown] = createSignal(TABLE);
  const caretProps = (children) => ({ caret: "block", children, isAnimating: true });
  const disposeCaret = hydrate(
    () => Streamdown({ caret: "block", isAnimating: true, get children() { return caretMarkdown(); } }),
    caretRoot,
    { renderId: "c" }
  );
  const caretContainer = caretRoot.firstElementChild;
  check(caretContainer?.lastElementChild?.hasAttribute(CARET_HIDDEN) === true, "the table is not caret-suppressed after hydration");
  matchesFresh(caretRoot, caretProps(TABLE), "caret after hydration");

  setCaretMarkdown(TABLE_THEN_PROSE);
  check(caretContainer?.className.includes(CARET_CLASS) === true, "the caret classes are missing once prose follows the table");
  check(caretRoot.querySelector(`[${CARET_HIDDEN}]`) === null, "an element is still caret-suppressed once prose follows the table");
  matchesFresh(caretRoot, caretProps(TABLE_THEN_PROSE), "caret after prose");

  // Interactive UI hydrates once and works afterwards.
  const uiRoot = document.getElementById("ui");
  const uiProps = { children: UI, mode: "static" };
  const disposeUi = hydrate(() => Streamdown(uiProps), uiRoot, { renderId: "u" });
  matchesFresh(uiRoot, uiProps, "ui after hydration");
  const count = (selector) => uiRoot.querySelectorAll(selector).length;
  check(count('[data-streamdown="code-block"]') === 1, `${count('[data-streamdown="code-block"]')} code blocks after hydration`);
  check(count('[data-streamdown="table-wrapper"]') === 1, `${count('[data-streamdown="table-wrapper"]')} table wrappers after hydration`);
  check(count('[data-streamdown="image-wrapper"]') === 2, `${count('[data-streamdown="image-wrapper"]')} image wrappers after hydration, expected 2`);
  check(count("p div") === 0, "a div ended up inside a paragraph after hydration");
  check(occurrences(uiRoot.textContent, "const a = 1;") === 1, "the code is duplicated or missing after hydration");

  const copied = [];
  Object.defineProperty(globalThis.navigator, "clipboard", {
    configurable: true,
    value: { writeText: async (text) => copied.push(text) },
  });
  uiRoot
    .querySelector('[data-streamdown="code-block-copy-button"]')
    ?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  await new Promise((resolve) => setTimeout(resolve, 0));
  check(copied.length === 1 && copied[0] === "const a = 1;\n", `the hydrated copy button copied ${JSON.stringify(copied)}`);

  uiRoot
    .querySelector('button[data-streamdown="link"]')
    ?.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  await new Promise((resolve) => setTimeout(resolve, 0));
  check(
    document.querySelector('[data-streamdown="link-safety-modal"]') !== null,
    "the hydrated link did not open the link-safety modal"
  );

  // The code plugin highlights after hydration without a mismatch.
  const { code } = await import("@solid-streamdown/code");
  const highlightedRoot = document.getElementById("highlighted");
  const highlightedProps = { children: HIGHLIGHTED, mode: "static", plugins: { code } };
  const disposeHighlighted = hydrate(() => Streamdown(highlightedProps), highlightedRoot, { renderId: "h" });
  // Highlighting resolves asynchronously, so right after hydration both this
  // tree and a fresh client render still show the unhighlighted body.
  matchesFresh(highlightedRoot, highlightedProps, "highlighted code after hydration");
  const colored = () =>
    [...highlightedRoot.querySelectorAll('[data-streamdown="code-block-body"] code span span')].filter(
      (token) => /^#/.test(token.style.getPropertyValue("--sdm-c"))
    ).length;
  for (let waited = 0; colored() === 0 && waited < 15_000; waited += 50) {
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  check(colored() > 1, "the hydrated code block was never highlighted");
  check(
    occurrences(highlightedRoot.textContent, "const answer: number = 42;") === 1,
    "the highlighted code is duplicated or missing"
  );
  check(
    highlightedRoot.querySelector('button[data-streamdown="link"]') !== null,
    "the link after the code block did not hydrate"
  );

  // A Mermaid block hydrates as its placeholder, then renders once visible.
  const diagramRoot = document.getElementById("diagram");
  const diagramProps = { children: DIAGRAM, mode: "static", plugins: { mermaid: diagramPlugin } };
  const disposeDiagram = hydrate(() => Streamdown(diagramProps), diagramRoot, { renderId: "m" });
  matchesFresh(diagramRoot, diagramProps, "mermaid block after hydration");
  check(
    diagramRoot.querySelector('[data-streamdown="mermaid-block"]') !== null,
    "the mermaid block did not hydrate"
  );
  for (const observer of observers) {
    observer.callback([{ isIntersecting: true }], observer);
  }
  for (let waited = 0; !diagramRoot.querySelector("[data-stub-diagram]") && waited < 3000; waited += 50) {
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  check(
    diagramRoot.querySelectorAll("[data-stub-diagram]").length === 1,
    `${diagramRoot.querySelectorAll("[data-stub-diagram]").length} diagram SVGs once visible, expected 1`
  );
  check(
    diagramRoot.querySelector('button[data-streamdown="link"]') !== null,
    "the link after the diagram did not hydrate"
  );

  // Void elements hydrate without shifting later keys.
  const voidsRoot = document.getElementById("voids");
  const voidsProps = { children: VOIDS, mode: "static" };
  const disposeVoids = hydrate(() => Streamdown(voidsProps), voidsRoot, { renderId: "v" });
  matchesFresh(voidsRoot, voidsProps, "void elements after hydration");
  check(voidsRoot.querySelectorAll("br").length === 1, "the hard break is duplicated or missing after hydration");
  check(voidsRoot.querySelectorAll('input[type="checkbox"]').length === 2, "task-list checkboxes are duplicated or missing after hydration");

  // Animated streaming hydrates, keeps revealed spans, and settles cleanly.
  const animatedRoot = document.getElementById("animated");
  const [animatedText, setAnimatedText] = createSignal(ANIMATED_STEPS[0]);
  const [animating, setAnimating] = createSignal(true);
  const disposeAnimated = hydrate(
    () =>
      Streamdown({
        animated: ANIMATED,
        get children() {
          return animatedText();
        },
        get isAnimating() {
          return animating();
        },
      }),
    animatedRoot,
    { renderId: "a" }
  );
  const animatedProps = (children, isAnimating = true) => ({ animated: ANIMATED, children, isAnimating });
  const wordSpans = () => [...animatedRoot.querySelectorAll("[data-sd-animate]")];
  matchesFresh(animatedRoot, animatedProps(ANIMATED_STEPS[0]), "animated after hydration");
  const firstSpans = wordSpans();
  check(firstSpans.length === 2, `${firstSpans.length} word spans after hydration, expected 2`);
  setAnimatedText(ANIMATED_STEPS[1]);
  const grownSpans = wordSpans();
  check(
    grownSpans[0] === firstSpans[0] && grownSpans[1] === firstSpans[1],
    "the revealed word spans were replaced while streaming after hydration"
  );
  check(
    grownSpans.slice(0, 2).every((span) => span.style.getPropertyValue("--sd-duration") === "0ms"),
    "the revealed words did not settle to 0ms after hydration"
  );
  setAnimatedText(ANIMATED_STEPS[2]);
  setAnimating(false);
  check(wordSpans().length === 0, `${wordSpans().length} word spans remain after the stream settled`);
  check(occurrences(animatedRoot.textContent, "three") === 1, "streamed text is duplicated or missing after settling");
  matchesFresh(animatedRoot, animatedProps(ANIMATED_STEPS[2], false), "animated after settling");

  disposeDocument();
  disposeCaret();
  disposeUi();
  disposeAnimated();
  disposeVoids();
  disposeHighlighted();
  disposeDiagram();
  window.close();
  check(logged.length === 0, `console output during hydration:\n    ${logged.join("\n    ")}`);
  finish(`hydration (dist/${entry})`);
};

const runChild = (args) => {
  const result = spawnSync(process.execPath, args, { stdio: "inherit" });
  if (result.status !== 0) {
    printError(`hydration check failed: ${args.join(" ")} exited with ${result.status ?? result.signal}`);
  }
  return result.status === 0;
};

const [role, ...args] = process.argv.slice(2);
if (role === "server") {
  await runServer(...args);
} else if (role === "client") {
  await runClient(...args);
} else {
  await checkBuildOutput();
  const work = await mkdtemp(join(tmpdir(), "solid-streamdown-hydration-"));
  let ok;
  try {
    ok =
      runChild([SCRIPT, "server", work]) &&
      CLIENT_PASSES.every(({ conditions, entry, solid }) =>
        runChild([...conditions.map((c) => `--conditions=${c}`), SCRIPT, "client", work, entry, solid])
      );
  } finally {
    await rm(work, { force: true, recursive: true });
  }
  if (!ok) {
    process.exit(1);
  }
  console.log("hydration ok");
}
