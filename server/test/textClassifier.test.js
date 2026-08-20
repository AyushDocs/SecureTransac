import { expect } from 'chai';
import TextClassifier from '../src/utils/TextClassifier.js';

describe('TextClassifier (report text risk model)', () => {
    let clf;

    before(() => {
        clf = new TextClassifier();
    });

    it('loads the trained text model weights', () => {
        expect(clf.weights).to.not.equal(null);
    });

    it('returns a risk score in [0, 1] for report-like text', () => {
        const result = clf.score('This address is running a scam, steal reported');
        expect(result).to.not.equal(null);
        expect(result.risk).to.be.at.least(0);
        expect(result.risk).to.be.at.most(1);
        expect(result.knownTokens).to.be.greaterThan(0);
    });

    it('returns higher risk for fraud-language text than benign text', () => {
        const fraud = clf.score('URGENT: your account is compromised, verify now and send your private keys');
        const benign = clf.score('Thanks for the delivery, payment received on time');
        expect(fraud).to.not.equal(null);
        expect(benign).to.not.equal(null);
        expect(fraud.risk).to.be.greaterThan(benign.risk);
    });

    it('returns null for empty or unknown-only text (heuristic fallback path)', () => {
        expect(clf.score('')).to.equal(null);
        expect(clf.score('  ')).to.equal(null);
        expect(clf.score('zzzzz qqqqq wwwwww')).to.equal(null);
    });
});
