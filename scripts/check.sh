#!/bin/bash
cd /Users/jojo/AI/gooey
echo "=== Client TypeScript ==="
npx tsc --noEmit 2>&1
echo "=== Server TypeScript ==="
npx tsc --noEmit -p tsconfig.server.json 2>&1
echo "=== Done ==="
