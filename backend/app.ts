const express = require('express');
const app = express()
const pool = require('./db/Pool')
const cors = require('cors');
const { rateLimit } = require('express-rate-limit')
import { Request, Response, NextFunction } from 'express';

app.use(express.json())
app.use(cors())

//middlewares
app.use((req: Request, res: Response, next: NextFunction) =>{
    console.log('Time:', Date.now());
    next()
})

app.use('/health', (req: Request, res: Response, next: NextFunction) => {
    console.log('Request Type', req.method);
    next();
})

const limiter = rateLimit({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
    limit: Number(process.env.RATE_LIMIT_MAX) || 30,
    message: {message:'Too many requests, please try again later'}
})

// route handler for the first test
app.get('/health', (req: Request, res: Response) => {
    res.send('hello world')
});

const BUSINESS_COLUMNS = `id, name, address, phone, category, license_status, license_number, stage, assigned_rep, last_activity_at, ST_X(location::geometry) AS lng, ST_Y(location::geometry) AS lat`

// route handler for the second test
app.get('/businesses', async (req: Request, res: Response) => {
    try {
        const result = await pool.query(`SELECT ${BUSINESS_COLUMNS} FROM "Business"`)
        res.json(result.rows);
    } catch (error) {
        res.status(500).send('Something went wrong')
        console.log(error)
    }
})

app.post('/businesses', limiter, async (req: Request, res: Response) => {
    try {
        if (!req.body.name || !req.body.address || !req.body.category) {
            return res.status(400).json({message: "fields cannot be empty"})
        }
        const result = await pool.query('INSERT INTO "Business"(name, address, category) VALUES ($1, $2, $3) RETURNING *', [req.body.name, req.body.address, req.body.category],)
        res.status(201).json(result.rows)
    } catch(error) {
        res.status(500).send('Something went wrong')
        console.log(error)
    }
})

app.get('/businesses/:id', async (req: Request, res: Response) =>{
    try {
        const result = await pool.query(`
            SELECT
                ${BUSINESS_COLUMNS},
                (
                    SELECT STRING_AGG(source_records.source, ', ')
                    FROM source_records
                    WHERE source_records.business_id = "Business".id
                )   AS sources
            FROM "Business"
            WHERE id = $1`, 
            [req.params.id]
            )
    if (result.rows.length === 0) {
        return res.status(404).json({message: "Item not found"})
        }
        res.status(200).json(result.rows[0])
    } catch (error) {
        res.status(500).send('Something went wrong')
        console.log(error)
    }
})

app.patch('/businesses/:id', limiter, async (req: Request, res: Response) =>{
    try {
        if (!req.body.name || !req.body.address || !req.body.category || !req.body.stage) {
            return res.status(400).json({message: "fields cannot be empty"})
        }
        const existingBusiness = await pool.query(
            'SELECT stage FROM "Business" WHERE id = $1', [req.params.id])
        if (existingBusiness.rows.length === 0) {
            return res.status(404).json({message: "Item not found"})
        }
        const previousStage = existingBusiness.rows[0].stage
        const stageChanged = previousStage !== req.body.stage
        const updatedBusiness = await pool.query(
            'UPDATE "Business" SET name = $2, address = $3, category = $4, stage = $5, assigned_rep = $6, last_activity_at = NOW() WHERE id =$1 RETURNING *' , [req.params.id, req.body.name, req.body.address, req.body.category, req.body.stage, req.body.assigned_rep])
        if (updatedBusiness.rows.length === 0) {
            return res.status(404).json({message: "Item not found"})
        }
        if (stageChanged) {
        const activityLogEntry = await pool.query(
            'INSERT INTO "activity_log"(business_id, activity_type, note, created_at) VALUES ($1, $2, $3, NOW()) RETURNING *', [req.params.id, 'stage_change', `Stage moved from ${previousStage} to ${req.body.stage}`])
        }
        res.status(200).json(updatedBusiness.rows[0])
    } catch (error) {
        res.status(500).send('Something went wrong')
        console.log(error)
    }
})

app.delete('/businesses/:id', limiter, async (req: Request, res: Response) => {
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

app.get('/businesses/:id/activity', async (req: Request, res: Response) => {
    try {
        const existingBusiness = await pool.query('SELECT id FROM "Business" WHERE id = $1', [req.params.id])
        if (existingBusiness.rows.length === 0) {
        return res.status(404).json({message: "Business not found"})
        }
        const existingActivity = await pool.query('SELECT * FROM "activity_log" WHERE business_id = $1 ORDER BY created_at DESC', [req.params.id])
        res.status(200).json(existingActivity.rows)
    } catch (error){
        res.status(500).send('Something went wrong')
    }
})

app.post('/businesses/:id/activity', async (req: Request, res: Response) => {
    try {
        if (!req.body.note) {
            return res.status(400).json({message: "fields cannot be empty"})
        }
        const existingBusiness = await pool.query('SELECT id FROM "Business" WHERE id = $1', [req.params.id])
        if (existingBusiness.rows.length === 0) {
        return res.status(404).json({message: "Business not found"})
        }
        const existingActivity = await pool.query('INSERT into "activity_log" (business_id, activity_type, note, created_at) VALUES ($1, $2, $3, NOW()) RETURNING *', [req.params.id, 'note', req.body.note])
        res.status(201).json(existingActivity.rows[0])
    } catch (err) {
        res.status(500).send('Sometihng went wrong')
    }
})

app.get('/users', async (req: Request, res: Response) => {
    try {
        const users = await pool.query('SELECT id, name, role FROM "Users" WHERE status = $1 ORDER BY name ASC',['active'])
        res.json(users.rows)
    } catch (err) {
        res.status(500).send('Something went wrong')
    }
})

module.exports = app;