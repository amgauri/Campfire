/**
 * Shared JSDoc typedefs. Payload shapes here are PROVISIONAL until the
 * backend contract is agreed. Mocks must match these shapes.
 */

/** @typedef {'day' | 'night'} AppMode */

/**
 * @typedef {Object} HealthStatus
 * @property {string} status     e.g. "ok"
 * @property {string} service    which service answered
 * @property {string} timestamp  ISO date string
 */

/**
 * @typedef {Object} ApiErrorShape
 * @property {string} message
 * @property {number} status   HTTP status, or 0 for network/timeout
 * @property {string} code     e.g. "NETWORK_ERROR", "TIMEOUT", "HTTP_ERROR"
 * @property {*} [details]
 */

export {};