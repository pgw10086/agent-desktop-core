#!/usr/bin/env node

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const defaultRepositoryRoot = path.resolve(path.dirname(scriptPath), "..");

/**
 * 在 package tag 对应的干净提交上生成 tarball 和来源清单。
 * 该脚本只负责 package 仓库自己的制品，不读取 Product Desktop 或 sibling 源码。
 */
export function preparePackageRelease({
  repositoryRoot = defaultRepositoryRoot,
  packagePath = ".",
  outputDirectory = path.join(repositoryRoot, "release-assets"),
  manifestName,
  tag = process.env.GITHUB_REF_NAME,
  mainRef = process.env.PACKAGE_RELEASE_MAIN_REF || "origin/main",
  runPack = true,
  git = function (args) { return runGit(repositoryRoot, args); },
} = {}) {
  const packageRoot = path.resolve(repositoryRoot, packagePath);
  assertInside(repositoryRoot, packageRoot, "package path");
  const packageJsonPath = path.join(packageRoot, "package.json");
  const packageJson = readJson(packageJsonPath);
  const packageName = packageJson.name;
  const version = packageJson.version;
  if (typeof packageName !== "string" || packageName.length === 0) {
    throw new Error("Package manifest has no name: " + packageJsonPath);
  }
  if (typeof version !== "string" || version.length === 0) {
    throw new Error("Package manifest has no version: " + packageJsonPath);
  }

  const releaseTag = tag || ("v" + version);
  if (releaseTag !== ("v" + version)) {
    throw new Error("Package release tag must be v" + version + "; received " + releaseTag);
  }
  if (!/^v[0-9]+\.[0-9]+\.[0-9]+(?:[-.][0-9A-Za-z.-]+)?$/u.test(releaseTag)) {
    throw new Error("Invalid package release tag: " + releaseTag);
  }

  if (git(["status", "--porcelain", "--untracked-files=all"]) !== "") {
    throw new Error("Package release requires a clean Git working tree");
  }
  const head = git(["rev-parse", "HEAD"]);
  const tagCommit = git(["rev-list", "-n", "1", releaseTag]);
  if (tagCommit !== head) {
    throw new Error("Tag " + releaseTag + " must point to current commit " + head + "; received " + tagCommit);
  }
  const mainCommit = git(["rev-parse", mainRef]);
  if (mainCommit !== head) {
    throw new Error("Package tag " + releaseTag + " must point to " + mainRef + " " + mainCommit + "; received " + head);
  }

  const lockfilePath = path.join(repositoryRoot, "pnpm-lock.yaml");
  if (!fs.existsSync(lockfilePath)) throw new Error("Package lockfile is missing: " + lockfilePath);
  fs.mkdirSync(outputDirectory, { recursive: true });
  if (runPack) {
    execFileSync("corepack", ["pnpm", "pack", "--pack-destination", outputDirectory], {
      cwd: packageRoot,
      stdio: "inherit",
    });
  }

  const prefix = packageName.replace(/^@/u, "").replaceAll("/", "-") + "-" + version;
  const candidates = fs.readdirSync(outputDirectory)
    .filter(function (name) { return name.endsWith(".tgz") && name.startsWith(prefix); })
    .sort();
  if (candidates.length !== 1) {
    throw new Error("Expected one packed artifact for " + packageName + ", found " + candidates.join(", "));
  }
  const artifactPath = path.join(outputDirectory, candidates[0]);
  const manifest = {
    schemaVersion: 1,
    package: { name: packageName, version: version },
    source: {
      repository: sanitizeRepositoryUrl(git(["config", "--get", "remote.origin.url"])),
      tag: releaseTag,
      commit: head,
      sourceLockfileSha256: sha256File(lockfilePath),
    },
    build: {
      workflowRunId: process.env.GITHUB_RUN_ID || null,
      workflowRunAttempt: process.env.GITHUB_RUN_ATTEMPT || null,
      runner: process.env.RUNNER_NAME || null,
      node: process.version,
      pnpm: readPnpmVersion(),
    },
    artifact: {
      name: path.basename(artifactPath),
      bytes: fs.statSync(artifactPath).size,
      sha256: sha256File(artifactPath),
    },
  };
  const outputManifestName = manifestName || (
    "package-manifest-" + packageName.replace(/^@/u, "").replaceAll("/", "-") + ".json"
  );
  if (path.basename(outputManifestName) !== outputManifestName) {
    throw new Error("Manifest name must be a file name: " + outputManifestName);
  }
  const manifestPath = path.join(outputDirectory, outputManifestName);
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
  return { artifactPath, manifestPath, manifest };
}
function readPnpmVersion() {
  try {
    return execFileSync("corepack", ["pnpm", "--version"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch {
    return null;
  }
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function runGit(repositoryRoot, args) {
  try {
    return execFileSync("git", args, {
      cwd: repositoryRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch (error) {
    const detail = error instanceof Error && "stderr" in error ? String(error.stderr).trim() : "";
    throw new Error(
      "Git command failed: git " + args.join(" ") + (detail === "" ? "" : ": " + detail),
      { cause: error },
    );
  }
}

function sanitizeRepositoryUrl(value) {
  if (value === "") return null;
  try {
    const url = new URL(value);
    url.username = "";
    url.password = "";
    return url.toString();
  } catch {
    return value;
  }
}

function sha256File(file) {
  const hash = createHash("sha256");
  hash.update(fs.readFileSync(file));
  return hash.digest("hex");
}

function assertInside(root, candidate, label) {
  const resolvedRoot = path.resolve(root);
  const resolvedCandidate = path.resolve(candidate);
  if (resolvedCandidate !== resolvedRoot && !resolvedCandidate.startsWith(resolvedRoot + path.sep)) {
    throw new Error(label + " resolves outside " + root);
  }
}

function optionValue(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

if (process.argv[1] !== undefined && path.resolve(process.argv[1]) === scriptPath) {
  try {
    const result = preparePackageRelease({
      packagePath: optionValue("--package-path") || ".",
      outputDirectory: path.resolve(
        optionValue("--output-directory") || path.join(defaultRepositoryRoot, "release-assets"),
      ),
      manifestName: optionValue("--manifest-name"),
    });
    console.log(
      "Package release prepared: " + result.manifest.artifact.name +
      " (" + result.manifest.artifact.sha256 + ")",
    );
    console.log("Manifest: " + result.manifestPath);
  } catch (cause) {
    console.error("[package-release] " + (cause instanceof Error ? cause.message : String(cause)));
    process.exitCode = 1;
  }
}
