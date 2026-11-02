import { createHash } from "node:crypto";
const requireHash = (b: Buffer) => createHash("sha256").update(b).digest("hex");
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
const build = String.raw`import zipfile,sys
from xml.sax.saxutils import escape
parts=['1) A resource allocation question','A)  first  B)  second  C)  third  D)  fourth','Answer Key','1) B','The second alternative matches the provided definition.']
xml='<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>'+''.join('<w:p><w:r><w:t>'+escape(t)+'</w:t></w:r></w:p>' for t in parts)+'</w:body></w:document>'
with zipfile.ZipFile(sys.argv[1],'w',zipfile.ZIP_DEFLATED) as z:
 z.writestr('word/document.xml',xml)
 z.writestr('word/_rels/document.xml.rels','<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>')
 if len(sys.argv)>2:z.writestr('../escape','unsafe')
`;
test("Upload parser preserves source key and provenance; rejects unsafe archive entries", () => {
  const dir = mkdtempSync(join(tmpdir(), "mimacro-parser-test-"));
  try {
    const input = join(dir, "bank.docx"),
      meta = join(dir, "meta.json");
    writeFileSync(
      meta,
      JSON.stringify({
        title: "Parser test",
        topic: "Allocation",
        subject: "micro",
        language: "en",
        chapter: 8,
        filename: "bank.docx",
      }),
    );
    execFileSync("python3", ["-c", build, input]);
    execFileSync("python3", [
      "scripts/parse-upload.py",
      input,
      meta,
      join(dir, "out"),
    ]);
    const payload = JSON.parse(
      readFileSync(join(dir, "out/frank.json"), "utf8"),
    );
    assert.equal(payload.questions.length, 1);
    assert.equal(payload.questions[0].answer, "B");
    assert.deepEqual(
      payload.questions[0].options.map((o: { id: string }) => o.id),
      ["A", "B", "C", "D"],
    );
    assert.equal(payload.questions[0].sourceTitle, "Parser test");
    assert.equal(payload.questions[0].chapter, 8);
    assert.ok(!("sourcePath" in payload.sources[0].metadata));
    execFileSync("python3", ["-c", build, input, "unsafe"]);
    assert.throws(() =>
      execFileSync(
        "python3",
        ["scripts/parse-upload.py", input, meta, join(dir, "bad")],
        { stdio: "pipe" },
      ),
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("Upload parser matches a real supplied Frank source with diagrams and formatted formulas", () => {
  const bank = JSON.parse(readFileSync("data/imports/frank.json", "utf8"));
  const reference = bank.questions.find(
    (q: { mediaIds: string[] }) => q.mediaIds.length > 0,
  );
  const source = bank.sources.find(
    (s: { id: string }) => s.id === reference.sourceId,
  );
  const audit = JSON.parse(
    readFileSync("data/audits/sample-bank-audit.json", "utf8"),
  );
  const info = audit.sources.find((s: { path: string }) => {
    try {
      return (
        "src-" + requireHash(readFileSync(s.path)).slice(0, 20) === source.id
      );
    } catch {
      return false;
    }
  });
  assert.ok(info, "Original source used for diagram golden sample must exist");
  const dir = mkdtempSync(join(tmpdir(), "mimacro-original-parser-"));
  try {
    const meta = join(dir, "meta.json");
    writeFileSync(meta, JSON.stringify({ ...source, filename: "source.docx" }));
    execFileSync("python3", [
      "scripts/parse-upload.py",
      info.path,
      meta,
      join(dir, "out"),
    ]);
    const payload = JSON.parse(
      readFileSync(join(dir, "out/frank.json"), "utf8"),
    );
    const expected = bank.questions.filter(
      (q: { sourceId: string }) => q.sourceId === source.id,
    );
    assert.equal(payload.questions.length, expected.length);
    assert.deepEqual(payload.questions, expected);
    for (const m of payload.media) {
      const b = readFileSync(join(dir, "out/media", m.relativePath));
      assert.equal(requireHash(b), m.id);
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
