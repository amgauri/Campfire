# Campfire AI Service

AI services for the Campfire campus social platform.

## Features

- Text content moderation
- Image NSFW moderation
- Feed recommendation and ranking
- Surge user matching

## Architecture

The AI service is a standalone FastAPI microservice.

```text
React Native / Expo
        |
        v
   Node.js Backend
        |
        v
   FastAPI AI Service
        |
        v
     AI Models