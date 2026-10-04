# Unintegrated infrastructure drafts

These MongoDB models, example controller, and Socket.IO service are preserved from teammate work. They are not imported by the application or included in the TypeScript build. Their current fields and event handling do not match the authenticated UUID-based API contracts. They must be reconciled and secured before any runtime wiring.

`src/lib/db.ts` provides an optional, validated MongoDB connection at server startup. The API repositories remain in memory; connecting to MongoDB does not make API data persistent.
