const TrustRegistry = artifacts.require("TrustRegistry");
const { expectRevert } = require("@openzeppelin/test-helpers");

const fakeCiphertext = (value) => {
  const hex = value.toString(16).padStart(128, "0");
  return "0x" + hex;
};

contract("SecureTransac Integration", (accounts) => {
  const [admin, reporter, userWithHighTrust, userWithLowTrust] = accounts;

  let registry;

  before(async () => {
    registry = await TrustRegistry.new({ from: admin });
    await registry.setReporterStatus(reporter, true, 1, { from: admin });
  });

  it("should return empty bytes for a user with no score", async () => {
    const score = await registry.getScore(userWithHighTrust);
    assert.ok(score === "0x" || score === null || score === "", "Default score should be empty bytes");
  });

  it("should allow authorized reporters to store encrypted scores", async () => {
    const encrypted = fakeCiphertext(850);
    await registry.updateScore(userWithHighTrust, encrypted, { from: reporter });
    const stored = await registry.getScore(userWithHighTrust);
    assert.equal(stored, encrypted, "Encrypted score should round-trip");
  });

  it("should not allow unauthorized users to update scores", async () => {
    await expectRevert(
      registry.updateScore(userWithLowTrust, fakeCiphertext(900), { from: userWithLowTrust }),
      "Not an authorized reporter"
    );
  });

  it("should mark unknown users as not-whitelisted and blacklisted-by-default", async () => {
    assert.equal(await registry.isWhitelisted(userWithLowTrust), false);
    assert.equal(await registry.isBlacklisted(userWithLowTrust), true);
  });

  it("should only allow owner to change reporter status", async () => {
    await expectRevert.unspecified(
      registry.setReporterStatus(userWithLowTrust, true, 1, { from: userWithLowTrust })
    );
  });
});
