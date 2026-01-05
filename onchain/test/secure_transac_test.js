const TrustRegistry = artifacts.require("TrustRegistry");
const SecureVault = artifacts.require("SecureVault");
const { expectRevert } = require("@openzeppelin/test-helpers");

contract("SecureTransac Integration", (accounts) => {
  const [admin, reporter, userWithHighTrust, userWithLowTrust, blacklistedUser] = accounts;

  let registry;
  let vault;

  before(async () => {
    registry = await TrustRegistry.new({ from: admin });
    vault = await SecureVault.new(registry.address, { from: admin });
    
    // Set up reporter
    await registry.setReporterStatus(reporter, true, { from: admin });
  });

  it("should initialize with default scores (0.5/500)", async () => {
    const score = await registry.getScore(userWithHighTrust);
    assert.equal(score.toNumber(), 500, "Default score should be 500");
  });

  it("should prevent access if trust score is below threshold", async () => {
    // Threshold for SecureVault is 700. Default is 500.
    await expectRevert(
      vault.getSecret({ from: userWithHighTrust }),
      "Insufficient trust score"
    );
  });

  it("should allow access if trust score is above threshold", async () => {
    await registry.updateScore(userWithHighTrust, 850, { from: reporter });
    const secret = await vault.getSecret({ from: userWithHighTrust });
    assert.equal(secret, "This is a protected secret!", "Should be able to read secret");
  });

  it("should block blacklisted users regardless of score", async () => {
    await registry.updateScore(blacklistedUser, 100, { from: reporter });
    await expectRevert(
      vault.getSecret({ from: blacklistedUser }),
      "Address blacklisted"
    );
  });

  it("should only allow authorized reporters to update scores", async () => {
    await expectRevert(
      registry.updateScore(userWithLowTrust, 900, { from: userWithLowTrust }),
      "Not an authorized reporter"
    );
  });
});
