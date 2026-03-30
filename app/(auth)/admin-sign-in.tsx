import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { ShieldCheck, ChevronLeft } from 'lucide-react-native';

const ADMIN_SECRET = 'whirling-admin-2024';

export default function AdminSignIn() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [secret, setSecret] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAdminSignIn = async () => {
        if (!email || !password || !secret) {
            Alert.alert('Missing info', 'Please fill in all fields.');
            return;
        }
        if (secret !== ADMIN_SECRET) {
            Alert.alert('Access Denied', 'Invalid admin code.');
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

        if (profile?.role !== 'admin') {
            await supabase.auth.signOut();
            Alert.alert('Access Denied', 'This account does not have admin privileges.');
            setLoading(false);
            return;
        }
        router.replace('/(admin)/dashboard');
        setLoading(false);
    };

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="bg-slate-900">
                <View className="flex-1 px-6 pt-20 pb-10">
                    <TouchableOpacity onPress={() => router.back()} className="mb-8">
                        <ChevronLeft size={24} color="#94a3b8" />
                    </TouchableOpacity>

                    {/* Header */}
                    <View className="items-center mb-10">
                        <View className="w-16 h-16 rounded-2xl bg-indigo-600 items-center justify-center mb-4">
                            <ShieldCheck size={32} color="white" />
                        </View>
                        <Text className="text-3xl font-bold text-white">Admin Access</Text>
                        <Text className="text-slate-400 mt-2 text-sm text-center">
                            Restricted area. Authorised personnel only.
                        </Text>
                    </View>

                    <View className="mb-4">
                        <Text className="text-sm font-medium text-slate-400 mb-1">Email</Text>
                        <TextInput
                            value={email}
                            onChangeText={setEmail}
                            placeholder="admin@whirling.com"
                            placeholderTextColor="#475569"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            className="border border-slate-700 rounded-xl px-4 py-3 bg-slate-800 text-white"
                        />
                    </View>

                    <View className="mb-4">
                        <Text className="text-sm font-medium text-slate-400 mb-1">Password</Text>
                        <TextInput
                            value={password}
                            onChangeText={setPassword}
                            placeholder="••••••••"
                            placeholderTextColor="#475569"
                            secureTextEntry
                            className="border border-slate-700 rounded-xl px-4 py-3 bg-slate-800 text-white"
                        />
                    </View>

                    <View className="mb-8">
                        <Text className="text-sm font-medium text-slate-400 mb-1">Admin Code</Text>
                        <TextInput
                            value={secret}
                            onChangeText={setSecret}
                            placeholder="Enter secret code"
                            placeholderTextColor="#475569"
                            secureTextEntry
                            className="border border-slate-700 rounded-xl px-4 py-3 bg-slate-800 text-white"
                        />
                    </View>

                    <TouchableOpacity
                        onPress={handleAdminSignIn}
                        disabled={loading}
                        className="bg-indigo-600 py-4 rounded-2xl"
                    >
                        <Text className="text-white text-center font-bold text-lg">
                            {loading ? 'Verifying...' : 'Access Admin Panel'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
