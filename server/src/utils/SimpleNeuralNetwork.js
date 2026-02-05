/**
 * A generic Neural Network implementation compatible with sklearn usage.
 * Supports arbitrary layers and activations (relu, identity, sigmoid).
 */
class SimpleNeuralNetwork {
    constructor(config) {
        if (config) {
            this.layers = config.layers;
        } else {
            this.layers = [];
        }
    }

    /**
     * Create a network instance from a JSON object (exported from Python)
     */
    static fromJSON(jsonObj) {
        return new SimpleNeuralNetwork(jsonObj);
    }

    /**
     * Run inference (forward pass)
     * @param {Array} inputArray - Array of features (numbers)
     * @returns {Number|Array} - Prediction result (scalar if output is size 1)
     */
    predict(inputArray) {
        // Feed forward layer by layer
        // Wrap input in a 2D array (matrix with 1 row)
        let currentInput = [inputArray]; // Shape [1, n_features]

        for (const layer of this.layers) {
            const weights = layer.weights; // Shape [n_features, n_neurons]
            const biases = layer.biases;   // Shape [n_neurons]
            const activation = layer.activation;

            // Matrix multiplication: input * weights
            // input: [1, A], weights: [A, B] -> output: [1, B]
            let output = this.multiply(currentInput, weights);
            
            // Add biases
            // output[0] is the row of neuron values
            output[0] = output[0].map((val, i) => val + biases[i]);

            // Apply activation function
            if (activation === 'relu') {
                output[0] = output[0].map(v => Math.max(0, v));
            } else if (activation === 'sigmoid') {
                output[0] = output[0].map(v => 1 / (1 + Math.exp(-v)));
            } else if (activation === 'tanh') {
                output[0] = output[0].map(v => Math.tanh(v));
            } else if (activation === 'identity') {
                // Linear / No-op
            }

            // Set current output as input for next layer
            currentInput = output;
        }

        // Return first scalar if single output node, otherwise return the array
        const finalOutput = currentInput[0];
        return finalOutput.length === 1 ? finalOutput[0] : finalOutput;
    }

    // --- Matrix Math Helpers ---

    // A and B must be compatible matrices (A cols = B rows)
    multiply(a, b) {
        let aRows = a.length;
        let aCols = a[0].length;
        let bRows = b.length;
        let bCols = b[0].length;
        
        if (aCols !== bRows) {
            throw new Error(`Matrix mismatch: A cols (${aCols}) !== B rows (${bRows})`);
        }

        let result = new Array(aRows).fill(0).map(() => new Array(bCols).fill(0));
        for (let i = 0; i < aRows; i++) {
            for (let j = 0; j < bCols; j++) {
                for (let k = 0; k < aCols; k++) {
                    result[i][j] += a[i][k] * b[k][j];
                }
            }
        }
        return result;
    }
}

export default SimpleNeuralNetwork;
