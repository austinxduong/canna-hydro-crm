const express = require('express');
const app = express()
const pool = require('./db/Pool')

app.use((req, res, next) =>{
    console.log('Time:', Date.now());
    next()
})

app.use('/health', (req, res, next) => {
    console.log('Request Type', req.method);
    next();
})

app.get('/health', (req, res) => {
    res.send('hello world')
});

app.get('/businesses', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM "Business"')
        res.json(result.rows);
    } catch (error) {
        res.status(200).send('Something went wrong')
        console.log(error)
    }

})


module.exports = app;