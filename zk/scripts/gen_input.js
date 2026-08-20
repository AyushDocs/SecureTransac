#!/usr/bin/env node
const { buildPoseidon } = require("circomlibjs");
const fs = require("fs");

async function main() {
  const poseidon = await buildPoseidon();
  const F = poseidon.F;

  const score = 750n;
  const salt = 123456789n;
  const threshold = 600n;

  const commitment = F.toString(poseidon([score, salt]));

  const input = {
    score: score.toString(),
    salt: salt.toString(),
    commitment,
    threshold: threshold.toString(),
  };

  const outDir = process.argv[2] || ".";
  fs.writeFileSync(`${outDir}/input.json`, JSON.stringify(input, null, 2));
  console.log(`Written ${outDir}/input.json`);
  console.log(`  score=${score}, salt=${salt}, threshold=${threshold}`);
  console.log(`  commitment=${commitment}`);
}

main().catch(e => { console.error(e); process.exit(1); });
