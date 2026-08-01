'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';

interface ProductSuggestion {
    id: string;
    sku: string;
    name: string;
    price: number;
    stock: number;
    image: string | null;
}

interface SearchBarProps {
    onSearch: (term: string) => void;
    initialValue?: string;
}

export default function SearchBar({ onSearch, initialValue = '' }: SearchBarProps) {
    const [inputValue, setInputValue] = useState(initialValue);
    const [suggestions, setSuggestions] = useState<ProductSuggestion[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);

    const fetchSuggestions = useCallback(async (query: string) => {
        if (query.trim().length < 2) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`/api/products/suggestions?q=${encodeURIComponent(query)}`);
            const result = await response.json();
            if (result.success) {
                setSuggestions(result.data);
                setShowSuggestions(result.data.length > 0);
            }
        } catch (error) {
            console.error('Error al obtener sugerencias:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }

        debounceTimer.current = setTimeout(() => {
            fetchSuggestions(inputValue);
        }, 300);

        return () => {
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
            }
        };
    }, [inputValue, fetchSuggestions]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setInputValue(value);
        setSelectedIndex(-1);
        if (value.trim() === '') {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    const handleSelectSuggestion = (suggestion: ProductSuggestion) => {
        setInputValue(suggestion.name);
        setShowSuggestions(false);
        onSearch(suggestion.name);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex((prev) => 
                prev < suggestions.length - 1 ? prev + 1 : prev
            );
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex((prev) => (prev > -1 ? prev - 1 : -1));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
                handleSelectSuggestion(suggestions[selectedIndex]);
            } else {
                onSearch(inputValue);
                setShowSuggestions(false);
            }
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
            setSelectedIndex(-1);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch(inputValue);
        setShowSuggestions(false);
    };

    const handleClear = () => {
        setInputValue('');
        setSuggestions([]);
        setShowSuggestions(false);
        onSearch('');
    };

    return (
        <div ref={wrapperRef} className="relative w-full">
            <form onSubmit={handleSubmit} className="flex gap-2">
                <div className="flex-1 relative">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        onFocus={() => {
                            if (suggestions.length > 0) {
                                setShowSuggestions(true);
                            }
                        }}
                        placeholder="Buscar por nombre o SKU..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    />
                    {loading && (
                        <div className="absolute right-10 top-1/2 -translate-y-1/2">
                            <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                        </div>
                    )}
                    {inputValue && !loading && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            ✕
                        </button>
                    )}
                </div>
                <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                >
                    Buscar
                </button>
            </form>

            {/* Sugerencias */}
            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
                    {suggestions.map((suggestion, index) => (
                        <div
                            key={suggestion.id}
                            onClick={() => handleSelectSuggestion(suggestion)}
                            className={`px-4 py-3 cursor-pointer transition-colors ${
                                index === selectedIndex
                                    ? 'bg-blue-50'
                                    : 'hover:bg-gray-50'
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="font-medium text-gray-900">
                                        {suggestion.name}
                                    </div>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="text-xs text-gray-500">
                                            SKU: {suggestion.sku || '-'}
                                        </span>
                                        <span className="text-xs font-semibold text-gray-700">
                                            ${Number(suggestion.price).toFixed(2)}
                                        </span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                                            suggestion.stock > 0
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                        }`}>
                                            Stock: {suggestion.stock ?? 0}
                                        </span>
                                    </div>
                                </div>
                                {suggestion.image && (
                                    <div className="relative w-10 h-10 shrink-0">
                                        <Image
                                            src={suggestion.image}
                                            alt={suggestion.name}
                                            fill
                                            className="object-cover rounded"
                                            sizes="40px"
                                            unoptimized={suggestion.image.startsWith('http')}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Mensaje de no resultados */}
            {showSuggestions && inputValue.trim().length >= 2 && suggestions.length === 0 && !loading && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500">
                    No se encontraron productos para &quot;{inputValue}&quot;
                </div>
            )}
        </div>
    );
}