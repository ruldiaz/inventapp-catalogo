import { sql } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        // Consulta simple para verificar conexión
        const result = await sql`SELECT NOW() as hora, version() as version_postgres`;

        return NextResponse.json({
            success: true,
            message: 'Conexión exitosa a NeonDB',
            data: result
        });
    } catch (error) {
        console.error('Error de conexión', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido'
        }, { status: 500 });
    }
}