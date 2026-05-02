/**
 * Allowed values for the logging middleware fields.
 * All values must be lower case as required by the evaluation service.
 */

export const ALLOWED_STACKS = Object.freeze(["backend", "frontend"]);

export const ALLOWED_LEVELS = Object.freeze([
  "debug",
  "info",
  "warn",
  "error",
  "fatal",
]);

/** Backend-only packages */
export const BACKEND_PACKAGES = Object.freeze([
  "cache",
  "controller",
  "cron_job",
  "db",
  "domain",
  "handler",
  "repository",
  "route",
  "service",
]);

/** Frontend-only packages */
export const FRONTEND_PACKAGES = Object.freeze([
  "api",
  "component",
  "hook",
  "page",
  "state",
  "style",
]);

/** Packages valid for both stacks */
export const SHARED_PACKAGES = Object.freeze([
  "auth",
  "config",
  "middleware",
  "utils",
]);

export const ALLOWED_PACKAGES = Object.freeze([
  ...BACKEND_PACKAGES,
  ...FRONTEND_PACKAGES,
  ...SHARED_PACKAGES,
]);

export const LOG_API_URL = "http://20.207.122.201/evaluation-service/logs";
