import request from 'supertest'
import { test, expect }  from 'vitest';
import app  from './app';


test('health check', async () =>{
    const response = await request(app).get('/health');
    expect(response.text).toBe("hello world")
})

test('GET business route', async () => {
    const response = await request(app).get('/businesses')
    expect(response.status).toBe(200)
    expect(Array.isArray(response.body)).toBe(true)
})

test('POST business route', async () => {
    const response = await request(app)
        .post('/businesses')
        .send({name: 'John', address:'555 Sun River', category: 'Hydroponics'})
    expect(response.status).toBe(201)
    expect(response.body[0].name).toBe('John')
    expect(Array.isArray(response.body)).toBe(true)
})

test('GET by ID business route', async () => {
    const createResponse = await request(app)
        .post('/businesses')
        .send({name: 'John', address:'555 Sun River', category: 'Hydroponics'})
    const id = createResponse.body[0].id
    const response = await request(app)    
        .get(`/businesses/${id}`)
    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty('id', id)
})

test('UPDATE by ID business route', async () => {
    const createResponse = await request(app)
        .post('/businesses')
        .send({name: 'John', address: '555 Sun River', category: 'Hydroponics'})
    const id = createResponse.body[0].id
    const response = await request(app)
        .patch(`/businesses/${id}`)
        .send({name: 'Remy', address: '555 Sun River', category: 'Hydroponics'})
    expect(response.status).toBe(200)
    expect(response.body.name).toBe('Remy')
    expect(response.body.address).toBe('555 Sun River')
    expect(response.body.category).toBe('Hydroponics')
})

test('DELETE by ID business route', async () => {
    const createResponse = await request(app)
        .post('/businesses')
        .send({name: 'Remy', address: '555 Sun River', category: 'Hydroponics'})
    const id = createResponse.body[0].id
    const response = await request(app)
        .delete(`/businesses/${id}`)
    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty('id', id)
})

test('GET by id, 404 handling', async () => {
    const nonExistentId = '999999999'
    const response = await request(app)
        .get(`/businesses/${nonExistentId}`)
    expect(response.status).toBe(404)
    expect(response.body.message).toBe("Item not found")
})

test('PATCH by id, 404 handling', async () => {
    const nonExistentId = '999999999'
    const updateData = { name: "new name", address: "555 Sun River", category:"Hydroponics"}
    const response = await request(app)
        .patch(`/businesses/${nonExistentId}`)
        .send(updateData)
    expect(response.status).toBe(404)
    expect(response.body.message).toBe("Item not found")
})

test('DELETE by id, 404 handling', async () => {
    const nonExistentId = '999999999'
    const response = await request(app)
        .delete(`/businesses/${nonExistentId}`)
    expect(response.status).toBe(404)
    expect(response.body.message).toBe("Item not found")
})

test('POST, 400 missing fields', async () => {
    const response = await request(app)
        .post('/businesses')
        .send({name: "", address: "", category:""})
    expect(response.status).toBe(400)
    expect(response.body.message).toBe("fields cannot be empty")
})

test('PATCH by id, 400 missing fields', async () => {
    const createResponse = await request(app)
        .post('/businesses')
        .send({name: "new name", address: "555 Sun River", category: "Hydroponics"})
    const id = createResponse.body[0].id
    const response = await request(app)
        .patch(`/businesses/${id}`)
        .send({name: "new name", address: "", category: ""})
    expect(response.status).toBe(400)
    expect(response.body.message).toBe("fields cannot be empty")
})

