import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../components/AuthProvider';
import { LogOut, TrendingUp, ShoppingBag, Clock, Users, Zap, Calendar } from 'lucide-react-native';

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
    pending:    { bg: 'bg-amber-100',  text: 'text-amber-700',  label: 'Pending' },
    confirmed:  { bg: 'bg-blue-100',   text: 'text-blue-700',   label: 'Confirmed' },
    processing: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Processing' },
    delivered:  { bg: 'bg-green-100',  text: 'text-green-700',  label: 'Delivered' },
};

const TIME_SLOT_LABELS: Record<string, string> = {
    '08:00-11:00': '8 AM – 11 AM',
    '12:00-15:00': '12 PM – 3 PM',
    '16:00-19:00': '4 PM – 7 PM',
    '20:00-23:00': '8 PM – 11 PM',
};

type Tab = 'orders' | 'customers' | 'schedules';

export default function AdminDashboard() {
    const { signOut } = useAuth();
    const [orders, setOrders] = useState<any[]>([]);
    const [customers, setCustomers] = useState<any[]>([]);
    const [schedules, setSchedules] = useState<any[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [tab, setTab] = useState<Tab>('orders');

    const fetchAll = useCallback(async () => {
        const [{ data: ords }, { data: custs }, { data: scheds }] = await Promise.all([
            supabase
                .from('orders')
                .select('*, profiles(full_name, address)')
                .order('created_at', { ascending: false }),
            supabase
                .from('profiles')
                .select('*')
                .eq('role', 'customer')
                .order('updated_at', { ascending: false }),
            supabase
                .from('schedules')
                .select('*')
                .order('pickup_date', { ascending: false }),
        ]);
        if (ords) setOrders(ords);
        if (custs) setCustomers(custs);
        if (scheds) setSchedules(scheds);
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchAll();
        setRefreshing(false);
    };

    const handleSignOut = () => {
        Alert.alert('Sign Out', 'Sign out of admin panel?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign Out', style: 'destructive', onPress: signOut },
        ]);
    };

    // Stats
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total_cost || 0), 0);
    const paidRevenue = orders.filter(o => o.payment_status === 'paid').reduce((sum, o) => sum + (o.total_cost || 0), 0);
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const urgentOrders = orders.filter(o => o.is_urgent).length;

    return (
        <ScrollView
            className="flex-1 bg-slate-900"
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#a5b4fc" />}
        >
            {/* Header */}
            <View className="flex-row items-center justify-between px-6 pt-14 pb-5">
                <View>
                    <Text className="text-slate-400 text-xs font-bold uppercase">Whirling</Text>
                    <Text className="text-white text-2xl font-bold mt-1">Admin Panel</Text>
                </View>
                <TouchableOpacity
                    onPress={handleSignOut}
                    className="w-10 h-10 rounded-full bg-slate-800 items-center justify-center"
                >
                    <LogOut size={18} color="#94a3b8" />
                </TouchableOpacity>
            </View>

            {/* Stats Cards */}
            <View className="px-6 mb-6">
                <View className="flex-row gap-3 mb-3">
                    <View className="flex-1 bg-indigo-600 rounded-2xl p-4">
                        <TrendingUp size={18} color="#a5b4fc" />
                        <Text className="text-indigo-200 text-xs mt-2">Total Revenue</Text>
                        <Text className="text-white text-xl font-bold">₹{totalRevenue}</Text>
                        <Text className="text-indigo-300 text-xs">₹{paidRevenue} collected</Text>
                    </View>
                    <View className="flex-1 bg-slate-800 rounded-2xl p-4">
                        <ShoppingBag size={18} color="#94a3b8" />
                        <Text className="text-slate-400 text-xs mt-2">Total Orders</Text>
                        <Text className="text-white text-xl font-bold">{orders.length}</Text>
                        <Text className="text-slate-500 text-xs">{urgentOrders} urgent</Text>
                    </View>
                </View>
                <View className="flex-row gap-3">
                    <View className="flex-1 bg-slate-800 rounded-2xl p-4">
                        <Clock size={18} color="#94a3b8" />
                        <Text className="text-slate-400 text-xs mt-2">Pending</Text>
                        <Text className="text-white text-xl font-bold">{pendingOrders}</Text>
                        <Text className="text-slate-500 text-xs">awaiting confirm</Text>
                    </View>
                    <View className="flex-1 bg-slate-800 rounded-2xl p-4">
                        <Users size={18} color="#94a3b8" />
                        <Text className="text-slate-400 text-xs mt-2">Customers</Text>
                        <Text className="text-white text-xl font-bold">{customers.length}</Text>
                        <Text className="text-slate-500 text-xs">registered</Text>
                    </View>
                </View>
            </View>

            {/* Tabs */}
            <View className="flex-row px-6 mb-5 gap-2">
                {(['orders', 'customers', 'schedules'] as Tab[]).map((t) => (
                    <TouchableOpacity
                        key={t}
                        onPress={() => setTab(t)}
                        className={`flex-1 py-2 rounded-xl items-center ${tab === t ? 'bg-indigo-600' : 'bg-slate-800'}`}
                    >
                        <Text className={`text-sm font-semibold capitalize ${tab === t ? 'text-white' : 'text-slate-400'}`}>
                            {t}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <View className="px-6 pb-12">
                {/* ORDERS TAB */}
                {tab === 'orders' && (
                    <>
                        {orders.length === 0 ? (
                            <View className="bg-slate-800 rounded-2xl p-6 items-center">
                                <Text className="text-slate-500">No orders yet.</Text>
                            </View>
                        ) : (
                            orders.map((order) => {
                                const s = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                                const isPaid = order.payment_status === 'paid';
                                return (
                                    <View key={order.id} className="bg-slate-800 rounded-2xl p-4 mb-3">
                                        {/* Row 1: customer + badges */}
                                        <View className="flex-row items-center justify-between mb-2">
                                            <Text className="text-white font-semibold flex-1">
                                                {order.profiles?.full_name || 'Unknown'}
                                            </Text>
                                            <View className="flex-row gap-1.5">
                                                {order.is_urgent && (
                                                    <View className="flex-row items-center bg-red-900 px-2 py-0.5 rounded-full">
                                                        <Zap size={9} color="#f87171" />
                                                        <Text className="text-red-400 text-xs font-bold ml-1">URGENT</Text>
                                                    </View>
                                                )}
                                                <View className={`px-2 py-0.5 rounded-full ${s.bg}`}>
                                                    <Text className={`text-xs font-bold ${s.text}`}>{s.label}</Text>
                                                </View>
                                            </View>
                                        </View>
                                        {/* Row 2: details */}
                                        <Text className="text-slate-400 text-sm">
                                            {order.items?.quantity || 0} pcs · {(order.services || []).join(', ')}
                                        </Text>
                                        <Text className="text-slate-500 text-xs mt-0.5">
                                            {order.items?.address || order.profiles?.address || '—'}
                                        </Text>
                                        {/* Row 3: amount + payment */}
                                        <View className="flex-row items-center justify-between mt-3">
                                            <Text className="text-white font-bold text-lg">₹{order.total_cost}</Text>
                                            <View className={`px-2 py-0.5 rounded-full ${isPaid ? 'bg-green-900' : 'bg-amber-900'}`}>
                                                <Text className={`text-xs font-bold ${isPaid ? 'text-green-400' : 'text-amber-400'}`}>
                                                    {isPaid ? 'Paid' : 'Unpaid'}
                                                </Text>
                                            </View>
                                        </View>
                                        {/* Order ID + date */}
                                        <Text className="text-slate-600 text-xs mt-1">
                                            #{order.id.slice(0, 8)} · {new Date(order.created_at).toLocaleDateString('en-IN')}
                                        </Text>
                                    </View>
                                );
                            })
                        )}
                    </>
                )}

                {/* CUSTOMERS TAB */}
                {tab === 'customers' && (
                    <>
                        {customers.length === 0 ? (
                            <View className="bg-slate-800 rounded-2xl p-6 items-center">
                                <Text className="text-slate-500">No customers yet.</Text>
                            </View>
                        ) : (
                            customers.map((c) => {
                                const custOrders = orders.filter(o => o.customer_id === c.id);
                                const custRevenue = custOrders.reduce((sum, o) => sum + (o.total_cost || 0), 0);
                                return (
                                    <View key={c.id} className="bg-slate-800 rounded-2xl p-4 mb-3">
                                        <View className="flex-row items-center justify-between mb-1">
                                            <Text className="text-white font-semibold text-base">{c.full_name || 'Unknown'}</Text>
                                            <Text className="text-indigo-400 font-bold">₹{custRevenue}</Text>
                                        </View>
                                        <Text className="text-slate-400 text-sm">{c.address || 'No address saved'}</Text>
                                        <Text className="text-slate-500 text-xs mt-1">
                                            {custOrders.length} orders total
                                        </Text>
                                    </View>
                                );
                            })
                        )}
                    </>
                )}

                {/* SCHEDULES TAB */}
                {tab === 'schedules' && (
                    <>
                        {schedules.length === 0 ? (
                            <View className="bg-slate-800 rounded-2xl p-6 items-center">
                                <Text className="text-slate-500">No schedules created yet.</Text>
                            </View>
                        ) : (
                            schedules.map((s) => (
                                <View key={s.id} className="bg-slate-800 rounded-2xl p-4 mb-3">
                                    <View className="flex-row items-center mb-3">
                                        <Calendar size={14} color="#a5b4fc" />
                                        <View className={`ml-2 px-2 py-0.5 rounded-full ${s.status === 'upcoming' ? 'bg-indigo-900' : s.status === 'active' ? 'bg-green-900' : 'bg-slate-700'}`}>
                                            <Text className={`text-xs font-bold capitalize ${s.status === 'upcoming' ? 'text-indigo-400' : s.status === 'active' ? 'text-green-400' : 'text-slate-400'}`}>
                                                {s.status}
                                            </Text>
                                        </View>
                                    </View>
                                    <View className="flex-row">
                                        <View className="flex-1">
                                            <Text className="text-slate-500 text-xs mb-0.5">Pickup</Text>
                                            <Text className="text-white font-semibold">{s.pickup_date}</Text>
                                            <Text className="text-slate-400 text-xs">{TIME_SLOT_LABELS[s.pickup_slot] || s.pickup_slot}</Text>
                                        </View>
                                        <View className="w-px bg-slate-700 mx-4" />
                                        <View className="flex-1">
                                            <Text className="text-slate-500 text-xs mb-0.5">Delivery</Text>
                                            <Text className="text-white font-semibold">{s.delivery_date}</Text>
                                            <Text className="text-slate-400 text-xs">{TIME_SLOT_LABELS[s.delivery_slot] || s.delivery_slot}</Text>
                                        </View>
                                    </View>
                                </View>
                            ))
                        )}
                    </>
                )}
            </View>
        </ScrollView>
    );
}
