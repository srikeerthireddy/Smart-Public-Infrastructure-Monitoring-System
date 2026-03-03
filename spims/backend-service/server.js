require('dotenv').config();

const cors = require('cors');
const express = require('express');

const { pool, query } = require('./db/pool');
const { initDb } = require('./db/init');
const { seedDb } = require('./db/seed');
const authRoutes = require('./routes/authRoutes');
const metricsRoutes = require('./routes/metricsRoutes');
const { startSimulator } = require('./services/simulator');
const { requestLogger } = require('./middleware/requestLogger');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();
const port = Number(process.env.PORT || 5000);
const allowedOrigins = (process.env.CORS_ORIGINS || '*').split(',').map((value) => value.trim());
const corsOrigin = allowedOrigins.includes('*') ? '*' : allowedOrigins;

app.use(
	cors({
		origin: corsOrigin,
	})
);
app.use(express.json());
app.use(requestLogger);

app.get('/health', async (req, res) => {
	const startedAt = Date.now();
	await query('SELECT 1');
	res.json({
		status: 'ok',
		db: 'connected',
		uptimeSeconds: Math.floor(process.uptime()),
		responseTimeMs: Date.now() - startedAt,
		timestamp: new Date().toISOString(),
	});
});

app.use('/api/auth', authRoutes);
app.use('/api', metricsRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

async function startServer() {
	await initDb();
	if ((process.env.AUTO_SEED || 'true').toLowerCase() === 'true') {
		await seedDb({ skipInit: true });
	}

	const stopSimulator = startSimulator(process.env.SIMULATOR_INTERVAL_MS || 10000);

	const server = app.listen(port, () => {
		console.log(`[APP] Backend service running on port ${port}`);
	});

	const shutdown = async (signal) => {
		console.log(`[APP] ${signal} received, shutting down...`);
		stopSimulator();
		server.close(async () => {
			await pool.end();
			process.exit(0);
		});
	};

	process.on('SIGINT', () => shutdown('SIGINT'));
	process.on('SIGTERM', () => shutdown('SIGTERM'));
}

startServer().catch(async (error) => {
	console.error('[APP] Startup failed:', error.message);
	await pool.end();
	process.exit(1);
});
