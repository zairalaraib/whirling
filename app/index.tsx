import { Redirect } from 'expo-router';
import { useAuth } from '../components/AuthProvider';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
    const { session, loading, profile } = useAuth();

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-white">
                <ActivityIndicator size="large" color="#4F46E5" />
            </View>
        );
    }

    if (!session) {
        return <Redirect href="/(auth)/sign-in" />;
    }

    if (profile?.role === 'laundry_guy') {
        return <Redirect href="/(laundry)/dashboard" />;
    }

    return <Redirect href="/(customer)/home" />;
}
