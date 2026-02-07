"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface CartItem {
    id: string;
    bagId: string;
    restaurantId: string;
    restaurantName: string;
    title: string;
    size: string;
    price: number;
    quantity: number;
    pickupStart: string;
    pickupEnd: string;
    maxQuantity: number;
    dietaryInfo?: string[];
}

interface CartContextType {
    items: CartItem[];
    restaurantId: string | null;
    restaurantName: string | null;
    addToCart: (item: Omit<CartItem, 'id'>) => boolean;
    removeFromCart: (bagId: string) => void;
    updateQuantity: (bagId: string, quantity: number) => void;
    clearCart: () => void;
    getItemQuantity: (bagId: string) => number;
    totalItems: number;
    totalAmount: number;
    platformFee: number;
    grandTotal: number;
    isLoaded: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const PLATFORM_FEE = 5;

export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [restaurantId, setRestaurantId] = useState<string | null>(null);
    const [restaurantName, setRestaurantName] = useState<string | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load cart from localStorage on mount (client-side only)
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedCart = localStorage.getItem('latebites_cart');
            if (savedCart) {
                try {
                    const parsed = JSON.parse(savedCart);
                    setItems(parsed.items || []);
                    setRestaurantId(parsed.restaurantId || null);
                    setRestaurantName(parsed.restaurantName || null);
                } catch (e) {
                    console.error('Failed to load cart:', e);
                }
            }
            setIsLoaded(true);
        }
    }, []);

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        if (isLoaded && typeof window !== 'undefined') {
            localStorage.setItem('latebites_cart', JSON.stringify({
                items,
                restaurantId,
                restaurantName
            }));
        }
    }, [items, restaurantId, restaurantName, isLoaded]);

    const addToCart = (item: Omit<CartItem, 'id'>): boolean => {
        // Check if adding from a different restaurant
        if (restaurantId && restaurantId !== item.restaurantId) {
            return false;
        }

        setItems(prev => {
            const existing = prev.find(i => i.bagId === item.bagId);
            if (existing) {
                return prev.map(i =>
                    i.bagId === item.bagId
                        ? { ...i, quantity: Math.min(i.quantity + item.quantity, i.maxQuantity) }
                        : i
                );
            }
            return [...prev, { ...item, id: `cart_${Date.now()}` }];
        });

        setRestaurantId(item.restaurantId);
        setRestaurantName(item.restaurantName);
        return true;
    };

    const removeFromCart = (bagId: string) => {
        setItems(prev => {
            const newItems = prev.filter(i => i.bagId !== bagId);
            if (newItems.length === 0) {
                setRestaurantId(null);
                setRestaurantName(null);
            }
            return newItems;
        });
    };

    const updateQuantity = (bagId: string, quantity: number) => {
        if (quantity <= 0) {
            removeFromCart(bagId);
            return;
        }
        setItems(prev =>
            prev.map(i =>
                i.bagId === bagId
                    ? { ...i, quantity: Math.min(quantity, i.maxQuantity) }
                    : i
            )
        );
    };

    const clearCart = () => {
        setItems([]);
        setRestaurantId(null);
        setRestaurantName(null);
    };

    const getItemQuantity = (bagId: string): number => {
        const item = items.find(i => i.bagId === bagId);
        return item?.quantity || 0;
    };

    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const platformFee = totalItems > 0 ? PLATFORM_FEE : 0;
    const grandTotal = totalAmount + platformFee;

    return (
        <CartContext.Provider value={{
            items,
            restaurantId,
            restaurantName,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            getItemQuantity,
            totalItems,
            totalAmount,
            platformFee,
            grandTotal,
            isLoaded
        }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
