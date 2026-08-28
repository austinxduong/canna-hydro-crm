require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function testConnection() {
    try {
        const timeResult = await pool.query('SELECT NOW()');
        console.log('Connected to database. Server time:', timeResult.rows[0].now);
        const postgisResult = await pool.query('SELECT PostGIS_Version()');
        console.log('POSTGIST version:', postgisResult.rows[0].postgis_version);
    } catch (err) {
        console.error('Connection failed', err.message);
    } finally {
        await pool.end();
    }
}

testConnection();