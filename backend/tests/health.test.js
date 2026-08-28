import request from 'supertest'
import { test, expect }  from 'vitest';
import app  from './app';


test('health check', async () =>{
    const response = await request(app).get('/health');
    expect(response.text).toBe("hello world")
})

test('business route', async () => {
    const response = await request(app).get('/businesses')
    expect(response.status).toBe(200)
    expect(Array.isArray(response.body)).toBe(true)
})