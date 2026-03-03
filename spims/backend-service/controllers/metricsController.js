const { query } = require('../db/pool');

function createHttpError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function parseResolvedQuery(value) {
  if (value === undefined) return undefined;
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw createHttpError('resolved must be true or false');
}

function parseMonth(month) {
  if (!month) {
    const now = new Date();
    return {
      year: now.getUTCFullYear(),
      month: now.getUTCMonth() + 1,
    };
  }

  const monthRegex = /^(\d{4})-(\d{2})$/;
  const match = month.match(monthRegex);
  if (!match) {
    throw createHttpError('month must be in YYYY-MM format');
  }

  const year = Number(match[1]);
  const monthNumber = Number(match[2]);
  if (monthNumber < 1 || monthNumber > 12) {
    throw createHttpError('month must be between 01 and 12');
  }

  return {
    year,
    month: monthNumber,
  };
}

function parseDate(value, fieldName) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw createHttpError(`${fieldName} must be a valid date`);
  }
  return date;
}

function buildEnergyUsageFilters({ area, startDate, endDate }) {
  const conditions = [];
  const params = [];

  if (area) {
    params.push(area);
    conditions.push(`area = $${params.length}`);
  }

  if (startDate) {
    params.push(startDate);
    conditions.push(`timestamp >= $${params.length}`);
  }

  if (endDate) {
    params.push(endDate);
    conditions.push(`timestamp <= $${params.length}`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return { whereClause, params };
}

async function getTotalEnergy(req, res) {
  const area = req.query.area;

  const sql = area
    ? `SELECT COALESCE(SUM(consumption), 0)::numeric(12,2) AS total_consumption,
              COUNT(*)::int AS readings,
              MAX(timestamp) AS last_updated
       FROM energy_usage
       WHERE area = $1`
    : `SELECT COALESCE(SUM(consumption), 0)::numeric(12,2) AS total_consumption,
              COUNT(*)::int AS readings,
              MAX(timestamp) AS last_updated
       FROM energy_usage`;

  const params = area ? [area] : [];
  const { rows } = await query(sql, params);

  res.json({
    area: area || 'ALL',
    totalConsumption: Number(rows[0].total_consumption || 0),
    readings: rows[0].readings || 0,
    lastUpdated: rows[0].last_updated,
  });
}

async function getActiveStreetlights(req, res) {
  const { rows } = await query(
    `SELECT
       COUNT(*) FILTER (WHERE status = 'ACTIVE')::int AS active,
       COUNT(*) FILTER (WHERE status = 'OFF')::int AS off,
       COUNT(*) FILTER (WHERE status = 'FAULT')::int AS fault,
       COUNT(*)::int AS total
     FROM (
       SELECT DISTINCT ON (location)
         location,
         status,
         timestamp
       FROM streetlights
       ORDER BY location, timestamp DESC
     ) latest`
  );

  res.json({
    active: rows[0].active,
    off: rows[0].off,
    fault: rows[0].fault,
    total: rows[0].total,
  });
}

async function getFaults(req, res) {
  const resolved = parseResolvedQuery(req.query.resolved);
  const limitRaw = req.query.limit;
  const limit = limitRaw ? Number(limitRaw) : 50;

  if (!Number.isInteger(limit) || limit <= 0 || limit > 500) {
    throw createHttpError('limit must be an integer between 1 and 500');
  }

  let sql = `SELECT id, issue, location, resolved, timestamp, resolved_at
             FROM faults`;
  const params = [];

  if (resolved !== undefined) {
    sql += ' WHERE resolved = $1';
    params.push(resolved);
  }

  sql += ` ORDER BY timestamp DESC
           LIMIT $${params.length + 1}`;
  params.push(limit);

  const { rows } = await query(sql, params);
  res.json({
    count: rows.length,
    items: rows,
  });
}

async function getEnergyUsage(req, res) {
  const area = req.query.area;
  const startDate = parseDate(req.query.startDate, 'startDate');
  const endDate = parseDate(req.query.endDate, 'endDate');
  const limitRaw = req.query.limit;
  const limit = limitRaw ? Number(limitRaw) : 200;

  if (!Number.isInteger(limit) || limit <= 0 || limit > 2000) {
    throw createHttpError('limit must be an integer between 1 and 2000');
  }

  if (startDate && endDate && startDate > endDate) {
    throw createHttpError('startDate must be before endDate');
  }

  const { whereClause, params } = buildEnergyUsageFilters({
    area,
    startDate,
    endDate,
  });
  params.push(limit);

  const { rows } = await query(
    `SELECT id, area, consumption, timestamp
     FROM energy_usage
     ${whereClause}
     ORDER BY timestamp DESC
     LIMIT $${params.length}`,
    params
  );

  res.json({
    count: rows.length,
    items: rows.map((row) => ({
      id: row.id,
      area: row.area,
      consumption: Number(row.consumption),
      timestamp: row.timestamp,
    })),
  });
}

async function exportEnergyUsageCsv(req, res) {
  const area = req.query.area;
  const startDate = parseDate(req.query.startDate, 'startDate');
  const endDate = parseDate(req.query.endDate, 'endDate');

  if (startDate && endDate && startDate > endDate) {
    throw createHttpError('startDate must be before endDate');
  }

  const { whereClause, params } = buildEnergyUsageFilters({
    area,
    startDate,
    endDate,
  });

  const { rows } = await query(
    `SELECT id, area, consumption, timestamp
     FROM energy_usage
     ${whereClause}
     ORDER BY timestamp DESC`,
    params
  );

  const header = 'id,area,consumption,timestamp';
  const csvLines = rows.map((row) => {
    const safeArea = String(row.area).replaceAll('"', '""');
    return `${row.id},"${safeArea}",${Number(row.consumption)},${new Date(row.timestamp).toISOString()}`;
  });

  const csv = [header, ...csvLines].join('\n');
  const stamp = new Date().toISOString().slice(0, 10);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="energy-usage-${stamp}.csv"`);
  res.status(200).send(csv);
}

async function getEnergyAreas(req, res) {
  const { rows } = await query(
    `SELECT DISTINCT area
     FROM energy_usage
     ORDER BY area ASC`
  );

  res.json({
    items: rows.map((row) => row.area),
  });
}

async function getMonthlyReport(req, res) {
  const { year, month } = parseMonth(req.query.month);

  const periodStart = new Date(Date.UTC(year, month - 1, 1));
  const periodEnd = new Date(Date.UTC(year, month, 1));

  const [energyResult, faultsResult] = await Promise.all([
    query(
      `SELECT DATE_TRUNC('day', timestamp) AS day,
              COALESCE(SUM(consumption), 0)::numeric(12,2) AS total_consumption
       FROM energy_usage
       WHERE timestamp >= $1 AND timestamp < $2
       GROUP BY DATE_TRUNC('day', timestamp)
       ORDER BY day ASC`,
      [periodStart, periodEnd]
    ),
    query(
      `SELECT
         COUNT(*)::int AS total_faults,
         COUNT(*) FILTER (WHERE resolved = TRUE)::int AS resolved_faults,
         COUNT(*) FILTER (WHERE resolved = FALSE)::int AS unresolved_faults
       FROM faults
       WHERE timestamp >= $1 AND timestamp < $2`,
      [periodStart, periodEnd]
    ),
  ]);

  res.json({
    month: `${year}-${String(month).padStart(2, '0')}`,
    energyByDay: energyResult.rows.map((row) => ({
      day: row.day,
      totalConsumption: Number(row.total_consumption),
    })),
    faultsSummary: faultsResult.rows[0],
  });
}

async function resolveFault(req, res) {
  const id = Number(req.body.id);

  if (!Number.isInteger(id) || id <= 0) {
    throw createHttpError('id must be a positive integer');
  }

  const { rows } = await query(
    `UPDATE faults
     SET resolved = TRUE,
         resolved_at = NOW()
     WHERE id = $1 AND resolved = FALSE
     RETURNING id, issue, location, resolved, timestamp, resolved_at`,
    [id]
  );

  if (rows.length === 0) {
    throw createHttpError('fault not found or already resolved', 404);
  }

  res.json({
    message: 'Fault resolved',
    fault: rows[0],
  });
}

module.exports = {
  getTotalEnergy,
  getActiveStreetlights,
  getFaults,
  getEnergyUsage,
  getEnergyAreas,
  exportEnergyUsageCsv,
  getMonthlyReport,
  resolveFault,
};