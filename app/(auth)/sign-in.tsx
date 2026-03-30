import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';

export default function SignIn() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSignIn = async () => {
        if (!email || !password) {
            Alert.alert('Missing info', 'Please enter your email and password.');
            return;
        }
        setLoading(true);
        const { error, data } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            Alert.alert('Sign In Failed', error.message);
            setLoading(false);
            return;
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .single();

        if (profile?.role === 'admin') {
            router.replace('/(admin)/dashboard');
        } else if (profile?.role === 'laundry_guy') {
            router.replace('/(laundry)/dashboard');
        } else {
            router.replace('/(customer)/home');
        }
        setLoading(false);
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="bg-white">
                <View className="flex-1 px-6 pt-24 pb-10">
                    {/* Header */}
                    <View className="mb-10">
                        <Text className="text-4xl font-bold text-slate-900">Welcome back</Text>
                        <Text className="text-slate-500 mt-2 text-base">Sign in to Whirling</Text>
                    </View>

                    {/* Fields */}
                    <View className="mb-4">
                        <Text className="text-sm font-medium text-slate-700 mb-1">Email</Text>
                        <TextInput
                            value={email}
                            onChangeText={setEmail}
                            placeholder="you@example.com"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            className="border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 text-slate-900"
                        />
                    </View>

                    <View className="mb-8">
                        <Text className="text-sm font-medium text-slate-700 mb-1">Password</Text>
                        <TextInput
                            value={password}
                            onChangeText={setPassword}
                            placeholder="••••••••"
                            secureTextEntry
                            className="border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 text-slate-900"
                        />
                    </View>

                    <TouchableOpacity
                        onPress={handleSignIn}
                        disabled={loading}
                        className="bg-indigo-600 py-4 rounded-2xl mb-4"
                    >
                        <Text className="text-white text-center font-bold text-lg">
                            {loading ? 'Signing in...' : 'Sign In'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => router.push('/(auth)/sign-up')}>
                        <Text className="text-center text-slate-500">
                            Don't have an account?{' '}
                            <Text className="text-indigo-600 font-semibold">Sign Up</Text>
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => router.push('/(auth)/admin-sign-in')}
                        className="mt-12"
                    >
                        <Text className="text-center text-slate-300 text-xs">Admin Login</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
