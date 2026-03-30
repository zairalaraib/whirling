import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { ChevronLeft, Zap } from 'lucide-react-native';

type Status = 'pending' | 'confirmed' | 'processing' | 'delivered';

const STATUS_FLOW: Status[] = ['pending', 'confirmed', 'processing', 'delivered'];

const STATUS_CONFIG: Record<Status, { label: string; next: Status | null; nextLabel: string | null }> = {
    pending:    { label: 'Pending',    next: 'confirmed',  nextLabel: 'Confirm Order' },
    confirmed:  { label: 'Confirmed',  next: 'processing', nextLabel: 'Mark Processing' },
    processing: { label: 'Processing', next: 'delivered',  nextLabel: 'Mark Delivered' },
    delivered:  { label: 'Delivered',  next: null,         nextLabel: null },
};

export default function LaundryOrderDetails() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [order, setOrder] = useState<any>(null);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        if (id) {
            supabase
                .from('orders')
                .select('*, profiles(full_name, address)')
                .eq('id', id)
                .single()
                .then(({ data }) => { if (data) setOrder(data); });
        }
    }, [id]);

    const updateStatus = async (newStatus: Status) => {
        Alert.alert(
            'Update Status',
            `Mark this order as "${STATUS_CONFIG[newStatus].label}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm', onPress: async () => {
                        setUpdating(true);
                        const { error } = await supabase
                            .from('orders')
                            .update({ status: newStatus })
                            .eq('id', id);
                        if (error) {
                            Alert.alert('Error', error.message);
                        } else {
                            setOrder((prev: any) => ({ ...prev, status: newStatus }));
                        }
                        setUpdating(false);
                    },
                },
            ]
        );
    };

    if (!order) return <View className="flex-1 bg-slate-50" />;

    const currentStatus: Status = order.status;
    const config = STATUS_CONFIG[currentStatus];

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
                {/* Status Banner */}
                <View className="bg-indigo-600 rounded-2xl p-5 mb-4 flex-row items-center justify-between">
                    <View>
                        <Text className="text-indigo-200 text-xs uppercase font-bold mb-1">Current Status</Text>
                        <Text className="text-white text-2xl font-bold">{config.label}</Text>
                    </View>
                    {order.is_urgent && (
                        <View className="flex-row items-center bg-red-500 px-3 py-1.5 rounded-full">
                            <Zap size={14} color="white" />
                            <Text className="text-white text-xs font-bold ml-1">URGENT</Text>
                        </View>
                    )}
                </View>

                {/* Customer Details */}
                <View className="bg-white rounded-2xl p-5 shadow-sm mb-4">
                    <Text className="text-xs font-bold text-slate-400 uppercase mb-3">Customer</Text>
                    <Text className="font-bold text-slate-900 text-base mb-1">
                        {order.profiles?.full_name || 'Customer'}
                    </Text>
                    <Text className="text-slate-500 text-sm">{order.items?.address || order.profiles?.address || '—'}</Text>
                    <View className={`self-start mt-2 px-3 py-1 rounded-full ${order.delivery_preferences === 'doorstep' ? 'bg-indigo-100' : 'bg-slate-100'}`}>
                        <Text className={`text-xs font-bold capitalize ${order.delivery_preferences === 'doorstep' ? 'text-indigo-700' : 'text-slate-600'}`}>
                            {order.delivery_preferences || 'doorstep'}
                        </Text>
                    </View>
                </View>

                {/* Order Items */}
                <View className="bg-white rounded-2xl p-5 shadow-sm mb-4">
                    <Text className="text-xs font-bold text-slate-400 uppercase mb-3">Order Items</Text>
                    <View className="flex-row justify-between mb-2">
                        <Text className="text-slate-500">Quantity</Text>
                        <Text className="font-semibold text-slate-800">{order.items?.quantity || 0} pcs</Text>
                    </View>
                    <View className="flex-row justify-between mb-2">
                        <Text className="text-slate-500">Services</Text>
                        <Text className="font-semibold text-slate-800 flex-1 text-right">
                            {(order.services || []).join(', ')}
                        </Text>
                    </View>
                    {order.is_urgent && (
                        <View className="flex-row justify-between mb-2">
                            <Text className="text-slate-500">Urgent Fee</Text>
                            <Text className="font-semibold text-red-600">+₹100</Text>
                        </View>
                    )}
                    <View className="h-px bg-slate-100 my-2" />
                    <View className="flex-row justify-between">
                        <Text className="font-bold text-slate-900">Total</Text>
                        <Text className="font-bold text-indigo-600 text-lg">₹{order.total_cost}</Text>
                    </View>
                    <View className={`self-start mt-2 px-3 py-1 rounded-full ${order.payment_status === 'paid' ? 'bg-green-100' : 'bg-amber-100'}`}>
                        <Text className={`text-xs font-bold ${order.payment_status === 'paid' ? 'text-green-700' : 'text-amber-700'}`}>
                            {order.payment_status === 'paid' ? 'Paid' : 'Unpaid'}
                        </Text>
                    </View>
                </View>

                {/* Status Buttons */}
                <View className="bg-white rounded-2xl p-5 shadow-sm mb-4">
                    <Text className="text-xs font-bold text-slate-400 uppercase mb-4">Update Status</Text>
                    {STATUS_FLOW.map((status) => {
                        const isCurrent = status === currentStatus;
                        const isPast = STATUS_FLOW.indexOf(status) < STATUS_FLOW.indexOf(currentStatus);
                        return (
                            <TouchableOpacity
                                key={status}
                                onPress={() => !isCurrent && !isPast && !updating && updateStatus(status)}
                                disabled={isCurrent || isPast || updating}
                                className={`py-3 px-4 rounded-xl mb-2 flex-row items-center justify-between
                                    ${isCurrent ? 'bg-indigo-600' : isPast ? 'bg-slate-50' : 'bg-slate-100'}`}
                            >
                                <Text className={`font-semibold ${isCurrent ? 'text-white' : isPast ? 'text-slate-300' : 'text-slate-700'}`}>
                                    {STATUS_CONFIG[status].label}
                                </Text>
                                {isCurrent && (
                                    <View className="bg-white/20 px-2 py-0.5 rounded-full">
                                        <Text className="text-white text-xs font-bold">CURRENT</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Next Action Button */}
                {config.next && (
                    <TouchableOpacity
                        onPress={() => updateStatus(config.next!)}
                        disabled={updating}
                        className="bg-slate-900 py-4 rounded-2xl"
                    >
                        <Text className="text-white text-center font-bold text-lg">
                            {updating ? 'Updating...' : config.nextLabel}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        </ScrollView>
    );
}
