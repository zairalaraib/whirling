import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function LaundryOrderDetails() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [order, setOrder] = useState<any>(null);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        if (id) fetchOrder();
    }, [id]);

    const fetchOrder = async () => {
        const { data } = await supabase
            .from('orders')
            .select('*, profiles(full_name, address)')
            .eq('id', id)
            .single();
        if (data) setOrder(data);
    };

    const updateStatus = async (newStatus: string) => {
        setUpdating(true);
        const { error } = await supabase
            .from('orders')
            .update({ status: newStatus })
            .eq('id', id);

        if (error) {
            Alert.alert('Error', error.message);
        } else {
            setOrder({ ...order, status: newStatus });
        }
        setUpdating(false);
    };

    if (!order) return <View className="flex-1 bg-white justify-center items-center"><ActivityIndicator /></View>;

    const statuses = [
        { key: 'pending', label: 'Pending Pick Up', color: 'bg-amber-100 text-amber-700' },
        { key: 'picked_up', label: 'Picked Up', color: 'bg-blue-100 text-blue-700' },
        { key: 'in_progress', label: 'In Progress', color: 'bg-purple-100 text-purple-700' },
        { key: 'delivered', label: 'Delivered', color: 'bg-green-100 text-green-700' },
    ];

    return (
        <ScrollView className="flex-1 bg-slate-50 p-6">
            <View className="bg-white p-6 rounded-2xl shadow-sm mb-6">
                <Text className="text-slate-500 mb-2">Customer Details</Text>
                <Text className="text-xl font-bold text-slate-900">{order.profiles?.full_name || 'Unknown'}</Text>
                <Text className="text-slate-700 mt-1">{order.items?.address}</Text>
                <View className="flex-row mt-4 space-x-2">
                    <View className="bg-slate-100 px-3 py-1 rounded-full">
                        <Text className="text-slate-600 font-bold text-xs">Delivery: {order.delivery_preferences}</Text>
                    </View>
                </View>
            </View>

            <View className="bg-white p-6 rounded-2xl shadow-sm mb-6">
                <Text className="text-lg font-bold mb-4">Order Items</Text>
                <Text className="text-slate-700 mb-2">Quantity: {order.items?.quantity}</Text>
                <Text className="text-slate-700">Services: {orderedServicesString(order.services)}</Text>
                <View className="mt-4 pt-4 border-t border-slate-100 flex-row justify-between">
                    <Text className="font-bold">Total Bill</Text>
                    <Text className="font-bold text-indigo-600 text-lg">${order.total_cost}</Text>
                </View>
            </View>

            <Text className="font-bold text-slate-900 text-lg mb-4">Update Status</Text>
            <View className="space-y-3 pb-8">
                {statuses.map((status) => (
                    <TouchableOpacity
                        key={status.key}
                        disabled={updating || order.status === status.key}
                        onPress={() => updateStatus(status.key)}
                        className={`p-4 rounded-xl border-2 flex-row justify-between items-center ${order.status === status.key ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200 bg-white'
                            }`}
                    >
                        <Text className={`font-bold ${order.status === status.key ? 'text-indigo-700' : 'text-slate-600'
                            }`}>{status.label}</Text>
                        {order.status === status.key && <Text className="text-indigo-600 text-xs font-bold">CURRENT</Text>}
                    </TouchableOpacity>
                ))}
            </View>
        </ScrollView>
    );
}

function orderedServicesString(services: string[] | undefined) {
    if (!services || !Array.isArray(services)) return 'None';
    return services.map(s => s.replace('_', ' ')).join(', ');
}
