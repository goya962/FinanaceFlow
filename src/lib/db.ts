import { Pool } from 'pg';

// This creates a connection pool.
// The `pg` library will automatically use the POSTGRES_URL from .env
const pool = new Pool();

export default pool;
