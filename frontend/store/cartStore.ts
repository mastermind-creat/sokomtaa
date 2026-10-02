import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '@/types';

interface CartItem extends Product {
    cartQuantity: number;
}

interface CartState {
    items: CartItem[];
    
    addItem: (product: Product) => void;
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

            addItem: (product) => {
                const currentItems = get().items;
                const existingItem = currentItems.find(item => item.id === product.id);
                
                if (existingItem) {
                    set({
                        items: currentItems.map(item => 
                            item.id === product.id 
                                ? { ...item, cartQuantity: item.cartQuantity + 1 } 
                                : item
                        )
                    });
                } else {
                    set({
                        items: [...currentItems, { ...product, cartQuantity: 1 }]
                    });
                }
            },

            removeItem: (productId) => {
                const newItems = get().items.filter(item => item.id !== productId);
                set({ items: newItems });
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

            clearCart: () => set({ items: [] }),

            getTotalItems: () => get().items.reduce((sum, item) => sum + item.cartQuantity, 0),
            
            getTotalAmount: () => get().items.reduce((sum, item) => sum + (Number(item.active_price ?? item.price) * item.cartQuantity), 0),
        }),
        {
            name: 'sokomtaa-cart',
        }
    )
);
