import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../components/AuthProvider';
import { Plus, LogOut, Zap, Clock, Calendar } from 'lucide-react-native';

const TIME_SLOT_LABELS: Record<string, string> = {
    '08:00-11:00': '8:00 AM – 11:00 AM',
    '12:00-15:00': '12:00 PM – 3:00 PM',
    '16:00-19:00': '4:00 PM – 7:00 PM',
    '20:00-23:00': '8:00 PM – 11:00 PM',
};

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
    pending:    { bg: 'bg-amber-100',  text: 'text-amber-700',  label: 'Pending' },
    confirmed:  { bg: 'bg-blue-100',   text: 'text-blue-700',   label: 'Confirmed' },
    processing: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Processing' },
    delivered:  { bg: 'bg-green-100',  text: 'text-green-700',  label: 'Delivered' },
};

export default function LaundryDashboard() {
    const { signOut } = useAuth();
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
                .select('*, profiles(full_name)')
                .order('is_urgent', { ascending: false })
                .order('created_at', { ascending: false }),
        ]);
        if (sched) setSchedule(sched);
        else setSchedule(null);
        if (ords) setOrders(ords);
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

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

    // Group orders by delivery address
    const grouped: Record<string, any[]> = {};
    orders.forEach((order) => {
        const addr = order.items?.address || 'Unknown Address';
        if (!grouped[addr]) grouped[addr] = [];
        grouped[addr].push(order);
    });

    return (
        <ScrollView
            className="flex-1 bg-slate-50"
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            {/* Top Bar */}
            <View className="flex-row items-center justify-between px-6 pt-14 pb-4">
                <Text className="text-2xl font-bold text-slate-900">Dashboard</Text>
                <View className="flex-row gap-3">
                    <TouchableOpacity
                        onPress={() => router.push('/(laundry)/create-schedule')}
                        className="w-10 h-10 rounded-full bg-indigo-600 items-center justify-center"
                    >
                        <Plus size={20} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={handleSignOut}
                        className="w-10 h-10 rounded-full bg-slate-200 items-center justify-center"
                    >
                        <LogOut size={18} color="#64748b" />
                    </TouchableOpacity>
                </View>
            </View>

            <View className="px-6">
                {/* Schedule Card */}
                {schedule ? (
                    <TouchableOpacity
                        onPress={() => router.push('/(laundry)/create-schedule')}
                        className="bg-indigo-600 rounded-2xl p-5 mb-5"
                    >
                        <View className="flex-row items-center mb-3">
                            <Calendar size={16} color="#a5b4fc" />
                            <Text className="text-indigo-200 text-xs font-bold uppercase ml-2">Next Schedule</Text>
                        </View>
                        <View className="flex-row">
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
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        onPress={() => router.push('/(laundry)/create-schedule')}
                        className="border-2 border-dashed border-slate-300 rounded-2xl p-5 mb-5 items-center"
                    >
                        <Clock size={24} color="#94a3b8" />
                        <Text className="text-slate-500 font-medium mt-2">No schedule set</Text>
                        <Text className="text-slate-400 text-sm">Tap to create one</Text>
                    </TouchableOpacity>
                )}

                {/* Orders */}
                <Text className="text-lg font-bold text-slate-900 mb-3">
                    Orders ({orders.length})
                </Text>

                {orders.length === 0 ? (
                    <View className="bg-white rounded-2xl p-6 items-center">
                        <Text className="text-slate-400">No orders yet.</Text>
                    </View>
                ) : (
                    Object.entries(grouped).map(([address, groupOrders]) => (
                        <View key={address} className="mb-5">
                            <Text className="text-xs font-bold text-indigo-600 uppercase mb-2 px-1">
                                {address}
                            </Text>
                            {groupOrders.map((order) => {
                                const s = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                                return (
                                    <TouchableOpacity
                                        key={order.id}
                                        onPress={() => router.push({ pathname: '/(laundry)/order-details', params: { id: order.id } })}
                                        className="bg-white rounded-2xl p-4 mb-2 shadow-sm"
                                    >
                                        <View className="flex-row items-center justify-between mb-2">
                                            <Text className="font-semibold text-slate-800">
                                                {order.profiles?.full_name || 'Customer'}
                                            </Text>
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
                                        <Text className="text-slate-500 text-sm">
                                            {order.items?.quantity || 0} pcs · {(order.services || []).join(', ')}
                                        </Text>
                                        <Text className="text-slate-400 text-xs mt-1">
                                            ₹{order.total_cost} · {order.delivery_preferences}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    ))
                )}
                <View className="h-8" />
            </View>
        </ScrollView>
    );
}
