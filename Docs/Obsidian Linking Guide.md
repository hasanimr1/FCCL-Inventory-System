# Obsidian Linking Guide

A short, practical explanation of how links work in this vault and the conventions used in the project notes.

## 1. The basic idea

A link is a connection from one note to another. You make one by typing a note's name inside double square brackets:

```markdown
See [[01-project-overview]] for the project background.
```

Obsidian turns that into a clickable link and records the connection in **both** directions. The link in the text is one-way, but navigation, backlinks and the graph all work two-way without extra effort.

## 2. The syntax you will actually use

| Goal | Syntax |
|---|---|
| Link to a note | `[[project_summary]]` |
| Link with your own wording | `[[project_summary\|Full technical overview]]` |
| Link to a heading inside a note | `[[08-decisions-and-open-issues#2. Superseded information]]` |
| Link to a heading in the current note | `[[#Some heading]]` |
| Link to a specific paragraph or list | `[[05-data-model-and-business-rules#^block-id]]` |
| Embed the note's content instead of linking | `![[project_summary]]` |
| Embed an image or PDF | `![[FCCL logo.png]]`, `![[spec.pdf#page=3]]` |
| Link to a website | `[Obsidian help](https://help.obsidian.md)` |

Inside a **table**, a display-text link must escape the pipe: `[[08-decisions-and-open-issues\|Open issues]]`. An unescaped `|` ends the table cell and breaks the row.

## 3. Five behaviours worth knowing

**Links are by name, not by path.** `[[project_summary]]` resolves regardless of which folder the note lives in. If two notes ever share a name, type a partial path to disambiguate: `[[FCCL_Project_Markdown_Docs/project_summary]]`.

**Backlinks are automatic.** Open [[project_summary]] and the Backlinks pane lists every note that links to it. You never maintain the reverse direction by hand.

**Unlinked mentions are surfaced too.** The same pane shows notes that mention "project summary" as plain text but never linked it. One click converts a mention into a link.

**Renaming is safe.** Rename a note and Obsidian rewrites every link that points at it. This is the main reason to prefer `[[wikilinks]]` over standard Markdown links.

**Linking to a missing note is allowed.** `[[A note I have not written yet]]` is valid; clicking it creates the note. Use this to sketch structure before the content exists.

## 4. Prose links versus a "Related notes" list

Both are used in this vault:

- **Prose links** sit inside a sentence and carry the reader somewhere at the moment they need it — for example, "the stack is defined in [[02-architecture-and-technology]]".
- **A `## Related notes` block** at the end of a note lists its neighbours. It is easy to scan, survives copy/paste into other tools, and gives the graph a predictable shape.

## 5. Conventions in this vault

- Project notes live in `Docs/FCCL_Project_Markdown_Docs/` and are numbered `01`–`08` in reading order. Link them by their plain name: [[04-core-modules]], not by path.
- [[README]] is the entry point for the documentation pack.
- [[project_summary]], [[Inital Plan]] and [[Asset_Management_Requirements_Specification]] are **source material**, not current requirements. Where they disagree with the numbered notes, the numbered notes and [[08-decisions-and-open-issues]] win.
- Source files can be linked too: [[inventory.ts]] and [[inventoryRules.ts]] open directly from a note, which is handy when a design point depends on the actual type definitions.
- Prefer linking to a **heading** rather than a whole note when you are citing one specific rule: `[[08-decisions-and-open-issues#3. Open role and permission decisions]]`.
- Aliases let a note answer to a friendlier name. Add them in frontmatter as `aliases`, then link `[[Open issues]]`.
- Links used as a property value must be quoted: `related: "[[02-architecture-and-technology]]"`.

## 6. One caveat

`[[wikilinks]]` are Obsidian's own syntax. They work perfectly inside Obsidian, but if this pack is exported to GitHub, Word or a PDF generator, the raw `[[...]]` text will show up unrendered. Standard Markdown links (`[04 Core Modules](04-core-modules.md)`) survive that export and still work in Obsidian, but they break silently when a note is renamed by hand outside the app. For an internal working vault, wikilinks are the better trade.

## 7. Try it

1. Open [[08-decisions-and-open-issues]] and check the Backlinks pane — this note is now one of its backlinks.
2. Type `[[` anywhere and start typing `data` — the link autocomplete offers [[05-data-model-and-business-rules]].
3. Open the graph view (Ctrl/Cmd + G) and look at how the numbered notes cluster.

## Related notes

- [[README]] — contents of the project documentation pack.
- [[01-project-overview]] — where to start reading.
- [[08-decisions-and-open-issues]] — the note most often linked to.
