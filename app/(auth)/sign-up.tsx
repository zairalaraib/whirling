import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';

type Role = 'customer' | 'laundry_guy';

export default function SignUp() {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [address, setAddress] = useState('');
    const [role, setRole] = useState<Role>('customer');
    const [loading, setLoading] = useState(false);

    const handleSignUp = async () => {
        if (!fullName || !email || !password || (role === 'customer' && !address)) {
            Alert.alert('Missing info', 'Please fill in all fields.');
            return;
        }
        setLoading(true);

        const { error, data } = await supabase.auth.signUp({ email, password });
        if (error) {
            Alert.alert('Sign Up Failed', error.message);
            setLoading(false);
            return;
        }

        const userId = data.user?.id;
        if (!userId) {
            Alert.alert('Error', 'Could not create user. Please try again.');
            setLoading(false);
            return;
        }

        const { error: profileError } = await supabase.from('profiles').insert({
            id: userId,
            full_name: fullName,
            role,
            address: role === 'customer' ? address : null,
        });

        if (profileError) {
            Alert.alert('Profile Error', profileError.message);
            setLoading(false);
            return;
        }

        if (role === 'laundry_guy') {
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
                <View className="flex-1 px-6 pt-20 pb-10">
                    {/* Header */}
                    <View className="mb-10">
                        <Text className="text-4xl font-bold text-slate-900">Create account</Text>
                        <Text className="text-slate-500 mt-2 text-base">Join Whirling today</Text>
                    </View>

                    {/* Role Selector */}
                    <View className="mb-6">
                        <Text className="text-sm font-medium text-slate-700 mb-2">I am a...</Text>
                        <View className="flex-row gap-3">
                            <TouchableOpacity
                                onPress={() => setRole('customer')}
                                className={`flex-1 py-3 rounded-xl border-2 items-center ${role === 'customer' ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-200'}`}
                            >
                                <Text className={`font-bold ${role === 'customer' ? 'text-white' : 'text-slate-600'}`}>Customer</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setRole('laundry_guy')}
                                className={`flex-1 py-3 rounded-xl border-2 items-center ${role === 'laundry_guy' ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-200'}`}
                            >
                                <Text className={`font-bold ${role === 'laundry_guy' ? 'text-white' : 'text-slate-600'}`}>Laundry Guy</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Fields */}
                    <View className="mb-4">
                        <Text className="text-sm font-medium text-slate-700 mb-1">Full Name</Text>
                        <TextInput
                            value={fullName}
                            onChangeText={setFullName}
                            placeholder="Zair Laraib"
                            className="border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 text-slate-900"
                        />
                    </View>

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

                    <View className="mb-4">
                        <Text className="text-sm font-medium text-slate-700 mb-1">Password</Text>
                        <TextInput
                            value={password}
                            onChangeText={setPassword}
                            placeholder="••••••••"
                            secureTextEntry
                            className="border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 text-slate-900"
                        />
                    </View>

                    {role === 'customer' && (
                        <View className="mb-8">
                            <Text className="text-sm font-medium text-slate-700 mb-1">Your Address</Text>
                            <TextInput
                                value={address}
                                onChangeText={setAddress}
                                placeholder="Flat 101, Building A, Street..."
                                multiline
                                className="border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 text-slate-900"
                            />
                            <Text className="text-xs text-slate-400 mt-1">Saved so you don't have to enter it every order</Text>
                        </View>
                    )}

                    {role === 'laundry_guy' && <View className="mb-8" />}

                    <TouchableOpacity
                        onPress={handleSignUp}
                        disabled={loading}
                        className="bg-indigo-600 py-4 rounded-2xl mb-4"
                    >
                        <Text className="text-white text-center font-bold text-lg">
                            {loading ? 'Creating account...' : 'Create Account'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => router.push('/(auth)/sign-in')}>
                        <Text className="text-center text-slate-500">
                            Already have an account?{' '}
                            <Text className="text-indigo-600 font-semibold">Sign In</Text>
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
