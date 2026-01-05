const VulnerableBank = artifacts.require("VulnerableBank");
const SecureBank = artifacts.require("SecureBank");
const TrustRegistry = artifacts.require("TrustRegistry");
const { expectRevert } = require("@openzeppelin/test-helpers");

contract("Demo Protection Showcase", (accounts) => {
    const [admin, reporter, attacker] = accounts;
    let trustRegistry;
    let vulnerableBank;
    let secureBank;

    before(async () => {
        trustRegistry = await TrustRegistry.new({ from: admin });
        vulnerableBank = await VulnerableBank.new();
        secureBank = await SecureBank.new(trustRegistry.address, { from: admin });

        await trustRegistry.setReporterStatus(reporter, true, { from: admin });
    });

    describe("VulnerableBank (Unprotected)", () => {
        it("should allow any user to interact (and potentially exploit)", async () => {
            await vulnerableBank.deposit({ from: attacker, value: web3.utils.toWei("1", "ether") });
            const balance = await vulnerableBank.balances(attacker);
            assert.equal(web3.utils.fromWei(balance, "ether"), "1");
            
            // Attacker can withdraw without any trust checks
            await vulnerableBank.withdraw({ from: attacker });
            const finalBalance = await vulnerableBank.balances(attacker);
            assert.equal(finalBalance.toString(), "0");
        });
    });

    describe("SecureBank (Protected by SecureTransac)", () => {
        it("should block a 'stranger' or 'bad actor' from interacting", async () => {
            // New user has 500 (0.5) score by default. SecureBank requires 800.
            await secureBank.deposit({ from: attacker, value: web3.utils.toWei("1", "ether") });
            
            await expectRevert(
                secureBank.withdraw({ from: attacker }),
                "Insufficient trust score"
            );
        });

        it("should allow interaction when score is boosted by AI", async () => {
            // Simulate AI recognizing the attacker as 'good' (or just a verified user)
            await trustRegistry.updateScore(attacker, 850, { from: reporter });
            
            await secureBank.withdraw({ from: attacker });
            const finalBalance = await secureBank.balances(attacker);
            assert.equal(finalBalance.toString(), "0");
        });

        it("should block if AI blacklists the address", async () => {
            await trustRegistry.updateScore(attacker, 100, { from: reporter });
            
            await expectRevert(
                secureBank.withdraw({ from: attacker }),
                "Address blacklisted"
            );
        });
    });
});
