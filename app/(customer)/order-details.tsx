import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { CheckCircle, Clock, ChevronLeft, Zap } from 'lucide-react-native';

const STEPS = [
    { key: 'pending',    label: 'Order Placed' },
    { key: 'confirmed',  label: 'Confirmed by Laundry' },
    { key: 'processing', label: 'In Service' },
    { key: 'delivered',  label: 'Delivered' },
];

export default function CustomerOrderDetails() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [order, setOrder] = useState<any>(null);
    const [paying, setPaying] = useState(false);

    useEffect(() => {
        if (id) {
            supabase.from('orders').select('*').eq('id', id).single()
                .then(({ data }) => { if (data) setOrder(data); });
        }
    }, [id]);

    const handlePay = () => {
        Alert.alert('Pay Bill', `Confirm payment of ₹${order.total_cost}?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Confirm', onPress: async () => {
                    setPaying(true);
                    const { error } = await supabase
                        .from('orders')
                        .update({ payment_status: 'paid' })
                        .eq('id', id);
                    if (error) {
                        Alert.alert('Error', error.message);
                    } else {
                        setOrder((prev: any) => ({ ...prev, payment_status: 'paid' }));
                        Alert.alert('Paid!', 'Thank you for your payment.');
                    }
                    setPaying(false);
                },
            },
        ]);
    };

    if (!order) return <View className="flex-1 bg-slate-50" />;

    const currentStepIndex = STEPS.findIndex((s) => s.key === order.status);
    const isDelivered = order.status === 'delivered';
    const isPaid = order.payment_status === 'paid';

    return (
        <ScrollView className="flex-1 bg-slate-50">
            {/* Header */}
            <View className="flex-row items-center px-6 pt-14 pb-4">
                <TouchableOpacity onPress={() => router.back()} className="mr-4">
                    <ChevronLeft size={24} color="#0f172a" />
                </TouchableOpacity>
                <Text className="text-xl font-bold text-slate-900">Order Details</Text>
            </View>

            <View className="px-6 pb-10">
                {/* Header Card */}
                <View className="bg-white p-6 rounded-2xl shadow-sm mb-4">
                    <Text className="text-slate-400 text-xs mb-1">Order #{order.id.slice(0, 8)}</Text>
                    <Text className="text-4xl font-bold text-slate-900">₹{order.total_cost}</Text>
                    <View className="flex-row flex-wrap gap-2 mt-3">
                        {order.is_urgent && (
                            <View className="flex-row items-center bg-red-100 px-3 py-1 rounded-full">
                                <Zap size={12} color="#ef4444" />
                                <Text className="text-red-700 text-xs font-bold ml-1">URGENT</Text>
                            </View>
                        )}
                        <View className={`px-3 py-1 rounded-full ${isPaid ? 'bg-green-100' : 'bg-amber-100'}`}>
                            <Text className={`text-xs font-bold ${isPaid ? 'text-green-700' : 'text-amber-700'}`}>
                                {isPaid ? 'Paid' : 'Unpaid'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Status Timeline */}
                <View className="bg-white p-6 rounded-2xl shadow-sm mb-4">
                    <Text className="text-base font-bold text-slate-900 mb-5">Status Tracking</Text>
                    {STEPS.map((step, index) => {
                        const done = index <= currentStepIndex;
                        const current = index === currentStepIndex;
                        return (
                            <View key={step.key} className="flex-row items-center mb-5 last:mb-0">
                                <View className={`w-9 h-9 rounded-full items-center justify-center mr-4 ${done ? 'bg-indigo-600' : 'bg-slate-100'}`}>
                                    {done
                                        ? <CheckCircle size={18} color="white" />
                                        : <Clock size={16} color="#94a3b8" />
                                    }
                                </View>
                                <View>
                                    <Text className={`font-semibold ${done ? 'text-slate-900' : 'text-slate-400'}`}>
                                        {step.label}
                                    </Text>
                                    {current && (
                                        <Text className="text-indigo-600 text-xs font-medium">Current Status</Text>
                                    )}
                                </View>
                            </View>
                        );
                    })}
                </View>

                {/* Bill Details */}
                <View className="bg-white p-6 rounded-2xl shadow-sm mb-5">
                    <Text className="text-base font-bold text-slate-900 mb-4">Bill Details</Text>
                    <View className="flex-row justify-between mb-2">
                        <Text className="text-slate-500">Clothes</Text>
                        <Text className="font-semibold text-slate-800">{order.items?.quantity || 0} pcs</Text>
                    </View>
                    <View className="flex-row justify-between mb-2">
                        <Text className="text-slate-500">Services</Text>
                        <Text className="font-semibold text-slate-800 flex-1 text-right">
                            {(order.services || []).join(', ')}
                        </Text>
                    </View>
                    <View className="flex-row justify-between mb-2">
                        <Text className="text-slate-500">Delivery</Text>
                        <Text className="font-semibold text-slate-800 capitalize">{order.delivery_preferences}</Text>
                    </View>
                    {order.is_urgent && (
                        <View className="flex-row justify-between mb-2">
                            <Text className="text-slate-500">Urgent Fee</Text>
                            <Text className="font-semibold text-red-600">+₹100</Text>
                        </View>
                    )}
                    <View className="h-px bg-slate-100 my-2" />
                    <View className="flex-row justify-between">
                        <Text className="font-bold text-slate-900 text-lg">Total</Text>
                        <Text className="font-bold text-indigo-600 text-lg">₹{order.total_cost}</Text>
                    </View>
                </View>

                {/* Pay Button */}
                {isDelivered && !isPaid && (
                    <TouchableOpacity
                        onPress={handlePay}
                        disabled={paying}
                        className="bg-slate-900 py-4 rounded-2xl mb-3"
                    >
                        <Text className="text-white text-center font-bold text-lg">
                            {paying ? 'Processing...' : `Pay ₹${order.total_cost}`}
                        </Text>
                    </TouchableOpacity>
                )}

                {isPaid && (
                    <View className="bg-green-50 border border-green-200 py-4 rounded-2xl items-center">
                        <CheckCircle size={20} color="#16a34a" />
                        <Text className="text-green-700 font-bold text-base mt-1">Payment Complete</Text>
                    </View>
                )}
            </View>
        </ScrollView>
    );
}
