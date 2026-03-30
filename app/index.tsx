import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';

export default function Index() {
    useEffect(() => {
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            if (!session) {
                router.replace('/(auth)/sign-in');
                return;
            }
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', session.user.id)
                .single();

            if (profile?.role === 'admin') {
                router.replace('/(admin)/dashboard');
            } else if (profile?.role === 'laundry_guy') {
                router.replace('/(laundry)/dashboard');
            } else {
                router.replace('/(customer)/home');
            }
        });
    }, []);

    return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
            <ActivityIndicator size="large" color="#4f46e5" />
        </View>
    );
}
