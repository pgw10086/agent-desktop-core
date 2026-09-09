import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { publishPackageRelease } from "./publish-package-release.mjs";

test("首次 package 发布创建 Draft、上传并回验后转正式", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "package-publisher-test-"));
  try {
    const assetDirectory = path.join(root, "assets");
    fs.mkdirSync(assetDirectory);
    fs.writeFileSync(path.join(assetDirectory, "demo-1.2.3.tgz"), "artifact");
    fs.writeFileSync(path.join(assetDirectory, "package-manifest-demo.json"), "manifest");
    fs.writeFileSync(path.join(assetDirectory, "SHA256SUMS"), "checksums");
    const fake = createFakeGitHub({ absent: true });
    const result = publishPackageRelease({
      repository: "example/demo",
      tag: "v1.2.3",
      assetDirectory,
      gh: fake.gh,
    });
    assert.equal(result.action, "published");
    assert.equal(fake.isDraft, false);
    assert.deepEqual([...fake.remoteAssets.keys()].sort(), [
      "SHA256SUMS",
      "demo-1.2.3.tgz",
      "package-manifest-demo.json",
    ]);
    assert.equal(fake.calls.some(function (args) { return args.includes("--clobber"); }), false);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("已发布 package Release 同摘要可幂等回读", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "package-publisher-test-"));
  try {
    const assetDirectory = path.join(root, "assets");
    fs.mkdirSync(assetDirectory);
    fs.writeFileSync(path.join(assetDirectory, "demo-1.2.3.tgz"), "artifact");
    const fake = createFakeGitHub({
      absent: false,
      isDraft: false,
      remoteAssets: new Map([["demo-1.2.3.tgz", Buffer.from("artifact")]]),
    });
    const result = publishPackageRelease({
      repository: "example/demo",
      tag: "v1.2.3",
      assetDirectory,
      gh: fake.gh,
    });
    assert.equal(result.action, "verified");
    assert.equal(fake.calls.some(function (args) { return args[1] === "upload"; }), false);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("已发布 package Release 摘要不一致时硬失败", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "package-publisher-test-"));
  try {
    const assetDirectory = path.join(root, "assets");
    fs.mkdirSync(assetDirectory);
    fs.writeFileSync(path.join(assetDirectory, "demo-1.2.3.tgz"), "artifact");
    const fake = createFakeGitHub({
      absent: false,
      isDraft: false,
      remoteAssets: new Map([["demo-1.2.3.tgz", Buffer.from("different")]]),
    });
    assert.throws(
      function () {
        publishPackageRelease({
          repository: "example/demo",
          tag: "v1.2.3",
          assetDirectory,
          gh: fake.gh,
        });
      },
      /SHA mismatch/u,
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

function createFakeGitHub({ absent, isDraft, remoteAssets = new Map() }) {
  const calls = [];
  let currentDraft = Boolean(isDraft);
  function gh(args) {
    calls.push(args);
    if (args[0] !== "release") throw new Error("unexpected command");
    if (args[1] === "view") {
      if (absent) {
        const error = new Error("release not found");
        error.stderr = "release not found";
        throw error;
      }
      return JSON.stringify({
        isDraft: currentDraft,
        assets: [...remoteAssets.keys()].map(function (name) { return { name }; }),
      });
    }
    if (args[1] === "create") return "";
    if (args[1] === "upload") {
      const separator = args.indexOf("--repo");
      for (const file of args.slice(3, separator)) {
        remoteAssets.set(path.basename(file), fs.readFileSync(file));
      }
      return "";
    }
    if (args[1] === "edit") {
      if (args.includes("--draft=false")) currentDraft = false;
      return "";
    }
    if (args[1] === "download") {
      const name = args[args.indexOf("--pattern") + 1];
      const directory = args[args.indexOf("--dir") + 1];
      fs.mkdirSync(directory, { recursive: true });
      fs.writeFileSync(path.join(directory, name), remoteAssets.get(name));
      return "";
    }
    throw new Error("unexpected release action: " + args[1]);
  }
  return {
    gh,
    calls,
    remoteAssets,
    get isDraft() { return currentDraft; },
  };
}
