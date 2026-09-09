#!/usr/bin/env node

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const defaultRepositoryRoot = path.resolve(path.dirname(scriptPath), "..");

/**
 * 发布 package Release，采用 hash-aware 幂等策略：同名同 SHA 可重试，不同 SHA 直接失败，
 * 不使用无条件 --clobber。
 */
export function publishPackageRelease({
  repository = process.env.GITHUB_REPOSITORY,
  tag = process.env.GITHUB_REF_NAME,
  assetDirectory = path.join(defaultRepositoryRoot, "release-assets"),
  gh = runGh,
} = {}) {
  if (typeof repository !== "string" || repository.length === 0) {
    throw new Error("GITHUB_REPOSITORY is required");
  }
  if (typeof tag !== "string" || !/^v[0-9]+\.[0-9]+\.[0-9]+(?:[-.][0-9A-Za-z.-]+)?$/u.test(tag)) {
    throw new Error("A valid package tag is required; received " + String(tag));
  }
  const assets = fs.readdirSync(assetDirectory)
    .filter(function (name) { return !name.startsWith("."); })
    .map(function (name) { return path.join(assetDirectory, name); })
    .filter(function (file) { return fs.statSync(file).isFile(); })
    .sort();
  if (assets.length === 0) throw new Error("No package release assets found: " + assetDirectory);

  const existing = readRelease(gh, repository, tag);
  if (existing === null) {
    gh(["release", "create", tag, "--repo", repository, "--draft", "--verify-tag", "--title", "Package " + tag]);
    gh(["release", "upload", tag].concat(assets, ["--repo", repository]));
    verifyRemoteAssets(gh, repository, tag, assets);
    gh(["release", "edit", tag, "--repo", repository, "--draft=false", "--latest"]);
    console.log("Package Release published: " + repository + " " + tag);
    return { action: "published", tag: tag, assets: assets.map(function (file) { return path.basename(file); }) };
  }

  const isDraft = Boolean(existing.isDraft);
  const missing = [];
  for (const asset of assets) {
    const name = path.basename(asset);
    if (existing.assets.some(function (candidate) { return candidate.name === name; })) {
      verifyRemoteAsset(gh, repository, tag, asset);
    } else {
      if (!isDraft) throw new Error("Published package Release is missing asset: " + name);
      missing.push(asset);
    }
  }
  if (missing.length > 0) {
    gh(["release", "upload", tag].concat(missing, ["--repo", repository]));
  }
  verifyRemoteAssets(gh, repository, tag, assets);
  if (isDraft) gh(["release", "edit", tag, "--repo", repository, "--draft=false", "--latest"]);
  console.log("Package Release verified: " + repository + " " + tag);
  return {
    action: isDraft ? "completed-draft" : "verified",
    tag: tag,
    assets: assets.map(function (file) { return path.basename(file); }),
  };
}
function readRelease(gh, repository, tag) {
  try {
    return JSON.parse(gh(["release", "view", tag, "--repo", repository, "--json", "isDraft,assets"]));
  } catch (error) {
    const detail = error instanceof Error && "stderr" in error ? String(error.stderr) : "";
    const message = (error instanceof Error ? error.message : String(error)) + " " + detail;
    if (/release not found|HTTP 404|not found/iu.test(message)) return null;
    throw error;
  }
}

function verifyRemoteAssets(gh, repository, tag, assets) {
  for (const asset of assets) verifyRemoteAsset(gh, repository, tag, asset);
}

function verifyRemoteAsset(gh, repository, tag, localFile) {
  const name = path.basename(localFile);
  const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "package-release-"));
  try {
    gh(["release", "download", tag, "--repo", repository, "--pattern", name, "--dir", temporaryDirectory]);
    const remoteFile = path.join(temporaryDirectory, name);
    if (!fs.existsSync(remoteFile)) throw new Error("Downloaded package asset is missing: " + name);
    const localSha = sha256File(localFile);
    const remoteSha = sha256File(remoteFile);
    if (localSha !== remoteSha) {
      throw new Error(
        "Package Release asset SHA mismatch for " + name + ": local=" + localSha + ", remote=" + remoteSha,
      );
    }
  } finally {
    fs.rmSync(temporaryDirectory, { recursive: true, force: true });
  }
}

function runGh(args) {
  try {
    return execFileSync("gh", args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch (error) {
    const detail = error instanceof Error && "stderr" in error ? String(error.stderr).trim() : "";
    throw new Error(
      "GitHub CLI command failed: gh " + args.join(" ") + (detail === "" ? "" : ": " + detail),
      { cause: error },
    );
  }
}

function sha256File(file) {
  return createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

if (process.argv[1] !== undefined && path.resolve(process.argv[1]) === scriptPath) {
  try {
    const result = publishPackageRelease({
      repository: process.env.GITHUB_REPOSITORY,
      tag: process.env.GITHUB_REF_NAME,
      assetDirectory: path.resolve(process.argv[2] || path.join(defaultRepositoryRoot, "release-assets")),
    });
    console.log("Package release action: " + result.action);
  } catch (cause) {
    console.error("[package-publisher] " + (cause instanceof Error ? cause.message : String(cause)));
    process.exitCode = 1;
  }
}
