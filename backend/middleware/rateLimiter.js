/**
 * Rate Limiting Middleware Suite
 * Supports Tiered Rate Limiting:
 * 1. Stricter limits on authentication routes with per-IP & per-account exponential backoff.
 * 2. Moderate limits on public endpoints (per-IP).
 * 3. Looser limits on authenticated user/admin actions (per-User ID / per-IP).
 *
 * ALL thresholds are configurable via environment variables.
 */

// In-Memory Storage Structures
const authIpStore = new Map();
const authAccountStore = new Map();
const publicIpStore = new Map();
const authedUserStore = new Map();

/**
 * Helper to extract client IP address accurately
 */
const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return String(forwarded).split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress || '127.0.0.1';
};

/**
 * Helper to extract account identifier (email / username) from request body
 */
const getAccountIdentifier = (req) => {
  if (!req.body || typeof req.body !== 'object') return null;
  const account = req.body.email || req.body.username || req.body.account;
  if (!account || typeof account !== 'string') return null;
  return account.trim().toLowerCase();
};

/**
 * Configuration Getter (Reads dynamically from process.env with fallbacks)
 */
const getRateLimitConfig = () => {
  return {
    // Auth Routes Config (Stricter limits + Exponential Backoff)
    authWindowMs: parseInt(process.env.RATE_LIMIT_AUTH_WINDOW_MS || (15 * 60 * 1000).toString(), 10),
    authMaxAttempts: parseInt(process.env.RATE_LIMIT_AUTH_MAX_ATTEMPTS || '5', 10),
    authBackoffFactor: parseFloat(process.env.RATE_LIMIT_AUTH_BACKOFF_FACTOR || '2'),
    authBaseBackoffMs: parseInt(process.env.RATE_LIMIT_AUTH_BASE_BACKOFF_MS || '5000', 10),
    authMaxBackoffMs: parseInt(process.env.RATE_LIMIT_AUTH_MAX_BACKOFF_MS || (60 * 60 * 1000).toString(), 10),

    // Public Endpoint Config (Moderate limits)
    publicWindowMs: parseInt(process.env.RATE_LIMIT_PUBLIC_WINDOW_MS || (15 * 60 * 1000).toString(), 10),
    publicMaxRequests: parseInt(process.env.RATE_LIMIT_PUBLIC_MAX_REQUESTS || '2000', 10),

    // Authenticated Actions Config (Looser limits)
    authedWindowMs: parseInt(process.env.RATE_LIMIT_AUTHED_WINDOW_MS || (15 * 60 * 1000).toString(), 10),
    authedMaxRequests: parseInt(process.env.RATE_LIMIT_AUTHED_MAX_REQUESTS || '5000', 10),
  };
};

/**
 * --------------------------------------------------------------------------
 * 1. Auth Rate Limiter (Stricter, Per-IP & Per-Account + Exponential Backoff)
 * --------------------------------------------------------------------------
 */
const authLimiter = (req, res, next) => {
  const config = getRateLimitConfig();
  const now = Date.now();
  const ip = getClientIp(req);
  const account = getAccountIdentifier(req);

  // Check IP tracking record
  const ipRecord = authIpStore.get(ip) || { consecutiveFailures: 0, lastAttemptTime: 0 };
  
  // Check Account tracking record (if account provided)
  const accountRecord = account ? (authAccountStore.get(account) || { consecutiveFailures: 0, lastAttemptTime: 0 }) : null;

  // Determine maximum consecutive failures between IP & Account
  const maxFailures = Math.max(
    ipRecord.consecutiveFailures || 0,
    accountRecord ? (accountRecord.consecutiveFailures || 0) : 0
  );

  const lastAttempt = Math.max(
    ipRecord.lastAttemptTime || 0,
    accountRecord ? (accountRecord.lastAttemptTime || 0) : 0
  );

  // If consecutive failures exceed maxAttempts, calculate exponential backoff delay
  if (maxFailures >= config.authMaxAttempts) {
    const excess = maxFailures - config.authMaxAttempts + 1;
    const backoffDelayMs = Math.min(
      config.authBaseBackoffMs * Math.pow(config.authBackoffFactor, excess - 1),
      config.authMaxBackoffMs
    );
    const lockUntil = lastAttempt + backoffDelayMs;

    if (now < lockUntil) {
      const retryAfterSeconds = Math.ceil((lockUntil - now) / 1000);
      
      res.setHeader('Retry-After', retryAfterSeconds.toString());
      res.setHeader('X-RateLimit-Limit', config.authMaxAttempts.toString());
      res.setHeader('X-RateLimit-Remaining', '0');
      res.setHeader('X-RateLimit-Reset', Math.ceil(lockUntil / 1000).toString());

      return res.status(429).json({
        success: false,
        message: `Too many failed authentication attempts. Exponential backoff active. Please try again in ${retryAfterSeconds} second(s).`,
        retryAfter: retryAfterSeconds
      });
    }
  }

  // Set standard rate limit headers
  const remainingAttempts = Math.max(0, config.authMaxAttempts - maxFailures);
  res.setHeader('X-RateLimit-Limit', config.authMaxAttempts.toString());
  res.setHeader('X-RateLimit-Remaining', remainingAttempts.toString());

  next();
};

/**
 * Record a failed authentication attempt (Increments backoff counter)
 */
const recordAuthFailure = (req) => {
  const now = Date.now();
  const ip = getClientIp(req);
  const account = getAccountIdentifier(req);

  // Update IP record
  const ipRec = authIpStore.get(ip) || { consecutiveFailures: 0, lastAttemptTime: 0 };
  ipRec.consecutiveFailures += 1;
  ipRec.lastAttemptTime = now;
  authIpStore.set(ip, ipRec);

  // Update Account record
  if (account) {
    const accRec = authAccountStore.get(account) || { consecutiveFailures: 0, lastAttemptTime: 0 };
    accRec.consecutiveFailures += 1;
    accRec.lastAttemptTime = now;
    authAccountStore.set(account, accRec);
  }
};

/**
 * Record a successful authentication attempt (Resets backoff counter)
 */
const recordAuthSuccess = (req) => {
  const ip = getClientIp(req);
  const account = getAccountIdentifier(req);

  authIpStore.delete(ip);
  if (account) {
    authAccountStore.delete(account);
  }
};

/**
 * --------------------------------------------------------------------------
 * 2. Public Endpoint Rate Limiter (Moderate Limits, Per-IP)
 * --------------------------------------------------------------------------
 */
const publicLimiter = (req, res, next) => {
  const config = getRateLimitConfig();
  const now = Date.now();
  const ip = getClientIp(req);

  let record = publicIpStore.get(ip);
  if (!record || now > record.resetTime) {
    record = { count: 0, resetTime: now + config.publicWindowMs };
  }

  record.count += 1;
  publicIpStore.set(ip, record);

  const remaining = Math.max(0, config.publicMaxRequests - record.count);
  const resetSeconds = Math.ceil((record.resetTime - now) / 1000);

  res.setHeader('X-RateLimit-Limit', config.publicMaxRequests.toString());
  res.setHeader('X-RateLimit-Remaining', remaining.toString());
  res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000).toString());

  if (record.count > config.publicMaxRequests) {
    res.setHeader('Retry-After', resetSeconds.toString());
    return res.status(429).json({
      success: false,
      message: `Too many requests to public endpoint. Limit is ${config.publicMaxRequests} requests per ${Math.round(config.publicWindowMs / 60000)} minutes. Please try again in ${resetSeconds} second(s).`,
      retryAfter: resetSeconds
    });
  }

  next();
};

/**
 * --------------------------------------------------------------------------
 * 3. Authenticated User Action Rate Limiter (Looser Limits, Per-User ID / Per-IP)
 * --------------------------------------------------------------------------
 */
const authedLimiter = (req, res, next) => {
  const config = getRateLimitConfig();
  const now = Date.now();
  
  // Use authenticated User ID if bound by auth middleware, fallback to IP
  const userKey = (req.admin && (req.admin._id || req.admin.id)) 
    ? `user:${req.admin._id || req.admin.id}` 
    : `ip:${getClientIp(req)}`;

  let record = authedUserStore.get(userKey);
  if (!record || now > record.resetTime) {
    record = { count: 0, resetTime: now + config.authedWindowMs };
  }

  record.count += 1;
  authedUserStore.set(userKey, record);

  const remaining = Math.max(0, config.authedMaxRequests - record.count);
  const resetSeconds = Math.ceil((record.resetTime - now) / 1000);

  res.setHeader('X-RateLimit-Limit', config.authedMaxRequests.toString());
  res.setHeader('X-RateLimit-Remaining', remaining.toString());
  res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000).toString());

  if (record.count > config.authedMaxRequests) {
    res.setHeader('Retry-After', resetSeconds.toString());
    return res.status(429).json({
      success: false,
      message: `Rate limit exceeded for authenticated user actions. Limit is ${config.authedMaxRequests} requests per ${Math.round(config.authedWindowMs / 60000)} minutes. Please try again in ${resetSeconds} second(s).`,
      retryAfter: resetSeconds
    });
  }

  next();
};

/**
 * Periodic Store Garbage Collection (Prevents memory growth in long-running processes)
 */
setInterval(() => {
  const now = Date.now();
  const config = getRateLimitConfig();

  // Clean public IP store
  for (const [key, record] of publicIpStore.entries()) {
    if (now > record.resetTime) publicIpStore.delete(key);
  }

  // Clean authenticated user store
  for (const [key, record] of authedUserStore.entries()) {
    if (now > record.resetTime) authedUserStore.delete(key);
  }

  // Clean stale auth stores (inactive > maxBackoffMs)
  for (const [key, record] of authIpStore.entries()) {
    if (now - record.lastAttemptTime > config.authMaxBackoffMs) authIpStore.delete(key);
  }
  for (const [key, record] of authAccountStore.entries()) {
    if (now - record.lastAttemptTime > config.authMaxBackoffMs) authAccountStore.delete(key);
  }
}, 5 * 60 * 1000);

module.exports = {
  authLimiter,
  recordAuthFailure,
  recordAuthSuccess,
  publicLimiter,
  authedLimiter,
  getRateLimitConfig
};
