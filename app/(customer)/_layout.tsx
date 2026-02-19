import { Stack } from 'expo-router';

export default function CustomerLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="home" />
            <Stack.Screen name="new-order" options={{ presentation: 'modal', headerShown: true, title: 'Place Order' }} />
            <Stack.Screen name="order-details" options={{ headerShown: true, title: 'Order Details' }} />
        </Stack>
    );
}
