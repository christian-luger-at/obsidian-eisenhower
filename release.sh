#!/usr/bin/env bash
set -euo pipefail

# Read version from manifest.json
VERSION=$(node -e "console.log(require('./manifest.json').version)")
RELEASE_DIR="releases/v${VERSION}"

echo "Building Focus First v${VERSION}..."

# Run tests
npm test

# Build production bundle
npm run build

# Create release directory
mkdir -p "$RELEASE_DIR"

# Copy required Obsidian plugin files
cp main.js          "$RELEASE_DIR/main.js"
cp manifest.json    "$RELEASE_DIR/manifest.json"
cp styles.css       "$RELEASE_DIR/styles.css"

echo ""
echo "Release ready: $RELEASE_DIR"
echo "  $(du -sh "$RELEASE_DIR" | cut -f1)  total"
ls -lh "$RELEASE_DIR"
