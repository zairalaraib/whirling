import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../components/AuthProvider';

export default function NewOrder() {
    const { user } = useAuth();
    const router = useRouter();
    const [address, setAddress] = useState('');
    const [clothesCount, setClothesCount] = useState('');
    const [deliveryPref, setDeliveryPref] = useState('doorstep'); // doorstep or lobby

    // Services
    const [serviceWash, setServiceWash] = useState(true);
    const [serviceIron, setServiceIron] = useState(false);
    const [serviceStain, setServiceStain] = useState(false);

    const [loading, setLoading] = useState(false);

    // Simple cost calc
    const count = parseInt(clothesCount) || 0;
    const washCost = serviceWash ? count * 2 : 0; // $2 per cloth
    const ironCost = serviceIron ? count * 1 : 0; // $1 per cloth
    const stainCost = serviceStain ? 5 : 0; // Flat $5
    const totalCost = washCost + ironCost + stainCost;

    async function placeOrder() {
        if (!address || !clothesCount) {
            Alert.alert('Missing info', 'Please fill in address and clothes count');
            return;
        }

        setLoading(true);
        const services = [];
        if (serviceWash) services.push('wash');
        if (serviceIron) services.push('iron');
        if (serviceStain) services.push('stain_removal');

        const { error } = await supabase.from('orders').insert({
            customer_id: user?.id,
            items: { quantity: count, address: address },
            services: services,
            total_cost: totalCost,
            delivery_preferences: deliveryPref,
            status: 'pending' // Initial status
        });

        if (error) {
            Alert.alert('Error', error.message);
        } else {
            Alert.alert('Success', 'Order placed!', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        }
        setLoading(false);
    }

    return (
        <ScrollView className="flex-1 bg-white p-6">
            <Text className="text-xl font-bold mb-6">Order Details</Text>

            <View className="mb-4">
                <Text className="font-medium text-slate-700 mb-1">Address</Text>
                <TextInput
                    value={address}
                    onChangeText={setAddress}
                    placeholder="Flat 101, Building A..."
                    className="border border-slate-300 rounded-xl p-3 bg-slate-50"
                    multiline
                />
            </View>

            <View className="mb-4">
                <Text className="font-medium text-slate-700 mb-1">Number of Clothes</Text>
                <TextInput
                    value={clothesCount}
                    onChangeText={setClothesCount}
                    placeholder="e.g. 5"
                    keyboardType="numeric"
                    className="border border-slate-300 rounded-xl p-3 bg-slate-50"
                />
            </View>

            <View className="mb-6">
                <Text className="font-medium text-slate-700 mb-2">Services Required</Text>

                <View className="flex-row items-center justify-between mb-2 p-3 border border-slate-100 rounded-lg">
                    <Text>Wash ($2/pc)</Text>
                    <Switch value={serviceWash} onValueChange={setServiceWash} />
                </View>

                <View className="flex-row items-center justify-between mb-2 p-3 border border-slate-100 rounded-lg">
                    <Text>Iron ($1/pc)</Text>
                    <Switch value={serviceIron} onValueChange={setServiceIron} />
                </View>

                <View className="flex-row items-center justify-between p-3 border border-slate-100 rounded-lg">
                    <Text>Remove Stain (+$5)</Text>
                    <Switch value={serviceStain} onValueChange={setServiceStain} />
                </View>
            </View>

            <View className="mb-6">
                <Text className="font-medium text-slate-700 mb-2">Delivery Preference</Text>
                <View className="flex-row space-x-4">
                    <TouchableOpacity
                        onPress={() => setDeliveryPref('doorstep')}
                        className={`flex-1 p-3 rounded-lg border ${deliveryPref === 'doorstep' ? 'bg-indigo-50 border-indigo-500' : 'border-slate-200'}`}
                    >
                        <Text className="text-center">Doorstep</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setDeliveryPref('lobby')}
                        className={`flex-1 p-3 rounded-lg border ${deliveryPref === 'lobby' ? 'bg-indigo-50 border-indigo-500' : 'border-slate-200'}`}
                    >
                        <Text className="text-center">Lobby</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View className="bg-slate-900 p-4 rounded-xl mb-6">
                <View className="flex-row justify-between mb-2">
                    <Text className="text-slate-400">Estimated Cost</Text>
                    <Text className="text-white font-bold text-xl">${totalCost}</Text>
                </View>
                <Text className="text-slate-500 text-xs">Payment upon delivery/pickup</Text>
            </View>

            <TouchableOpacity
                onPress={placeOrder}
                disabled={loading}
                className="bg-indigo-600 py-4 rounded-xl shadow-lg"
            >
                <Text className="text-white text-center font-bold text-lg">
                    {loading ? 'Confirming...' : 'Place Order'}
                </Text>
            </TouchableOpacity>
        </ScrollView>
    );
}
