#!/usr/bin/env bun
/**
 * Release helper script for ai-eda monorepo
 *
 * Usage:
 *   bun scripts/release.ts          # Interactive release
 *   bun scripts/release.ts --dry    # Dry run (no publish)
 *   bun scripts/release.ts --ci     # CI mode (no prompts)
 */
import { $ } from "bun";

const args = process.argv.slice(2);
const isDry = args.includes("--dry");
const isCI = args.includes("--ci");

async function main() {
  console.log("\n=== ai-eda Release ===\n");

  // 1. Check for uncommitted changes
  const status = await $`git status --porcelain`.text();
  if (status.trim() && !isCI) {
    console.error("Error: Uncommitted changes detected.");
    console.error("Commit or stash your changes first.\n");
    process.exit(1);
  }

  // 2. Check for pending changesets
  console.log("--- Checking changesets ---");
  const changesetStatus = await $`bunx changeset status`.text();
  console.log(changesetStatus);

  // 3. Build all packages
  console.log("\n--- Building packages ---");
  await $`bun run build`;

  // 4. Run tests
  console.log("\n--- Running tests ---");
  try {
    await $`bun run test`;
  } catch {
    console.error("\nTests failed. Fix tests before releasing.\n");
    process.exit(1);
  }

  // 5. Version packages (applies changesets)
  console.log("\n--- Versioning packages ---");
  await $`bunx changeset version`;

  // 6. Publish
  console.log("\n--- Publishing ---");
  if (isDry) {
    console.log("(Dry run - no actual publish)\n");
    await $`bunx changeset publish --dry-run`;
  } else {
    await $`bunx changeset publish`;

    // Push tags and commits
    console.log("\n--- Pushing to remote ---");
    await $`git push --follow-tags`;
  }

  console.log("\n=== Release complete ===\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
