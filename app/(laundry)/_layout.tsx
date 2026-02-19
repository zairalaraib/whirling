import { Stack } from 'expo-router';

export default function LaundryLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="dashboard" />
            <Stack.Screen name="order-details" options={{ headerShown: true, title: 'Manage Order' }} />
        </Stack>
    );
}
