import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../components/AuthProvider';
import { User, LogOut, ChevronLeft } from 'lucide-react-native';

export default function Profile() {
    const { user, profile, signOut } = useAuth();
    const [fullName, setFullName] = useState(profile?.full_name || '');
    const [address, setAddress] = useState((profile as any)?.address || '');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        const { error } = await supabase
            .from('profiles')
            .update({ full_name: fullName, address })
            .eq('id', user?.id);
        if (error) {
            Alert.alert('Error', error.message);
        } else {
            Alert.alert('Saved', 'Profile updated successfully.');
        }
        setSaving(false);
    };

    const handleSignOut = () => {
        Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign Out', style: 'destructive', onPress: signOut },
        ]);
    };

    return (
        <ScrollView className="flex-1 bg-slate-50">
            {/* Header */}
            <View className="flex-row items-center px-6 pt-14 pb-4">
                <TouchableOpacity onPress={() => router.back()} className="mr-4">
                    <ChevronLeft size={24} color="#0f172a" />
                </TouchableOpacity>
                <Text className="text-xl font-bold text-slate-900">Profile</Text>
            </View>

            <View className="px-6 pb-10">
                {/* Avatar */}
                <View className="items-center mb-8 mt-2">
                    <View className="w-20 h-20 rounded-full bg-indigo-100 items-center justify-center mb-3">
                        <User size={40} color="#4f46e5" />
                    </View>
                    <Text className="text-xl font-bold text-slate-900">{profile?.full_name || 'Customer'}</Text>
                    <Text className="text-slate-500 text-sm">{user?.email}</Text>
                </View>

                {/* Fields */}
                <View className="bg-white rounded-2xl p-6 shadow-sm mb-5">
                    <Text className="text-xs font-bold text-slate-400 uppercase mb-4">Account Info</Text>

                    <View className="mb-4">
                        <Text className="text-sm font-medium text-slate-600 mb-1">Full Name</Text>
                        <TextInput
                            value={fullName}
                            onChangeText={setFullName}
                            placeholder="Your name"
                            className="border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 text-slate-900"
                        />
                    </View>

                    <View className="mb-4">
                        <Text className="text-sm font-medium text-slate-600 mb-1">Email</Text>
                        <View className="border border-slate-100 rounded-xl px-4 py-3 bg-slate-100">
                            <Text className="text-slate-400">{user?.email}</Text>
                        </View>
                    </View>

                    <View>
                        <Text className="text-sm font-medium text-slate-600 mb-1">Address</Text>
                        <TextInput
                            value={address}
                            onChangeText={setAddress}
                            placeholder="Flat 101, Building A..."
                            multiline
                            className="border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 text-slate-900"
                        />
                    </View>
                </View>

                <TouchableOpacity
                    onPress={handleSave}
                    disabled={saving}
                    className="bg-indigo-600 py-4 rounded-2xl mb-3"
                >
                    <Text className="text-white text-center font-bold text-lg">
                        {saving ? 'Saving...' : 'Save Changes'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={handleSignOut}
                    className="border border-red-200 py-4 rounded-2xl flex-row items-center justify-center"
                >
                    <LogOut size={18} color="#ef4444" />
                    <Text className="text-red-500 font-bold ml-2">Sign Out</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}
