import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../components/AuthProvider';
import { supabase } from '../../lib/supabase';
import { LogOut, Plus, Package } from 'lucide-react-native';

export default function CustomerHome() {
    const { profile, signOut } = useAuth();
    const router = useRouter();
    const [orders, setOrders] = useState<any[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        setRefreshing(true);
        const { data } = await supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });

        if (data) setOrders(data);
        setRefreshing(false);
    };

    return (
        <View className="flex-1 bg-slate-50">
            {/* Header */}
            <View className="bg-white pt-12 pb-4 px-6 shadow-sm flex-row justify-between items-center">
                <View>
                    <Text className="text-slate-500 text-sm">Welcome back,</Text>
                    <Text className="text-slate-900 text-xl font-bold">{profile?.full_name || 'Customer'}</Text>
                </View>
                <TouchableOpacity onPress={() => signOut()} className="p-2 bg-slate-100 rounded-full">
                    <LogOut size={20} color="#64748b" />
                </TouchableOpacity>
            </View>

            <ScrollView
                className="flex-1 p-6"
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchOrders} />}
            >
                {/* CTA Card */}
                <View className="bg-indigo-600 rounded-2xl p-6 mb-8 shadow-lg shadow-indigo-200">
                    <Text className="text-white text-lg font-bold mb-2">Laundry Guy coming at 6pm today!</Text>
                    <Text className="text-indigo-100 mb-6">In your building. Don't miss the slot.</Text>

                    <TouchableOpacity
                        onPress={() => router.push('/(customer)/new-order')}
                        className="bg-white flex-row items-center justify-center py-3 rounded-xl"
                    >
                        <Text className="text-indigo-600 font-bold mr-2">Click confirm to place order</Text>
                        <Plus size={20} color="#4f46e5" />
                    </TouchableOpacity>
                </View>

                {/* Recent Orders */}
                <Text className="text-slate-900 font-bold text-lg mb-4">Your Orders</Text>

                {orders.length === 0 ? (
                    <View className="items-center py-10 opacity-50">
                        <Package size={48} color="#94a3b8" />
                        <Text className="text-slate-400 mt-2">No orders yet</Text>
                    </View>
                ) : (
                    <View className="space-y-4">
                        {orders.map(order => (
                            <TouchableOpacity
                                key={order.id}
                                onPress={() => router.push({ pathname: '/(customer)/order-details', params: { id: order.id } })}
                                className="bg-white p-4 rounded-xl border border-slate-200 flex-row justify-between items-center"
                            >
                                <View>
                                    <Text className="font-bold text-slate-800">Order #{order.id.slice(0, 6)}</Text>
                                    <Text className="text-slate-500 text-sm">{new Date(order.created_at).toLocaleDateString()}</Text>
                                </View>
                                <View className="items-end">
                                    <Text className={`font-bold capitalize ${order.status === 'delivered' ? 'text-green-600' :
                                            order.status === 'pending' ? 'text-amber-500' : 'text-blue-600'
                                        }`}>
                                        {order.status.replace('_', ' ')}
                                    </Text>
                                    {order.total_cost && (
                                        <Text className="text-slate-900 font-bold mt-1">${order.total_cost}</Text>
                                    )}
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </ScrollView>
        </View>
    );
}
