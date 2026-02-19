import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';

export default function SignIn() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function signInWithEmail() {
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            Alert.alert('Error', error.message);
        } else {
            // Navigate to index which will handle the redirect based on role
            router.replace('/');
        }
        setLoading(false);
    }

    return (
        <View className="flex-1 justify-center p-6 bg-slate-50">
            <View className="mb-8">
                <Text className="text-3xl font-bold text-slate-900 mb-2">Welcome Back</Text>
                <Text className="text-slate-600">Sign in to manage your laundry</Text>
            </View>

            <View className="space-y-4">
                <View>
                    <Text className="text-sm font-medium text-slate-700 mb-1">Email</Text>
                    <TextInput
                        onChangeText={setEmail}
                        value={email}
                        placeholder="email@address.com"
                        autoCapitalize="none"
                        className="w-full bg-white border border-slate-300 rounded-lg p-3 text-slate-900"
                    />
                </View>

                <View>
                    <Text className="text-sm font-medium text-slate-700 mb-1">Password</Text>
                    <TextInput
                        onChangeText={setPassword}
                        value={password}
                        placeholder="Password"
                        secureTextEntry
                        autoCapitalize="none"
                        className="w-full bg-white border border-slate-300 rounded-lg p-3 text-slate-900"
                    />
                </View>

                <TouchableOpacity
                    onPress={signInWithEmail}
                    disabled={loading}
                    className={`w-full py-4 rounded-xl mt-4 ${loading ? 'bg-indigo-400' : 'bg-indigo-600'}`}
                >
                    <Text className="text-white text-center font-bold text-lg">
                        {loading ? 'Signing in...' : 'Sign In'}
                    </Text>
                </TouchableOpacity>

                <View className="flex-row justify-center mt-4">
                    <Text className="text-slate-600">Don't have an account? </Text>
                    <Link href="/(auth)/sign-up" asChild>
                        <TouchableOpacity>
                            <Text className="text-indigo-600 font-bold">Sign Up</Text>
                        </TouchableOpacity>
                    </Link>
                </View>
            </View>
        </View>
    );
}
