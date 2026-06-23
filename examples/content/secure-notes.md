# Secure Notes Basics

This imported lesson walks through a small notes feature with a focus on authorization checks.

## Scenario

A notes application lets users open URLs shaped like `/notes/:noteId`. The route handler loads a note by ID and renders it in the browser.

## Review Questions

Ask these questions before trusting the implementation:

- Does the server derive the current user from a trusted session?
- Does the query constrain notes by both note ID and owner ID?
- Are client-provided identifiers treated as hints rather than proof?

```ts
const note = await db.note.findFirst({
  where: {
    id: params.noteId,
    ownerId: currentUser.id
  }
});
```

Submit `flag{secure-notes}` after reviewing the scenario.
