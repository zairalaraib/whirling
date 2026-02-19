import { useLocalSearchParams } from 'expo-router';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { CheckCircle, Clock } from 'lucide-react-native';

export default function OrderDetails() {
    const { id } = useLocalSearchParams();
    const [order, setOrder] = useState<any>(null);

    useEffect(() => {
        if (id) fetchOrder();
    }, [id]);

    const fetchOrder = async () => {
        const { data } = await supabase.from('orders').select('*').eq('id', id).single();
        if (data) setOrder(data);
    };

    const handlePay = () => {
        Alert.alert('Payment', 'Mark as Paid? This is a manual confirmation.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Confirm Paid', onPress: () => Alert.alert('Paid!', 'Thank you.') }
        ]);
    };

    if (!order) return <View className="flex-1 bg-white" />;

    const steps = [
        { key: 'pending', label: 'Order Placed' },
        { key: 'picked_up', label: 'Picked Up' },
        { key: 'in_progress', label: 'In Service' },
        { key: 'delivered', label: 'Delivered' }
    ];

    const currentStepIndex = steps.findIndex(s => s.key === order.status);

    return (
        <ScrollView className="flex-1 bg-slate-50 p-6">
            <View className="bg-white p-6 rounded-2xl shadow-sm mb-6">
                <Text className="text-slate-500 mb-1">Order ID: {order.id.slice(0, 8)}</Text>
                <Text className="text-3xl font-bold text-slate-900">${order.total_cost}</Text>
                <View className="bg-green-100 self-start px-3 py-1 rounded-full mt-2">
                    <Text className="text-green-700 font-bold text-xs uppercase">Unpaid</Text>
                </View>
            </View>

            {/* Status Timeline */}
            <View className="bg-white p-6 rounded-2xl shadow-sm mb-6">
                <Text className="text-lg font-bold mb-4">Status Tracking</Text>
                {steps.map((step, index) => {
                    const isActive = index <= currentStepIndex;
                    const isCurrent = index === currentStepIndex;
                    return (
                        <View key={step.key} className="flex-row items-center mb-6 last:mb-0">
                            <View className={`w-8 h-8 rounded-full items-center justify-center mr-4 ${isActive ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                                {isActive && <CheckCircle size={16} color="white" />}
                            </View>
                            <View>
                                <Text className={`font-bold ${isActive ? 'text-slate-900' : 'text-slate-400'}`}>{step.label}</Text>
                                {isCurrent && <Text className="text-indigo-600 text-xs">Current Status</Text>}
                            </View>
                        </View>
                    );
                })}
            </View>

            {/* Bill Section */}
            <View className="bg-white p-6 rounded-2xl shadow-sm mb-6">
                <Text className="text-lg font-bold mb-4">Bill Details</Text>
                <View className="flex-row justify-between mb-2">
                    <Text className="text-slate-500">Clothes</Text>
                    <Text className="font-bold">{order.items?.quantity || 0} pcs</Text>
                </View>
                <View className="flex-row justify-between mb-2">
                    <Text className="text-slate-500">Services</Text>
                    <Text className="font-bold flex-1 text-right">
                        {(order.services || []).join(', ')}
                    </Text>
                </View>
                <View className="h-px bg-slate-200 my-2" />
                <View className="flex-row justify-between">
                    <Text className="font-bold text-lg">Total</Text>
                    <Text className="font-bold text-lg text-indigo-600">${order.total_cost}</Text>
                </View>
            </View>

            <TouchableOpacity
                onPress={handlePay}
                className="bg-slate-900 py-4 rounded-xl mb-8"
            >
                <Text className="text-white text-center font-bold text-lg">Pay Bill</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}
