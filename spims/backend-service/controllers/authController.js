const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../db/pool');

function createHttpError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function getJwtConfig() {
  const accessSecret = process.env.JWT_ACCESS_SECRET;
  const refreshSecret = process.env.JWT_REFRESH_SECRET;

  if (!accessSecret || !refreshSecret) {
    throw createHttpError('JWT secrets are not configured', 500);
  }

  return {
    accessSecret,
    refreshSecret,
    accessTtl: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshTtl: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  };
}

function issueAccessToken(payload, config) {
  return jwt.sign(payload, config.accessSecret, {
    expiresIn: config.accessTtl,
  });
}

function issueRefreshToken(payload, config) {
  return jwt.sign(payload, config.refreshSecret, {
    expiresIn: config.refreshTtl,
  });
}

function parseJwtExpiryToDate(token) {
  const decoded = jwt.decode(token);
  if (!decoded || typeof decoded !== 'object' || !decoded.exp) {
    throw createHttpError('Failed to decode refresh token expiry', 500);
  }
  return new Date(decoded.exp * 1000);
}

async function login(req, res) {
  const username = String(req.body.username || '').trim();
  const password = String(req.body.password || '');

  if (!username || !password) {
    throw createHttpError('username and password are required', 400);
  }

  const { rows } = await query(
    `SELECT id, username, password_hash, role
     FROM users
     WHERE username = $1
     LIMIT 1`,
    [username]
  );

  if (rows.length === 0) {
    throw createHttpError('Invalid credentials', 401);
  }

  const user = rows[0];
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw createHttpError('Invalid credentials', 401);
  }

  const config = getJwtConfig();
  const jwtPayload = {
    sub: user.id,
    username: user.username,
    role: user.role,
  };

  const accessToken = issueAccessToken(jwtPayload, config);
  const refreshToken = issueRefreshToken(jwtPayload, config);
  const refreshExpiresAt = parseJwtExpiryToDate(refreshToken);

  await query('DELETE FROM refresh_sessions WHERE user_id = $1', [user.id]);
  await query(
    `INSERT INTO refresh_sessions (user_id, refresh_token, expires_at)
     VALUES ($1, $2, $3)`,
    [user.id, refreshToken, refreshExpiresAt]
  );

  res.json({
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
    },
    accessToken,
    refreshToken,
  });
}

async function refresh(req, res) {
  const refreshToken = String(req.body.refreshToken || '').trim();
  if (!refreshToken) {
    throw createHttpError('refreshToken is required', 400);
  }

  const config = getJwtConfig();
  try {
    jwt.verify(refreshToken, config.refreshSecret);
  } catch (error) {
    throw createHttpError('Invalid or expired refresh token', 401);
  }

  const { rows } = await query(
    `SELECT rs.id, rs.user_id, rs.expires_at, u.username, u.role
     FROM refresh_sessions rs
     JOIN users u ON u.id = rs.user_id
     WHERE rs.refresh_token = $1
     LIMIT 1`,
    [refreshToken]
  );

  if (rows.length === 0) {
    throw createHttpError('Refresh session not found', 401);
  }

  const session = rows[0];
  if (new Date(session.expires_at).getTime() < Date.now()) {
    await query('DELETE FROM refresh_sessions WHERE id = $1', [session.id]);
    throw createHttpError('Refresh token expired', 401);
  }

  const accessToken = issueAccessToken(
    {
      sub: session.user_id,
      username: session.username,
      role: session.role,
    },
    config
  );

  res.json({ accessToken });
}

async function logout(req, res) {
  const refreshToken = String(req.body.refreshToken || '').trim();
  if (!refreshToken) {
    throw createHttpError('refreshToken is required', 400);
  }

  await query('DELETE FROM refresh_sessions WHERE refresh_token = $1', [refreshToken]);
  res.json({ message: 'Logged out' });
}

module.exports = {
  login,
  refresh,
  logout,
};
