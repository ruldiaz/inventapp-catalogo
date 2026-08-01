import { sql } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// Forzar que esta API sea dinámica
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const query = searchParams.get('q') || '';
        const limit = parseInt(searchParams.get('limit') || '10');

        if (!query.trim() || query.trim().length < 2) {
            return NextResponse.json({
                success: true,
                data: []
            });
        }

        const searchTerm = `%${query.trim()}%`;

        const suggestions = await sql`
            SELECT
                id,
                sku,
                name,
                price,
                stock,
                image
            FROM public."Product"
            WHERE "includeInCatalog" = true
                AND (name ILIKE ${searchTerm} OR sku ILIKE ${searchTerm})
            ORDER BY 
                CASE 
                    WHEN name ILIKE ${`${query.trim()}%`} THEN 1
                    WHEN name ILIKE ${`% ${query.trim()}%`} THEN 2
                    ELSE 3
                END,
                name
            LIMIT ${limit}
        `;

        return NextResponse.json({
            success: true,
            data: suggestions
        });

    } catch (error) {
        console.error('Error al obtener sugerencias:', error);
        return NextResponse.json({
            success: false,
            error: 'Error al obtener sugerencias'
        }, { status: 500 });
    }
}