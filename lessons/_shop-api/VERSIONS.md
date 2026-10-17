# Phiên bản đã đối chiếu (2026-10-17)

Dùng thống nhất cho `solutions/DEPS` của mọi module. Chỉ nâng khi đã chạy lại toàn bộ `--solutions`.

| Gói | Phiên bản | Ghi chú |
|---|---|---|
| Node | 24 LTS | Jest chạy được với ESM-only package từ Node ≥ 24.9 |
| @nestjs/* (core, common, platform-express, testing, websockets, microservices, cqrs, event-emitter, schedule, cache-manager, config, typeorm, swagger, terminus, jwt, passport, bullmq, mapped-types) | ^12 | `@nestjs/graphql`, `@nestjs/apollo` là ^14; `@nestjs/throttler` ^6 |
| typescript | ^6 | `nest new` sinh TS 6 |
| jest / ts-jest / supertest | ^30 / ^29.4 / ^7 | CJS + Jest (chọn "CJS" khi `nest new`) |
| typeorm | ^1.1 | `join`/`relations: string[]`/`select: string[]` đã bỏ; `where` với `null/undefined` ném lỗi mặc định |
| pg | ^8 | |
| class-validator / class-transformer | ^0.15 / ^0.5 | |
| bullmq / ioredis | ^6 / ^6 | |
| cache-manager / @keyv/redis / keyv | ^7 / ^6 / ^6 | |
| argon2 / bcrypt | ^0.45 / ^6 | |
| passport / passport-jwt | ^0.7 / ^4 | |
| helmet / compression / multer | ^8 / ^1 / ^2 | |
| nestjs-pino / pino / nestjs-cls | ^5 / ^10 / ^7 | |
| prom-client | ^15 | |
| decimal.js | ^10 | |
| socket.io | ^4 | |
| graphql / @apollo/server / dataloader | ^17 / ^5 / ^2 | |
| amqplib / amqp-connection-manager | ^2 / ^5 | |
| @casl/ability | ^7 | |
| testcontainers / @testcontainers/postgresql | ^12 | tùy chọn ở Q02 |

Linter mặc định của `nest new` 12 là `oxlint` (chạy `npm run lint`); testkit không phụ thuộc linter.
