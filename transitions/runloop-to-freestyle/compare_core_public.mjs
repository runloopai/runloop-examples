import { createHash, randomUUID } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { RunloopSDK } from "@runloop/api-client";
import { Freestyle } from "freestyle";

const { values } = parseArgs({
  options: {
    output: { type: "string", default: "transition-results_private.json" },
    extended: { type: "boolean", default: false },
  },
});
const report = { versions: {}, resources: {}, cases: [], cleanup: {}, errors: [] };
const token = randomUUID().replaceAll("-", "");
const path = `/tmp/transition-probe-${token}`;
const content = `transition probe ${token} — café\n`;
const cleanup = [];
let stage = "setup";

function check(name, runloop, freestyle, expected) {
  report.cases.push({
    name,
    runloop,
    freestyle,
    expected,
    pass:
      JSON.stringify(runloop) === JSON.stringify(expected) &&
      JSON.stringify(freestyle) === JSON.stringify(expected),
  });
}
async function commands(box, vm, command) {
  const r = await box.cmd.exec(command);
  const f = await vm.exec(command);
  return [
    { exit: r.exitCode, stdout: await r.stdout(), stderr: await r.stderr() },
    { exit: f.statusCode, stdout: f.stdout ?? "", stderr: f.stderr ?? "" },
  ];
}
async function fixture(box, vm) {
  const command = `mkdir -p ${path}; printf 'binary\\000fixture' > ${path}/binary; chmod 750 ${path}/binary; ln -s binary ${path}/link; head -c 1048576 /dev/zero > ${path}/large`;
  const [r, f] = await commands(box, vm, command);
  check("fixture creation", r.exit, f.exit, 0);
}
const manifestCommand = `cd ${path} && sha256sum binary large && stat -c '%a' binary && readlink link`;

try {
  if (!process.env.RUNLOOP_API_KEY || !process.env.FREESTYLE_API_KEY) {
    throw new Error("credentials missing");
  }
  for (const [name, file] of Object.entries({
    "@runloop/api-client": "./node_modules/@runloop/api-client/package.json",
    freestyle: "./node_modules/freestyle/package.json",
  }))
    report.versions[name] = JSON.parse(await readFile(new URL(file, import.meta.url))).version;
  report.startedAt = new Date().toISOString();
  report.fixtureHash = createHash("sha256").update(content).digest("hex");
  const runloop = new RunloopSDK();
  const freestyle = new Freestyle();
  stage = "Runloop creation";
  const box = await runloop.devbox.create({ name: `transition-probe-${token.slice(0, 12)}` });
  report.resources.runloop = box.id;
  cleanup.push(["runloop", () => box.shutdown()]);
  stage = "Freestyle creation";
  const { vm, vmId } = await freestyle.vms.create({
    slug: `transition-probe-${token.slice(0, 12)}`,
    snapshotId: "freestyle/ubuntu-sm",
    ttlSeconds: 3600,
    firewall: { rules: [] },
  });
  report.resources.freestyle = vmId;
  cleanup.push(["freestyle", () => vm.delete()]);
  stage = "core comparisons";
  for (const exit of [0, 7]) {
    const [r, f] = await commands(
      box,
      vm,
      `printf 'stdout-probe\\n'; printf 'stderr-probe\\n' >&2; exit ${exit}`,
    );
    check(`command exit ${exit}`, r, f, {
      exit,
      stdout: "stdout-probe\n",
      stderr: "stderr-probe\n",
    });
  }
  await box.file.write({ file_path: `${path}.txt`, contents: content });
  await vm.fs.writeFile(`${path}.txt`, content);
  check(
    "UTF-8 file round trip",
    await box.file.read({ file_path: `${path}.txt` }),
    await vm.fs.readTextFile(`${path}.txt`),
    content,
  );

  if (values.extended) {
    stage = "filesystem fixtures";
    await fixture(box, vm);
    const [r, f] = await commands(box, vm, manifestCommand);
    const expectedManifest = {
      exit: 0,
      stdout: `${createHash("sha256").update("binary\0fixture").digest("hex")}  binary\n${createHash("sha256").update(Buffer.alloc(1048576)).digest("hex")}  large\n750\nbinary\n`,
      stderr: "",
    };
    check("binary, large file, mode and symlink manifest", r, f, expectedManifest);
    const targetBytes = await vm.fs.readFile(`${path}/binary`);
    check(
      "binary SDK read",
      Buffer.from("binary\0fixture").toString("hex"),
      Buffer.from(targetBytes).toString("hex"),
      Buffer.from("binary\0fixture").toString("hex"),
    );
    stage = "network denial";
    const denied = await vm.exec(
      "curl --connect-timeout 3 --max-time 5 -s https://example.com >/dev/null; test $? -ne 0",
    );
    report.cases.push({ name: "Freestyle default-deny outbound", pass: denied.statusCode === 0 });
    stage = "network allow";
    const rule = await freestyle.firewall.rules.create({
      action: "allow",
      source: { vmId },
      destination: { public: true, port: 443, protocol: "tcp" },
    });
    cleanup.push(["freestyleFirewall", () => freestyle.firewall.rules.delete(rule.id)]);
    for (const protocol of ["udp", "tcp"]) {
      const dns = await freestyle.firewall.rules.create({
        action: "allow",
        source: { vmId },
        destination: { public: true, port: 53, protocol },
      });
      cleanup.push([`freestyleDns-${protocol}`, () => freestyle.firewall.rules.delete(dns.id)]);
    }
    const allowed = await vm.exec(
      "curl --show-error --connect-timeout 5 --max-time 10 --fail -s https://example.com >/dev/null",
    );
    report.cases.push({
      name: "Freestyle explicit HTTPS allow",
      actual: allowed,
      pass: allowed.statusCode === 0,
    });
    stage = "application file transfer";
    const source = await box.file.read({ file_path: `${path}.txt` });
    await vm.fs.writeFile(`${path}/migrated.txt`, source);
    check(
      "Runloop to Freestyle file transfer",
      source,
      await vm.fs.readTextFile(`${path}/migrated.txt`),
      content,
    );
    await box.file.write({
      file_path: `${path}/returned.txt`,
      contents: await vm.fs.readTextFile(`${path}/migrated.txt`),
    });
    check(
      "Freestyle to Runloop reverse transfer",
      await box.file.read({ file_path: `${path}/returned.txt` }),
      source,
      content,
    );
    stage = "pause and resume";
    const pidFile = `${path}/process`;
    const started = await vm.exec(`sleep 600 >/dev/null 2>&1 & echo $! > ${pidFile}`);
    report.cases.push({
      name: "Freestyle background process started",
      pass: started.statusCode === 0,
    });
    await box.suspend();
    await box.awaitSuspended();
    await vm.pause();
    report.cases.push({
      name: "Freestyle disk read while paused",
      pass: (await vm.fs.readTextFile(`${path}.txt`)) === content,
    });
    report.cases.push({
      name: "Freestyle read leaves VM paused",
      pass: (await vm.data()).state === "paused",
    });
    await box.resume();
    await vm.start();
    check(
      "disk after resume",
      await box.file.read({ file_path: `${path}.txt` }),
      await vm.fs.readTextFile(`${path}.txt`),
      content,
    );
    const alive = await vm.exec(`kill -0 $(cat ${pidFile})`);
    report.cases.push({ name: "Freestyle process survives pause", pass: alive.statusCode === 0 });
    stage = "snapshots";
    const rs = await box.snapshotDisk({ name: `transition-probe-${token.slice(0, 12)}` });
    report.resources.runloopSnapshot = rs.id;
    cleanup.push(["runloopSnapshot", () => rs.delete()]);
    const { snapshotId } = await vm.snapshot({
      slug: `transition-probe-${token.slice(0, 12)}`,
      ttlSeconds: 3600,
    });
    report.resources.freestyleSnapshot = snapshotId;
    cleanup.push(["freestyleSnapshot", () => freestyle.vms.snapshots.delete(snapshotId)]);
    stage = "snapshot restore";
    const restoredBox = await runloop.devbox.create({ snapshot_id: rs.id });
    report.resources.runloopRestored = restoredBox.id;
    cleanup.push(["runloopRestored", () => restoredBox.shutdown()]);
    const { vm: restoredVm, vmId: restoredId } = await freestyle.vms.create({
      snapshotId,
      ttlSeconds: 3600,
      firewall: { rules: [] },
    });
    report.resources.freestyleRestored = restoredId;
    cleanup.push(["freestyleRestored", () => restoredVm.delete()]);
    const [rr, ff] = await commands(restoredBox, restoredVm, manifestCommand);
    check("restored filesystem manifest", rr, ff, expectedManifest);
    const restoredAlive = await restoredVm.exec(`kill -0 $(cat ${pidFile})`);
    report.cases.push({
      name: "Freestyle snapshot preserves process",
      pass: restoredAlive.statusCode === 0,
    });
  }
} catch (error) {
  report.errors.push({ stage, type: error.constructor.name });
} finally {
  for (const [name, action] of cleanup.reverse()) {
    try {
      await action();
      report.cleanup[name] = "ok";
    } catch (error) {
      report.cleanup[name] = `failed: ${error.constructor.name}`;
    }
  }
}
report.finishedAt = new Date().toISOString();
await writeFile(values.output, `${JSON.stringify(report, null, 2)}\n`, { mode: 0o600 });
console.log(
  `Wrote ${values.output}; ${report.cases.filter((c) => c.pass).length}/${report.cases.length} checks passed`,
);
process.exitCode = report.errors.length
  ? 2
  : report.cases.every((c) => c.pass) && Object.values(report.cleanup).every((s) => s === "ok")
    ? 0
    : 1;
