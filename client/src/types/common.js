/**
 * Shared JSDoc typedefs for mobile-facing API and UI data.
 */

/** @typedef {'day' | 'night'} AppMode */

/** @typedef {'loading' | 'signedOut' | 'needsOnboarding' | 'signedIn'} AuthPhase */

/**
 * @typedef {Object} HealthStatus
 * @property {string} status
 */

/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} username
 * @property {string} displayName
 * @property {string} email
 * @property {string|null} avatarUrl
 * @property {number} auraLevel            0-3, provisional (see AuraRing)
 * @property {string[]} interests
 * @property {boolean} onboardingComplete
 */

/**
 * @typedef {Object} AuthSession
 * @property {User} user
 * @property {string} token       Access token held in memory
 * @property {string} refreshToken Rotating credential held in secure storage
 */

/**
 * @typedef {Object} SurgeStatus
 * @property {boolean} isActive
 * @property {string|null} startsAt  ISO date string (display only, never used to decide anything)
 * @property {string|null} endsAt    ISO date string (display only)
 */

/**
 * @typedef {Object} ApiErrorShape
 * @property {string} message
 * @property {number} status   HTTP status, or 0 for network/timeout
 * @property {string} code     e.g. "NETWORK_ERROR", "TIMEOUT", "HTTP_ERROR"
 * @property {*} [details]
 */

export {};
