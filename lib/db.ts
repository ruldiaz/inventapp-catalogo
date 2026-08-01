import { neon } from '@neondatabase/serverless';

// Obtener la connection string desde .env.local
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error('DATABASE_URL no está definida en .env.local');
}

// Crear el cliente de Neon
export const sql = neon(connectionString);