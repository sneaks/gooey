# Graph File Browser Plan

## Context

Currently, saving and loading graphs requires typing the exact name in a browser prompt. The user forgets what they named their saved graphs and wants a visual file browser to see and select from existing graphs.

## File Extension

Save graphs with `.goo` extension (e.g., `my-graph.goo`)

## Current State

- Backend already has full CRUD:
  - `GET /api/graphs` — list all graphs
  - `PUT /api/graphs/:name` — save a graph
  - `GET /api/graphs/:name` — load a graph
  - `DELETE /api/graphs/:name` — delete a graph
- Store already has:
  - `saveToServer(name)` / `loadFromServer(name)`
  - `listServerGraphs()` — returns array of graph names
  - `saveToLocalStorage()` / `loadFromLocalStorage()`
- UI currently uses `prompt()` for name input (lines 82-99 in App.tsx)

## Approach

Replace the `prompt()`-based save/load with a proper **File Browser Modal** component that:
1. Shows list of saved graphs with click-to-open
2. Allows saving with a text input
3. Has delete button per file
4. "New Graph" button to clear canvas

## Files to Modify

- `src/server/index.ts` — Update to save/load with `.goo` extension
- `src/app/App.tsx` — Replace prompt() calls with modal
- `src/panels/FileBrowser.tsx` — NEW: Modal component with file list

## UI Mockup

```
┌─────────────────────────────────────────┐
│  📁 Graphs                        ✕     │
├─────────────────────────────────────────┤
│  [+ New]    [Save As...]               │
├─────────────────────────────────────────┤
│  📄 research-agent.json           🗑️   │
│  📄 haiku-generator.json         🗑️   │
│  📄 code-review-test.json        🗑️   │
│  📄 scratchpad.json              🗑️   │
│  📄 my-awesome-graph.json        🗑️   │
└─────────────────────────────────────────┘
```

## Implementation

### Step 1: Update backend to use .goo extension
- Modify file reads/writes in `src/server/index.ts` to use `.goo` extension
- Rename existing .json files to .goo if needed

### Step 2: Create FileBrowser component
- Modal with open/close state
- Fetch graph list on open
- Render list of files with delete buttons
- "New" button clears canvas
- "Save As" shows input field

### Step 3: Wire to App.tsx
- Replace `handleSave` prompt → open FileBrowser
- Replace `handleLoad` prompt → open FileBrowser  
- Use store methods already available

## Verification

- [x] Backend API uses `.goo` extension (tested: PUT, GET, DELETE all work)
- [ ] Click Save → FileBrowser opens → can save with name
- [ ] Click Load → FileBrowser opens → click file to load
- [ ] Click delete on a file → removes from list
- [ ] Click New → clears canvas
- [x] Works without server (localStorage fallback still works)
