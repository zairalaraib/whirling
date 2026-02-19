import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';

export default function SignUp() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [role, setRole] = useState<'customer' | 'laundry_guy'>('customer');
    const [loading, setLoading] = useState(false);

    async function signUpWithEmail() {
        setLoading(true);
        const { data: { user }, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
        });

        if (signUpError) {
            Alert.alert('Error', signUpError.message);
            setLoading(false);
            return;
        }

        if (user) {
            // Create profile
            const { error: profileError } = await supabase
                .from('profiles')
                .insert({
                    id: user.id,
                    role,
                    full_name: fullName,
                });

            if (profileError) {
                Alert.alert('Error creating profile', profileError.message);
            } else {
                // Success
                Alert.alert('Success', 'Account created successfully!', [
                    { text: 'OK', onPress: () => router.replace('/') }
                ]);
            }
        }
        setLoading(false);
    }

    return (
        <ScrollView
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
            className="bg-slate-50"
        >
            <View className="mb-6">
                <Text className="text-3xl font-bold text-slate-900 mb-2">Create Account</Text>
                <Text className="text-slate-600">Join as a Customer or Laundry Guy</Text>
            </View>

            <View className="space-y-4">
                <View>
                    <Text className="text-sm font-medium text-slate-700 mb-1">Full Name</Text>
                    <TextInput
                        onChangeText={setFullName}
                        value={fullName}
                        placeholder="John Doe"
                        className="w-full bg-white border border-slate-300 rounded-lg p-3 text-slate-900"
                    />
                </View>

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

                <View className="my-2">
                    <Text className="text-sm font-medium text-slate-700 mb-2">I am a:</Text>
                    <View className="flex-row space-x-4">
                        <TouchableOpacity
                            onPress={() => setRole('customer')}
                            className={`flex-1 p-4 rounded-xl border-2 ${role === 'customer' ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200 bg-white'}`}
                        >
                            <Text className={`text-center font-bold ${role === 'customer' ? 'text-indigo-600' : 'text-slate-600'}`}>Customer</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => setRole('laundry_guy')}
                            className={`flex-1 p-4 rounded-xl border-2 ${role === 'laundry_guy' ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200 bg-white'}`}
                        >
                            <Text className={`text-center font-bold ${role === 'laundry_guy' ? 'text-indigo-600' : 'text-slate-600'}`}>Laundry Guy</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <TouchableOpacity
                    onPress={signUpWithEmail}
                    disabled={loading}
                    className={`w-full py-4 rounded-xl mt-4 ${loading ? 'bg-indigo-400' : 'bg-indigo-600'}`}
                >
                    <Text className="text-white text-center font-bold text-lg">
                        {loading ? 'Creating Account...' : 'Sign Up'}
                    </Text>
                </TouchableOpacity>

                <View className="flex-row justify-center mt-4 mb-8">
                    <Text className="text-slate-600">Already have an account? </Text>
                    <Link href="/(auth)/sign-in" asChild>
                        <TouchableOpacity>
                            <Text className="text-indigo-600 font-bold">Sign In</Text>
                        </TouchableOpacity>
                    </Link>
                </View>
            </View>
        </ScrollView>
    );
}
