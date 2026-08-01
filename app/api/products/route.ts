import { sql } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        // Obtener parámetros de la URL
        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const search = searchParams.get('search') || '';
        const offset = (page - 1) * limit;

        let products;
        let totalResult;

        // Si hay búsqueda, usar filtro
        if (search.trim()) {
            const searchTerm = `%${search.trim()}%`;
            
            // Obtener productos con búsqueda
            products = await sql`
                SELECT
                    id,
                    sku,
                    name,
                    price,
                    stock,
                    category,
                    brand,
                    image,
                    description
                FROM public."Product"
                WHERE "includeInCatalog" = true
                    AND (name ILIKE ${searchTerm} OR sku ILIKE ${searchTerm})
                ORDER BY name
                LIMIT ${limit}
                OFFSET ${offset}
            `;

            // Total con búsqueda
            totalResult = await sql`
                SELECT COUNT(*) as total
                FROM public."Product"
                WHERE "includeInCatalog" = true
                    AND (name ILIKE ${searchTerm} OR sku ILIKE ${searchTerm})
            `;
        } else {
            // Sin búsqueda, traer todos
            products = await sql`
                SELECT
                    id,
                    sku,
                    name,
                    price,
                    stock,
                    category,
                    brand,
                    image,
                    description
                FROM public."Product"
                WHERE "includeInCatalog" = true
                ORDER BY name
                LIMIT ${limit}
                OFFSET ${offset}
            `;

            totalResult = await sql`
                SELECT COUNT(*) as total
                FROM public."Product"
                WHERE "includeInCatalog" = true
            `;
        }

        const total = Number(totalResult[0]?.total || 0);
        const totalPages = Math.ceil(total / limit);

        return NextResponse.json({
            success: true,
            data: products,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        });

    } catch (error) {
        console.error('Error al obtener productos:', error);
        return NextResponse.json({
            success: false,
            error: 'Error al obtener productos'
        }, { status: 500 });
    }
}