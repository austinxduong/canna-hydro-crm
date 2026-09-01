import request from "supertest"
import { test, expect } from "vitest"
import app from "./app"

test('Test Rate limitier for max amount of request sent', async () => {
    const RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_MAX);
    const payload = {name: 'John', address: '555 Sun River', category: 'Hydroponics'};

    for (let i = 0; i < RATE_LIMIT_MAX; i++) {
        const response = await request(app)
        .post('/businesses')
        .send(payload)
    expect(response.status).toBe(201)
    }

    const limiter = await request(app)
        .post('/businesses')
        .send(payload);
    console.log("block response body", limiter.body.message)
    expect(limiter.status).toBe(429)
    expect(limiter.body.message).toContain('Too many requests, please try again later')
})