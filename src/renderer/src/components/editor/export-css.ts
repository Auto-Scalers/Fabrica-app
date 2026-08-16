// Why: this stylesheet targets the *exported* PDF document, not the live FABRICA
// pane. In-app CSS assumes sticky UI chrome, hover affordances, and app-shell
// spacing that would look wrong when flattened to paper. Keeping export CSS
// separate also means a future UI refactor can move live classes without
// silently breaking PDF output.
export const EXPORT_CSS = `
* { box-sizing: border-box; }

html, body {
  margin: 0;
  padding: 0;
  background: #ffffff;
  color: #1f2328;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial,
    sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
  font-size: 14px;
  line-height: 1.6;
}

.FABRICA-export-root {
  padding: 0;
  max-width: 100%;
}

.FABRICA-export-root h1,
.FABRICA-export-root h2,
.FABRICA-export-root h3,
.FABRICA-export-root h4,
.FABRICA-export-root h5,
.FABRICA-export-root h6 {
  font-weight: 600;
  line-height: 1.25;
  margin-top: 1.5em;
  margin-bottom: 0.5em;
}

.FABRICA-export-root h1 { font-size: 1.9em; }
.FABRICA-export-root h2 { font-size: 1.5em; }
.FABRICA-export-root h3 { font-size: 1.25em; }
.FABRICA-export-root h4 { font-size: 1em; }

.FABRICA-export-root p,
.FABRICA-export-root blockquote,
.FABRICA-export-root ul,
.FABRICA-export-root ol,
.FABRICA-export-root pre,
.FABRICA-export-root table {
  margin-top: 0;
  margin-bottom: 1em;
}

.FABRICA-export-root a {
  color: #0969da;
  text-decoration: underline;
}

.FABRICA-export-root blockquote {
  padding: 0 1em;
  color: #57606a;
  border-left: 0.25em solid #d0d7de;
}

.FABRICA-export-root code,
.FABRICA-export-root pre {
  font-family: "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
  font-size: 0.9em;
}

.FABRICA-export-root code {
  background: #f6f8fa;
  padding: 0.2em 0.4em;
  border-radius: 4px;
}

.FABRICA-export-root pre {
  background: #f6f8fa;
  padding: 12px 16px;
  border-radius: 6px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-word;
}

.FABRICA-export-root pre code {
  background: transparent;
  padding: 0;
  border-radius: 0;
  font-size: inherit;
}

.FABRICA-export-root table {
  border-collapse: collapse;
  width: 100%;
}

.FABRICA-export-root th,
.FABRICA-export-root td {
  border: 1px solid #d0d7de;
  padding: 6px 12px;
  text-align: left;
}

.FABRICA-export-root th { background: #f6f8fa; }

.FABRICA-export-root img,
.FABRICA-export-root svg {
  max-width: 100%;
  height: auto;
}

.FABRICA-export-root ul,
.FABRICA-export-root ol { padding-left: 2em; }

.FABRICA-export-root li { margin: 0.25em 0; }

.FABRICA-export-root input[type="checkbox"] {
  margin-right: 0.4em;
}

.FABRICA-export-root hr {
  border: 0;
  border-top: 1px solid #d0d7de;
  margin: 1.5em 0;
}

/* Why: the export subtree selection already excludes the big chrome (toolbar,
   search bar, etc.), but in-document affordances like the code-copy button
   can still leak. Hide the well-known offenders as a belt-and-suspenders
   defense on top of DOM scrubbing. */
.code-block-copy-btn,
.markdown-preview-search,
.rich-markdown-toolbar,
[data-FABRICA-export-hide="true"] {
  display: none !important;
}

.code-block-wrapper { position: static !important; }

@media print {
  pre, code, table, img, svg { page-break-inside: avoid; }
  h1, h2, h3, h4, h5, h6 { page-break-after: avoid; }
}
`
