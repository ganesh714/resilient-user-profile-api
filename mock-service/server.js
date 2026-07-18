const express = require('express');

const app = express();
const PORT = process.env.PORT || 8081;

// Configuration from environment variables
const MOCK_FAILURE_RATE = parseFloat(process.env.MOCK_FAILURE_RATE || '0.0');
const MOCK_LATENCY_MS = parseInt(process.env.MOCK_LATENCY_MS || '50', 10);

app.get('/enrich', async (req, res) => {
    const userId = req.query.userId;
    console.log(`[Mock Service] Received request for userId: ${userId}`);

    // Simulate Network Latency
    if (MOCK_LATENCY_MS > 0) {
        await new Promise(resolve => setTimeout(resolve, MOCK_LATENCY_MS));
    }

    // Simulate Failure
    const random = Math.random();
    if (random < MOCK_FAILURE_RATE) {
        console.log(`[Mock Service] Simulating failure (rate: ${MOCK_FAILURE_RATE})`);
        return res.status(503).json({ error: 'Service Unavailable' });
    }

    // Success Response
    res.status(200).json({
        recentActivity: ["login", "view_item"],
        loyaltyScore: 450
    });
});

app.listen(PORT, () => {
    console.log(`Mock Enrichment Service listening on port ${PORT}`);
    console.log(`Config: FAILURE_RATE=${MOCK_FAILURE_RATE}, LATENCY_MS=${MOCK_LATENCY_MS}`);
});
