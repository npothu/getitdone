// test-db.js
const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
})

async function testConnection() {
  try {
    const client = await pool.connect()
    const result = await client.query('SELECT NOW()')
    console.log('Database connected successfully:', result.rows[0])
    client.release()
  } catch (err) {
    console.error('Database connection error:', err)
  } finally {
    await pool.end()
  }
}

testConnection()