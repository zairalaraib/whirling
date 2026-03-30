import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Switch } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../components/AuthProvider';
import { Zap, ChevronLeft } from 'lucide-react-native';

const TIME_SLOT_LABELS: Record<string, string> = {
    '08:00-11:00': '8:00 AM – 11:00 AM',
    '12:00-15:00': '12:00 PM – 3:00 PM',
    '16:00-19:00': '4:00 PM – 7:00 PM',
    '20:00-23:00': '8:00 PM – 11:00 PM',
};

const URGENT_FEE = 100;

export default function NewOrder() {
    const { user, profile } = useAuth();
    const [address, setAddress] = useState('');
    const [clothesCount, setClothesCount] = useState('');
    const [deliveryPref, setDeliveryPref] = useState<'doorstep' | 'lobby'>('doorstep');
    const [serviceWash, setServiceWash] = useState(true);
    const [serviceIron, setServiceIron] = useState(false);
    const [serviceStain, setServiceStain] = useState(false);
    const [isUrgent, setIsUrgent] = useState(false);
    const [schedule, setSchedule] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (profile?.address) setAddress(profile.address);
        supabase
            .from('schedules')
            .select('*')
            .in('status', ['upcoming', 'active'])
            .order('pickup_date', { ascending: true })
            .limit(1)
            .maybeSingle()
            .then(({ data }) => { if (data) setSchedule(data); });
    }, [profile]);

    const count = parseInt(clothesCount) || 0;
    const washCost = serviceWash ? count * 25 : 0;
    const ironCost = serviceIron ? count * 15 : 0;
    const stainCost = serviceStain ? 50 : 0;
    const urgentFee = isUrgent ? URGENT_FEE : 0;
    const totalCost = washCost + ironCost + stainCost + urgentFee;

    const placeOrder = async () => {
        if (!address.trim() || !clothesCount.trim()) {
            Alert.alert('Missing info', 'Please fill in address and number of clothes.');
            return;
        }
        setLoading(true);
        const services: string[] = [];
        if (serviceWash) services.push('wash');
        if (serviceIron) services.push('iron');
        if (serviceStain) services.push('stain_removal');

        const { error } = await supabase.from('orders').insert({
            customer_id: user?.id,
            items: { quantity: count, address },
            services,
            total_cost: totalCost,
            delivery_preferences: deliveryPref,
            status: 'pending',
            payment_status: 'unpaid',
            is_urgent: isUrgent,
            schedule_id: schedule?.id || null,
        });

        if (error) {
            Alert.alert('Error', error.message);
        } else {
            Alert.alert('Order Placed!', 'Your order has been submitted.', [
                { text: 'OK', onPress: () => router.back() },
            ]);
        }
        setLoading(false);
    };

    return (
        <ScrollView className="flex-1 bg-white">
            {/* Header */}
            <View className="flex-row items-center px-6 pt-14 pb-4">
                <TouchableOpacity onPress={() => router.back()} className="mr-4">
                    <ChevronLeft size={24} color="#0f172a" />
                </TouchableOpacity>
                <Text className="text-xl font-bold text-slate-900">New Order</Text>
            </View>

            <View className="px-6 pb-10">
                {/* Linked Schedule Banner */}
                {schedule && (
                    <View className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-5">
                        <Text className="text-xs font-bold text-indigo-700 mb-1">Linked to Schedule</Text>
                        <Text className="text-indigo-600 text-sm">
                            Pickup: {schedule.pickup_date} · {TIME_SLOT_LABELS[schedule.pickup_slot] || schedule.pickup_slot}
                        </Text>
                        <Text className="text-indigo-600 text-sm">
                            Delivery: {schedule.delivery_date} · {TIME_SLOT_LABELS[schedule.delivery_slot] || schedule.delivery_slot}
                        </Text>
                    </View>
                )}

                {/* Address */}
                <View className="mb-4">
                    <Text className="text-sm font-medium text-slate-700 mb-1">Pickup Address</Text>
                    <TextInput
                        value={address}
                        onChangeText={setAddress}
                        placeholder="Flat 101, Building A, Street..."
                        multiline
                        className="border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 text-slate-900"
                    />
                </View>

                {/* Clothes Count */}
                <View className="mb-5">
                    <Text className="text-sm font-medium text-slate-700 mb-1">Number of Clothes</Text>
                    <TextInput
                        value={clothesCount}
                        onChangeText={setClothesCount}
                        placeholder="e.g. 5"
                        keyboardType="numeric"
                        className="border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 text-slate-900"
                    />
                </View>

                {/* Services */}
                <View className="mb-5">
                    <Text className="text-sm font-medium text-slate-700 mb-2">Services</Text>
                    <View className="flex-row items-center justify-between p-4 border border-slate-100 rounded-xl mb-2 bg-slate-50">
                        <View>
                            <Text className="font-medium text-slate-800">Wash</Text>
                            <Text className="text-slate-400 text-xs">₹25 per piece</Text>
                        </View>
                        <Switch value={serviceWash} onValueChange={setServiceWash} trackColor={{ true: '#4f46e5' }} />
                    </View>
                    <View className="flex-row items-center justify-between p-4 border border-slate-100 rounded-xl mb-2 bg-slate-50">
                        <View>
                            <Text className="font-medium text-slate-800">Iron</Text>
                            <Text className="text-slate-400 text-xs">₹15 per piece</Text>
                        </View>
                        <Switch value={serviceIron} onValueChange={setServiceIron} trackColor={{ true: '#4f46e5' }} />
                    </View>
                    <View className="flex-row items-center justify-between p-4 border border-slate-100 rounded-xl bg-slate-50">
                        <View>
                            <Text className="font-medium text-slate-800">Stain Removal</Text>
                            <Text className="text-slate-400 text-xs">Flat ₹50</Text>
                        </View>
                        <Switch value={serviceStain} onValueChange={setServiceStain} trackColor={{ true: '#4f46e5' }} />
                    </View>
                </View>

                {/* Urgent Toggle */}
                <View className={`mb-5 p-4 rounded-xl border-2 ${isUrgent ? 'bg-red-50 border-red-400' : 'bg-slate-50 border-slate-200'}`}>
                    <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center flex-1">
                            <Zap size={18} color={isUrgent ? '#ef4444' : '#94a3b8'} />
                            <View className="ml-3">
                                <Text className={`font-bold ${isUrgent ? 'text-red-600' : 'text-slate-700'}`}>
                                    Urgent Same-Day
                                </Text>
                                <Text className="text-slate-500 text-xs">Pickup & delivery today · +₹{URGENT_FEE}</Text>
                            </View>
                        </View>
                        <Switch
                            value={isUrgent}
                            onValueChange={setIsUrgent}
                            trackColor={{ true: '#ef4444' }}
                        />
                    </View>
                </View>

                {/* Delivery Preference */}
                <View className="mb-6">
                    <Text className="text-sm font-medium text-slate-700 mb-2">Delivery Preference</Text>
                    <View className="flex-row gap-3">
                        {(['doorstep', 'lobby'] as const).map((pref) => (
                            <TouchableOpacity
                                key={pref}
                                onPress={() => setDeliveryPref(pref)}
                                className={`flex-1 py-3 rounded-xl border-2 items-center ${deliveryPref === pref ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-200'}`}
                            >
                                <Text className={`font-semibold capitalize ${deliveryPref === pref ? 'text-white' : 'text-slate-600'}`}>
                                    {pref}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Cost Summary */}
                <View className="bg-slate-900 p-5 rounded-2xl mb-6">
                    <Text className="text-slate-400 text-xs font-bold uppercase mb-3">Cost Summary</Text>
                    {serviceWash && count > 0 && (
                        <View className="flex-row justify-between mb-1">
                            <Text className="text-slate-400">Wash ({count} pcs)</Text>
                            <Text className="text-slate-300">₹{washCost}</Text>
                        </View>
                    )}
                    {serviceIron && count > 0 && (
                        <View className="flex-row justify-between mb-1">
                            <Text className="text-slate-400">Iron ({count} pcs)</Text>
                            <Text className="text-slate-300">₹{ironCost}</Text>
                        </View>
                    )}
                    {serviceStain && (
                        <View className="flex-row justify-between mb-1">
                            <Text className="text-slate-400">Stain Removal</Text>
                            <Text className="text-slate-300">₹{stainCost}</Text>
                        </View>
                    )}
                    {isUrgent && (
                        <View className="flex-row justify-between mb-1">
                            <Text className="text-red-400">Urgent Fee</Text>
                            <Text className="text-red-300">+₹{URGENT_FEE}</Text>
                        </View>
                    )}
                    <View className="h-px bg-slate-700 my-3" />
                    <View className="flex-row justify-between">
                        <Text className="text-slate-400 font-medium">Total</Text>
                        <Text className="text-white font-bold text-xl">₹{totalCost}</Text>
                    </View>
                    <Text className="text-slate-500 text-xs mt-1">Payment upon delivery</Text>
                </View>

                <TouchableOpacity
                    onPress={placeOrder}
                    disabled={loading}
                    className="bg-indigo-600 py-4 rounded-2xl"
                >
                    <Text className="text-white text-center font-bold text-lg">
                        {loading ? 'Placing Order...' : 'Place Order'}
                    </Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}
