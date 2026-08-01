'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface Product {
    id: string;
    sku: string;
    name: string;
    price: number;
    stock: number;
    category: string | null;
    brand: string | null;
    image: string | null;
    description: string | null;
}

interface PaginationData {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

export function useProducts(initialPage = 1, limit = 20) {
    const [products, setProducts] = useState<Product[]>([]);
    const [pagination, setPagination] = useState<PaginationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(initialPage);
    const [searchTerm, setSearchTerm] = useState('');
    const isFirstRender = useRef(true);

    const fetchProducts = useCallback(async (page: number, search: string) => {
        setLoading(true);
        try {
            const url = `/api/products?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`;
            const response = await fetch(url);
            const result = await response.json();

            if (result.success) {
                setProducts(result.data);
                setPagination(result.pagination);
            } else {
                console.error('Error:', result.error);
            }
        } catch (error) {
            console.error('Error al cargar productos:', error);
        } finally {
            setLoading(false);
        }
    }, [limit]);

    // Efecto para carga inicial
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            fetchProducts(currentPage, searchTerm);
        }
    }, []); // Solo se ejecuta una vez

    // Efecto para cambios de página o búsqueda
    useEffect(() => {
        if (!isFirstRender.current) {
            fetchProducts(currentPage, searchTerm);
        }
    }, [currentPage, searchTerm, fetchProducts]);

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= (pagination?.totalPages || 1)) {
            setCurrentPage(page);
        }
    };

    const handleSearch = (term: string) => {
        setSearchTerm(term);
        setCurrentPage(1);
    };

    return {
        products,
        pagination,
        loading,
        currentPage,
        searchTerm,
        handlePageChange,
        handleSearch
    };
}