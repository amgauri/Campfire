# API deployment

There is no Render blueprint in this repository. For a Render web service, set
the root directory to `backend/api`, use `npm ci && npm run build` as the build
command, and `npm start` as the start command. Use `/api/v1/health/ready` as the
readiness/health-check path.

Set these environment variables in the hosting service:

- `NODE_ENV=production`
- `HOST=0.0.0.0`
- `PORT` (provided by Render)
- `PERSISTENCE_DRIVER=mongodb`
- `MONGO_URI` (a MongoDB replica-set or sharded-cluster URI with the database
  name included)
- `AUTH_ACCESS_TOKEN_SECRET` (32 cryptographically random bytes encoded as
  base64url)
- `CORS_ORIGINS` (comma-separated web origins; leave empty for native clients
  when no browser origins are used)

`AUTH_ACCESS_TOKEN_TTL_SECONDS`, `AUTH_REFRESH_TOKEN_TTL_DAYS`, `LOG_LEVEL`,
`FASTAPI_BASE_URL`, and `FASTAPI_TIMEOUT_MS` are optional and validated by the
application. The API fails startup if MongoDB is missing, unreachable, or does
not support transactions. The repositories do not fall back to memory in
production.
