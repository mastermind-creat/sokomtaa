import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '@/types';

interface CartItem extends Product {
    cartQuantity: number;
}

interface CartState {
    items: CartItem[];
    traderId: number | null;
    traderName: string | null;
    
    addItem: (product: Product, traderId: number, traderName: string) => void;
    removeItem: (productId: number) => void;
    updateQuantity: (productId: number, quantity: number) => void;
    clearCart: () => void;
    
    getTotalItems: () => number;
    getTotalAmount: () => number;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            traderId: null,
            traderName: null,

            addItem: (product, traderId, traderName) => {
                const currentItems = get().items;
                const currentTraderId = get().traderId;

                // If adding from a different trader, clear cart first (market rule: one stall at a time)
                if (currentTraderId !== null && currentTraderId !== traderId) {
                    set({ 
                        items: [{ ...product, cartQuantity: 1 }], 
                        traderId, 
                        traderName 
                    });
                    return;
                }

                const existingItem = currentItems.find(item => item.id === product.id);
                
                if (existingItem) {
                    set({
                        items: currentItems.map(item => 
                            item.id === product.id 
                                ? { ...item, cartQuantity: item.cartQuantity + 1 } 
                                : item
                        ),
                        traderId,
                        traderName
                    });
                } else {
                    set({
                        items: [...currentItems, { ...product, cartQuantity: 1 }],
                        traderId,
                        traderName
                    });
                }
            },

            removeItem: (productId) => {
                const newItems = get().items.filter(item => item.id !== productId);
                set({
                    items: newItems,
                    traderId: newItems.length === 0 ? null : get().traderId,
                    traderName: newItems.length === 0 ? null : get().traderName,
                });
            },

            updateQuantity: (productId, quantity) => {
                if (quantity <= 0) {
                    get().removeItem(productId);
                    return;
                }
                
                set({
                    items: get().items.map(item => 
                        item.id === productId ? { ...item, cartQuantity: quantity } : item
                    )
                });
            },

            clearCart: () => set({ items: [], traderId: null, traderName: null }),

            getTotalItems: () => get().items.reduce((sum, item) => sum + item.cartQuantity, 0),
            
            getTotalAmount: () => get().items.reduce((sum, item) => sum + (item.price * item.cartQuantity), 0),
        }),
        {
            name: 'sokomtaa-cart',
        }
    )
);
