import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../components/AuthProvider';
import { Plus, User, Zap, Clock, CheckCircle } from 'lucide-react-native';

const TIME_SLOT_LABELS: Record<string, string> = {
    '08:00-11:00': '8:00 AM – 11:00 AM',
    '12:00-15:00': '12:00 PM – 3:00 PM',
    '16:00-19:00': '4:00 PM – 7:00 PM',
    '20:00-23:00': '8:00 PM – 11:00 PM',
};

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
    pending:    { bg: 'bg-amber-100',  text: 'text-amber-700',  label: 'Pending' },
    confirmed:  { bg: 'bg-blue-100',   text: 'text-blue-700',   label: 'Confirmed' },
    processing: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Processing' },
    delivered:  { bg: 'bg-green-100',  text: 'text-green-700',  label: 'Delivered' },
};

export default function CustomerHome() {
    const { profile, loading: authLoading, signOut } = useAuth();
    const [schedule, setSchedule] = useState<any>(null);
    const [orders, setOrders] = useState<any[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = useCallback(async () => {
        const [{ data: sched }, { data: ords }] = await Promise.all([
            supabase
                .from('schedules')
                .select('*')
                .in('status', ['upcoming', 'active'])
                .order('pickup_date', { ascending: true })
                .limit(1)
                .maybeSingle(),
            supabase
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false }),
        ]);
        if (sched) setSchedule(sched);
        if (ords) setOrders(ords);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
    };

    const handleSignOut = () => {
        Alert.alert('Sign Out', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign Out', style: 'destructive', onPress: signOut },
        ]);
    };

    if (authLoading) {
        return <View className="flex-1 bg-slate-50" />;
    }

    return (
        <ScrollView
            className="flex-1 bg-slate-50"
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            {/* Top bar */}
            <View className="flex-row items-center justify-between px-6 pt-16 pb-4">
                <View>
                    <Text className="text-sm font-medium text-slate-400">Whirling</Text>
                    <Text className="text-2xl font-bold text-slate-900">
                        Hi, {profile?.full_name?.split(' ')[0] || 'there'} 👋
                    </Text>
                </View>
                <View className="flex-row gap-3">
                    <TouchableOpacity
                        onPress={() => router.push('/(customer)/profile')}
                        className="w-10 h-10 rounded-full bg-indigo-100 items-center justify-center"
                    >
                        <User size={20} color="#4f46e5" />
                    </TouchableOpacity>
                </View>
            </View>

            <View className="px-6">
                {/* Next Schedule Card */}
                {schedule ? (
                    <View className="bg-indigo-600 rounded-2xl p-5 mb-5">
                        <Text className="text-indigo-200 text-xs font-bold uppercase mb-2">Next Schedule</Text>
                        <View className="flex-row mb-2">
                            <View className="flex-1">
                                <Text className="text-indigo-200 text-xs mb-1">Pickup</Text>
                                <Text className="text-white font-bold">{schedule.pickup_date}</Text>
                                <Text className="text-indigo-200 text-sm">
                                    {TIME_SLOT_LABELS[schedule.pickup_slot] || schedule.pickup_slot}
                                </Text>
                            </View>
                            <View className="w-px bg-indigo-400 mx-4" />
                            <View className="flex-1">
                                <Text className="text-indigo-200 text-xs mb-1">Delivery</Text>
                                <Text className="text-white font-bold">{schedule.delivery_date}</Text>
                                <Text className="text-indigo-200 text-sm">
                                    {TIME_SLOT_LABELS[schedule.delivery_slot] || schedule.delivery_slot}
                                </Text>
                            </View>
                        </View>
                    </View>
                ) : (
                    <View className="border-2 border-dashed border-slate-200 rounded-2xl p-5 mb-5 items-center">
                        <Clock size={24} color="#94a3b8" />
                        <Text className="text-slate-400 mt-2 text-sm">No upcoming schedule yet</Text>
                    </View>
                )}

                {/* New Order Button */}
                <TouchableOpacity
                    onPress={() => router.push('/(customer)/new-order')}
                    className="bg-slate-900 rounded-2xl p-5 mb-6 flex-row items-center justify-between"
                >
                    <View>
                        <Text className="text-white font-bold text-lg">Place New Order</Text>
                        <Text className="text-slate-400 text-sm mt-1">Wash, iron, stain removal</Text>
                    </View>
                    <View className="w-10 h-10 rounded-full bg-indigo-600 items-center justify-center">
                        <Plus size={20} color="white" />
                    </View>
                </TouchableOpacity>

                {/* Orders */}
                <Text className="text-lg font-bold text-slate-900 mb-3">Your Orders</Text>
                {orders.length === 0 ? (
                    <View className="bg-white rounded-2xl p-6 items-center">
                        <Text className="text-slate-400">No orders yet. Place your first one!</Text>
                    </View>
                ) : (
                    orders.map((order) => {
                        const s = STATUS_COLORS[order.status] || STATUS_COLORS.pending;
                        const isPaid = order.payment_status === 'paid';
                        return (
                            <TouchableOpacity
                                key={order.id}
                                onPress={() => router.push({ pathname: '/(customer)/order-details', params: { id: order.id } })}
                                className="bg-white rounded-2xl p-4 mb-3 shadow-sm"
                            >
                                <View className="flex-row items-center justify-between mb-2">
                                    <Text className="text-slate-500 text-xs">#{order.id.slice(0, 8)}</Text>
                                    <View className="flex-row gap-2">
                                        {order.is_urgent && (
                                            <View className="flex-row items-center bg-red-100 px-2 py-0.5 rounded-full">
                                                <Zap size={10} color="#ef4444" />
                                                <Text className="text-red-600 text-xs font-bold ml-1">URGENT</Text>
                                            </View>
                                        )}
                                        <View className={`px-2 py-0.5 rounded-full ${s.bg}`}>
                                            <Text className={`text-xs font-bold ${s.text}`}>{s.label}</Text>
                                        </View>
                                    </View>
                                </View>
                                <View className="flex-row items-center justify-between">
                                    <Text className="text-slate-700 font-medium">
                                        {order.items?.quantity || 0} pcs · {(order.services || []).join(', ')}
                                    </Text>
                                    <Text className="font-bold text-slate-900">₹{order.total_cost}</Text>
                                </View>
                                {order.status === 'delivered' && !isPaid && (
                                    <View className="mt-2 bg-amber-50 rounded-lg px-3 py-1.5">
                                        <Text className="text-amber-700 text-xs font-bold">Payment due — tap to pay</Text>
                                    </View>
                                )}
                                {isPaid && (
                                    <View className="mt-2 flex-row items-center">
                                        <CheckCircle size={12} color="#16a34a" />
                                        <Text className="text-green-700 text-xs ml-1 font-medium">Paid</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })
                )}
                <View className="h-8" />
            </View>
        </ScrollView>
    );
}
