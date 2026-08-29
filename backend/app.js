const express = require('express');
const app = express()
const pool = require('./db/Pool')

app.use(express.json())

//middlewares
app.use((req, res, next) =>{
    console.log('Time:', Date.now());
    next()
})

app.use('/health', (req, res, next) => {
    console.log('Request Type', req.method);
    next();
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

app.post('/businesses', async (req, res) => {
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


module.exports = app;