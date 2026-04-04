import { ThemedText } from '@/components/themed-text';
import { AppStyles } from '@/constants/appStyles';
import * as IAP from 'expo-iap';
import { useEffect, useState } from 'react';
import { Pressable } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';

const PRODUCT_IDS = [
    'com.yourapp.locator.monthly',
    'com.yourapp.locator.yearly'
];
//NOTE: The listeners for the callback of purchase are in apps/_layout.tsx since they need to be global and not tied to a specific screen. The hook is here since it is only relevant for Apple subscriptions and not any other purchases we may add in the future.

// Fetches available subscription products from the App Store
export function useSubscriptionProducts() {
    const [products, setProducts] = useState<IAP.ProductOrSubscription[]>([]);

    useEffect(() => {
        console.log('[AppleSubscriptionService] Initializing IAP connection and fetching products...');
        async function load() {
            await IAP.initConnection();
            const result = await IAP.fetchProducts({ skus: PRODUCT_IDS, type: 'subs' });
            console.log('[AppleSubscriptionService] Fetched products:', result);
            setProducts(result);
        }
        load();

        return () => {
            IAP.endConnection();
        };
    }, []);

    return products;
}

// Triggers the Apple payment sheet for a given product ID
export async function purchaseSubscription(productId: string) {
    try {
        await IAP.requestPurchase({
            request: { apple: { sku: productId } },
            type: 'subs',
        });
        // purchaseUpdatedListener (set up in _layout.tsx) handles the transaction result
    } catch (error) {
        console.error('Purchase failed:', error);
    }
}

export const AppleSubscribeButton = () => {
    const tint = useThemeColor({}, 'tint');
    // 1. Fetch products at render time using the hook
    const products = useSubscriptionProducts();

    // 2. On press, purchase the first available product (monthly by default)
    const handlePress = () => {
        console.log('[AppleSubscriptionService] Available products:', products);
        const firstProduct: IAP.ProductOrSubscription | undefined = products[0];
        if (firstProduct) {
            purchaseSubscription(firstProduct.id);
        }
    };

    return (
        <Pressable
            style={({ pressed }) => [AppStyles.ghostButton, { borderColor: tint, marginTop: 14, opacity: pressed ? 0.7 : 1 }]}
            onPress={handlePress}
        >
            <ThemedText style={[AppStyles.ghostButtonText, { color: tint }]}>Subscribe</ThemedText>
        </Pressable>
    );
};
