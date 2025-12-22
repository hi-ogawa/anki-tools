#!/usr/bin/env node
// Setup development symlink for Anki addon

import {
  existsSync,
  lstatSync,
  rmSync,
  symlinkSync,
  unlinkSync,
} from "node:fs";
import { homedir, platform } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ADDON_NAME = "anki-browse-web-dev";
const REPO_ROOT = dirname(__dirname);
const ADDON_SRC = join(REPO_ROOT, "anki_browse_web");

// Detect Anki addons directory
function getAddonsDir() {
  const home = homedir();
  switch (platform()) {
    case "linux":
      return join(home, ".local/share/Anki2/addons21");
    case "darwin":
      return join(home, "Library/Application Support/Anki2/addons21");
    default:
      console.error(`Error: Unsupported platform: ${platform()}`);
      process.exit(1);
  }
}

const addonsDir = getAddonsDir();
const addonDest = join(addonsDir, ADDON_NAME);

// Check if addons directory exists
if (!existsSync(addonsDir)) {
  console.error(`Error: Anki addons directory not found: ${addonsDir}`);
  console.error("Make sure Anki is installed and has been run at least once.");
  process.exit(1);
}

// Remove existing addon (folder or symlink)
const stat = lstatSync(addonDest, { throwIfNoEntry: false });
if (stat) {
  console.log(`Removing existing: ${addonDest}`);
  if (stat.isSymbolicLink()) {
    unlinkSync(addonDest);
  } else {
    rmSync(addonDest, { recursive: true });
  }
}

// Create symlink
symlinkSync(ADDON_SRC, addonDest);
console.log(`Created symlink: ${addonDest} -> ${ADDON_SRC}`);
console.log("");
console.log("Dev setup complete. Restart Anki to load the addon.");
