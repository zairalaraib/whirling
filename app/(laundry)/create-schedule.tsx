import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { ChevronLeft, Calendar } from 'lucide-react-native';

const TIME_SLOTS = [
    { key: '08:00-11:00', label: '8:00 AM – 11:00 AM' },
    { key: '12:00-15:00', label: '12:00 PM – 3:00 PM' },
    { key: '16:00-19:00', label: '4:00 PM – 7:00 PM' },
    { key: '20:00-23:00', label: '8:00 PM – 11:00 PM' },
];

function getNextDays(n: number) {
    const days = [];
    for (let i = 0; i < n; i++) {
        const d = new Date();
        d.setDate(d.getDate() + i);
        const label = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
        const value = d.toISOString().split('T')[0];
        days.push({ label, value });
    }
    return days;
}

const DAYS = getNextDays(7);

export default function CreateSchedule() {
    const [pickupDay, setPickupDay] = useState('');
    const [pickupSlot, setPickupSlot] = useState('');
    const [deliveryDay, setDeliveryDay] = useState('');
    const [deliverySlot, setDeliverySlot] = useState('');
    const [saving, setSaving] = useState(false);

    const allFilled = pickupDay && pickupSlot && deliveryDay && deliverySlot;

    const handleCreate = async () => {
        if (!allFilled) {
            Alert.alert('Incomplete', 'Please select all pickup and delivery options.');
            return;
        }
        setSaving(true);
        const { error } = await supabase.from('schedules').insert({
            pickup_date: pickupDay,
            pickup_slot: pickupSlot,
            delivery_date: deliveryDay,
            delivery_slot: deliverySlot,
            status: 'upcoming',
        });
        if (error) {
            Alert.alert('Error', error.message);
        } else {
            Alert.alert('Schedule Created', 'Customers will see this schedule.', [
                { text: 'OK', onPress: () => router.back() },
            ]);
        }
        setSaving(false);
    };

    const getSlotLabel = (key: string) => TIME_SLOTS.find((s) => s.key === key)?.label || key;
    const getDayLabel = (val: string) => DAYS.find((d) => d.value === val)?.label || val;

    return (
        <ScrollView className="flex-1 bg-slate-50">
            {/* Header */}
            <View className="flex-row items-center px-6 pt-14 pb-4">
                <TouchableOpacity onPress={() => router.back()} className="mr-4">
                    <ChevronLeft size={24} color="#0f172a" />
                </TouchableOpacity>
                <Text className="text-xl font-bold text-slate-900">Create Schedule</Text>
            </View>

            <View className="px-6 pb-10">
                {/* Pickup Day */}
                <View className="bg-white rounded-2xl p-5 shadow-sm mb-4">
                    <Text className="text-xs font-bold text-slate-400 uppercase mb-3">Pickup Day</Text>
                    <View className="flex-row flex-wrap gap-2">
                        {DAYS.map((day) => (
                            <TouchableOpacity
                                key={day.value}
                                onPress={() => setPickupDay(day.value)}
                                className={`px-4 py-2 rounded-xl border-2 ${pickupDay === day.value ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-200'}`}
                            >
                                <Text className={`font-semibold text-sm ${pickupDay === day.value ? 'text-white' : 'text-slate-600'}`}>
                                    {day.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Pickup Time Slot */}
                <View className="bg-white rounded-2xl p-5 shadow-sm mb-4">
                    <Text className="text-xs font-bold text-slate-400 uppercase mb-3">Pickup Time Slot</Text>
                    {TIME_SLOTS.map((slot) => (
                        <TouchableOpacity
                            key={slot.key}
                            onPress={() => setPickupSlot(slot.key)}
                            className={`py-3 px-4 rounded-xl mb-2 border-2 ${pickupSlot === slot.key ? 'bg-indigo-50 border-indigo-500' : 'border-slate-100'}`}
                        >
                            <Text className={`font-medium ${pickupSlot === slot.key ? 'text-indigo-700' : 'text-slate-600'}`}>
                                {slot.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Delivery Day */}
                <View className="bg-white rounded-2xl p-5 shadow-sm mb-4">
                    <Text className="text-xs font-bold text-slate-400 uppercase mb-3">Delivery Day</Text>
                    <View className="flex-row flex-wrap gap-2">
                        {DAYS.map((day) => (
                            <TouchableOpacity
                                key={day.value}
                                onPress={() => setDeliveryDay(day.value)}
                                className={`px-4 py-2 rounded-xl border-2 ${deliveryDay === day.value ? 'bg-green-600 border-green-600' : 'bg-white border-slate-200'}`}
                            >
                                <Text className={`font-semibold text-sm ${deliveryDay === day.value ? 'text-white' : 'text-slate-600'}`}>
                                    {day.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Delivery Time Slot */}
                <View className="bg-white rounded-2xl p-5 shadow-sm mb-5">
                    <Text className="text-xs font-bold text-slate-400 uppercase mb-3">Delivery Time Slot</Text>
                    {TIME_SLOTS.map((slot) => (
                        <TouchableOpacity
                            key={slot.key}
                            onPress={() => setDeliverySlot(slot.key)}
                            className={`py-3 px-4 rounded-xl mb-2 border-2 ${deliverySlot === slot.key ? 'bg-green-50 border-green-500' : 'border-slate-100'}`}
                        >
                            <Text className={`font-medium ${deliverySlot === slot.key ? 'text-green-700' : 'text-slate-600'}`}>
                                {slot.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Summary */}
                {allFilled && (
                    <View className="bg-slate-900 rounded-2xl p-5 mb-5">
                        <View className="flex-row items-center mb-3">
                            <Calendar size={16} color="#a5b4fc" />
                            <Text className="text-indigo-300 text-xs font-bold uppercase ml-2">Schedule Summary</Text>
                        </View>
                        <View className="flex-row">
                            <View className="flex-1">
                                <Text className="text-slate-400 text-xs mb-1">Pickup</Text>
                                <Text className="text-white font-bold">{getDayLabel(pickupDay)}</Text>
                                <Text className="text-slate-300 text-sm">{getSlotLabel(pickupSlot)}</Text>
                            </View>
                            <View className="w-px bg-slate-700 mx-4" />
                            <View className="flex-1">
                                <Text className="text-slate-400 text-xs mb-1">Delivery</Text>
                                <Text className="text-white font-bold">{getDayLabel(deliveryDay)}</Text>
                                <Text className="text-slate-300 text-sm">{getSlotLabel(deliverySlot)}</Text>
                            </View>
                        </View>
                    </View>
                )}

                <TouchableOpacity
                    onPress={handleCreate}
                    disabled={!allFilled || saving}
                    className={`py-4 rounded-2xl ${allFilled ? 'bg-indigo-600' : 'bg-slate-200'}`}
                >
                    <Text className={`text-center font-bold text-lg ${allFilled ? 'text-white' : 'text-slate-400'}`}>
                        {saving ? 'Creating...' : 'Create Schedule'}
                    </Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}
