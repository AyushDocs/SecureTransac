/**
 * Pure-JS TF-IDF + Logistic Regression text classifier.
 * Trained by ai/05-AyushDocs-ReportTextModel.ipynb on the CEAS 2008 phishing
 * corpus; exports P(fraud) for free-text transaction reports.
 *
 * Inference MUST match sklearn's TfidfVectorizer(norm='l2', smooth_idf=True)
 * + LogisticRegression(solver='liblinear') predict_proba()[:, 1].
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const weightsPath = path.join(__dirname, 'text_model_weights.json');
const TOKEN_RE = /[a-z0-9_]{2,}/g; // lowercase, 2+ word chars — matches notebook token_pattern

class TextClassifier {
    constructor() {
        try {
            const raw = fs.readFileSync(weightsPath, 'utf8');
            const model = JSON.parse(raw);
            this.vocabIndex = new Map();
            model.vocab.forEach((term, i) => this.vocabIndex.set(term, i));
            this.idf = model.idf;
            this.coef = model.coef;
            this.intercept = model.intercept[0];
            this.weights = model;
        } catch (e) {
            console.warn(`[AI] text_model_weights.json missing: ${e.message}. Using heuristic text fallback.`);
            this.weights = null;
        }
    }

    /**
     * Score free text -> { risk (P(fraud) 0..1), knownTokens } or null when the
     * text has no tokens that exist in the trained vocabulary.
     */
    score(text) {
        if (!this.weights) return null;

        const tokens = String(text || '').toLowerCase().match(TOKEN_RE) || [];
        if (tokens.length === 0) return null;

        // Term frequencies
        const tf = new Map();
        for (const t of tokens) tf.set(t, (tf.get(t) || 0) + 1);

        // tf-idf vector (norm='l2', smooth idf already baked into exported idf)
        let norm = 0;
        const vec = new Array(this.weights.vocab.length).fill(0);
        let known = 0;
        for (const [term, count] of tf) {
            const i = this.vocabIndex.get(term);
            if (i === undefined) continue;
            const v = count * this.idf[i];
            vec[i] = v;
            norm += v * v;
            known++;
        }
        if (known === 0 || norm === 0) return null;
        norm = Math.sqrt(norm);

        // z = coef . x + intercept, then sigmoid (matches sklearn binary predict_proba)
        let z = this.intercept;
        for (let i = 0; i < vec.length; i++) z += this.coef[i] * (vec[i] / norm);
        const risk = 1 / (1 + Math.exp(-z));

        return { risk, knownTokens: known };
    }
}

export default TextClassifier;
