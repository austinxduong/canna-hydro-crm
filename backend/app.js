const express = require('express');
const app = express()
const pool = require('./db/Pool')
const cors = require('cors');
const { rateLimit } = require('express-rate-limit')

app.use(express.json())
app.use(cors())

//middlewares
app.use((req, res, next) =>{
    console.log('Time:', Date.now());
    next()
})

app.use('/health', (req, res, next) => {
    console.log('Request Type', req.method);
    next();
})

const limiter = rateLimit({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
    limit: Number(process.env.RATE_LIMIT_MAX) || 30,
    message: {message:'Too many requests, please try again later'}
})

// route handler for the first test
app.get('/health', (req, res) => {
    res.send('hello world')
});

// route handler for the second test
app.get('/businesses', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM "Business"')
        res.json(result.rows);
    } catch (error) {
        res.status(500).send('Something went wrong')
        console.log(error)
    }
})

app.post('/businesses', limiter, async (req, res) => {
    try {
        const result = await pool.query('INSERT INTO "Business"(name, address, category) VALUES ($1, $2, $3) RETURNING *', [req.body.name, req.body.address, req.body.category],
        )
        res.status(201).json(result.rows)
    } catch(error) {
        res.status(500).send('Something went wrong')
        console.log(error)
    }
})

app.get('/businesses/:id', async (req, res) =>{
    try {
        const result = await pool.query('SELECT * FROM "Business" WHERE id = $1', [req.params.id])
    if (result.rows.length === 0) {
        return res.status(404).json({message: "Item not found"})
        }
        res.status(200).json(result.rows[0])
    } catch (error) {
        res.status(500).send('Something went wrong')
        console.log(error)
    }
})

app.patch('/businesses/:id', limiter, async (req, res) =>{
    try {
        const result = await pool.query('UPDATE "Business" SET name = $2 WHERE id =$1 RETURNING *' , [req.params.id, req.body.name])
        if (result.rows.length === 0) {
            return res.status(404).json({message: "Item not found"})
        }
        res.status(200).json(result.rows[0])
    } catch (error) {
        res.status(500).send('Something went wrong')
        console.log(error)
    }
})

app.delete('/businesses/:id', limiter, async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM "Business" WHERE id = $1 RETURNING *', [req.params.id])
        if (result.rows.length === 0) {
            return res.status(404).json({message: "Item not found"})
        }
        res.status(200).json(result.rows[0])
    } catch (error) {
        res.status(500).send('Something went wrong')
        console.log(error)
    }
})

module.exports = app;