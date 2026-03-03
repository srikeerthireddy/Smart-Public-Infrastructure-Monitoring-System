const { pool } = require('../db/pool');

const AREAS = ['Downtown', 'Residential-North', 'Industrial-East', 'University-Zone', 'Airport-Corridor'];
const LIGHT_LOCATIONS = ['Main Avenue', 'Central Park Road', 'Airport Link', 'Harbor Street', 'Ring Road', 'Metro Junction'];
const FAULT_ISSUES = [
  'Transformer overheating',
  'Voltage instability detected',
  'Streetlight controller offline',
  'Cabinet communication timeout',
  'Power line fluctuation',
];

function randomFrom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function randomConsumption() {
  return Number((50 + Math.random() * 300).toFixed(2));
}

function randomLightStatus() {
  const roll = Math.random();
  if (roll < 0.75) return 'ACTIVE';
  if (roll < 0.9) return 'OFF';
  return 'FAULT';
}

async function insertSimulationTick() {
  const area = randomFrom(AREAS);
  const lightLocation = randomFrom(LIGHT_LOCATIONS);
  const lightStatus = randomLightStatus();

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      `INSERT INTO energy_usage (area, consumption, timestamp)
       VALUES ($1, $2, NOW())`,
      [area, randomConsumption()]
    );

    await client.query(
      `INSERT INTO streetlights (location, status, timestamp)
       VALUES ($1, $2, NOW())`,
      [lightLocation, lightStatus]
    );

    if (lightStatus === 'FAULT' || Math.random() < 0.2) {
      await client.query(
        `INSERT INTO faults (issue, location, resolved, timestamp)
         VALUES ($1, $2, FALSE, NOW())`,
        [randomFrom(FAULT_ISSUES), lightLocation]
      );
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

function startSimulator(intervalMs) {
  const effectiveInterval = Number(intervalMs) || 10000;
  const intervalId = setInterval(async () => {
    try {
      await insertSimulationTick();
      console.log('[SIM] Tick written');
    } catch (error) {
      console.error('[SIM] Tick failed:', error.message);
    }
  }, effectiveInterval);

  console.log(`[SIM] Started (interval: ${effectiveInterval}ms)`);

  return () => {
    clearInterval(intervalId);
    console.log('[SIM] Stopped');
  };
}

module.exports = {
  startSimulator,
};