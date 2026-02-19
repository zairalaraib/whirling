import React, { useEffect, useState } from 'react';
import { View, Text, SectionList, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../components/AuthProvider';
import { LogOut, Settings } from 'lucide-react-native';

export default function LaundryDashboard() {
    const { signOut } = useAuth();
    const router = useRouter();
    const [sections, setSections] = useState<any[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        setRefreshing(true);
        // Fetch pending/in_progress orders
        const { data } = await supabase
            .from('orders')
            .select('*, profiles(full_name)')
            .in('status', ['pending', 'picked_up', 'in_progress'])
            .order('created_at', { ascending: true }); // Oldest first?

        if (data) {
            // Group by Address (Building)
            // Assumption: address is in items->address or delivery_preferences is location info.
            // We'll use items->address as string.
            const grouped = data.reduce((acc: any, order: any) => {
                const addr = order.items?.address || 'Unknown Address';
                // rudimental grouping by first part of address or full address
                if (!acc[addr]) acc[addr] = [];
                acc[addr].push(order);
                return acc;
            }, {});

            const sectionData = Object.keys(grouped).map(key => ({
                title: key,
                data: grouped[key]
            }));

            setSections(sectionData);
        }
        setRefreshing(false);
    };

    return (
        <View className="flex-1 bg-slate-50">
            <View className="bg-white pt-12 pb-4 px-6 shadow-sm flex-row justify-between items-center">
                <Text className="text-xl font-bold text-slate-900">Delivery Dashboard</Text>
                <View className="flex-row space-x-2">
                    <TouchableOpacity onPress={() => signOut()} className="p-2 bg-slate-100 rounded-full">
                        <LogOut size={20} color="#64748b" />
                    </TouchableOpacity>
                </View>
            </View>

            <SectionList
                sections={sections}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchOrders} />}
                keyExtractor={(item) => item.id}
                renderSectionHeader={({ section: { title } }) => (
                    <View className="bg-indigo-100 px-6 py-2 mt-4">
                        <Text className="font-bold text-indigo-800 uppercase text-xs">{title}</Text>
                    </View>
                )}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        onPress={() => router.push({ pathname: '/(laundry)/order-details', params: { id: item.id } })}
                        className="bg-white px-6 py-4 border-b border-slate-100 flex-row justify-between items-center"
                    >
                        <View>
                            <Text className="font-bold text-slate-900">Flat/Unit: {item.items?.address}</Text>
                            <Text className="text-slate-500 text-sm">{item.items?.quantity} items • {item.services?.join(', ')}</Text>
                            <Text className="text-xs text-slate-400 mt-1">{item.profiles?.full_name}</Text>
                        </View>
                        <View className={`px-2 py-1 rounded-lg ${item.status === 'pending' ? 'bg-amber-100' :
                                item.status === 'picked_up' ? 'bg-blue-100' : 'bg-purple-100'
                            }`}>
                            <Text className={`text-xs font-bold capitalize ${item.status === 'pending' ? 'text-amber-700' :
                                    item.status === 'picked_up' ? 'text-blue-700' : 'text-purple-700'
                                }`}>{item.status.replace('_', ' ')}</Text>
                        </View>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={
                    <View className="p-10 items-center"><Text className="text-slate-400">No active orders</Text></View>
                }
            />
        </View>
    );
}
