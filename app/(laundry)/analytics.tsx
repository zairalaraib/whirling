import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import Svg, { Defs, LinearGradient, Path, Stop, Circle, Text as SvgText } from 'react-native-svg';
import { ChevronLeft, TrendingUp, Wallet, CircleDollarSign, ShoppingBag, CalendarDays } from 'lucide-react-native';
import { useColorScheme } from '../../components/useColorScheme';

type Order = {
    id: string;
    total_cost: number | null;
    payment_status: 'paid' | 'unpaid' | null;
    status: string | null;
    created_at: string;
    updated_at?: string | null;
    items?: { quantity?: number } | null;
    services?: string[] | null;
    is_urgent?: boolean | null;
    profiles?: { full_name?: string | null } | null;
};

type Service = {
    name: string;
    rate: number;
};

type MonthOption = {
    key: string;
    label: string;
    year: number;
    month: number;
};

function getRecentMonths(count: number): MonthOption[] {
    const now = new Date();
    return Array.from({ length: count }, (_, index) => {
        const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
        return {
            key: `${date.getFullYear()}-${date.getMonth()}`,
            label: date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
            year: date.getFullYear(),
            month: date.getMonth(),
        };
    });
}

function isInMonth(dateString: string, option: MonthOption) {
    const date = new Date(dateString);
    return date.getFullYear() === option.year && date.getMonth() === option.month;
}

function formatCurrency(amount: number) {
    return `₹${amount.toLocaleString('en-IN')}`;
}

function toAmount(value: number | string | null | undefined) {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : 0;
    }

    if (typeof value === 'string') {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : 0;
    }

    return 0;
}

function normalizeServiceKey(value: string) {
    return value.toLowerCase().trim().replace(/\s+/g, '_');
}

function getRevenueDate(order: Order) {
    return order.updated_at || order.created_at;
}

function getWeekdayLabel(date: Date) {
    return date.toLocaleDateString('en-IN', { weekday: 'short' });
}

function toServiceLabel(service: string) {
    switch (service) {
        case 'wash':
            return 'Wash';
        case 'iron':
            return 'Iron';
        case 'stain_removal':
            return 'Stain Removal';
        case 'urgent_fee':
            return 'Urgent Fee';
        default:
            return service;
    }
}

function buildLinePath(points: { x: number; y: number }[]) {
    if (points.length === 0) {
        return '';
    }

    return points
        .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
        .join(' ');
}

function buildAreaPath(points: { x: number; y: number }[], height: number) {
    if (points.length === 0) {
        return '';
    }

    const line = buildLinePath(points);
    const first = points[0];
    const last = points[points.length - 1];
    return `${line} L ${last.x} ${height} L ${first.x} ${height} Z`;
}

export default function LaundryAnalytics() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const [orders, setOrders] = useState<Order[]>([]);
    const [serviceRates, setServiceRates] = useState<Record<string, number>>({});
    const [refreshing, setRefreshing] = useState(false);
    const monthOptions = useMemo(() => getRecentMonths(6), []);
    const [selectedMonthKey, setSelectedMonthKey] = useState('');

    const theme = isDark ? {
        background: '#0f172a',
        panel: '#162033',
        panelSoft: '#1e293b',
        panelStrong: '#111827',
        text: '#f8fafc',
        textMuted: '#94a3b8',
        textSoft: '#cbd5e1',
        accent: '#7dd3fc',
        accentAlt: '#c084fc',
        border: '#243047',
        chip: '#182338',
        chipActive: '#27364f',
        chartGrid: '#334155',
    } : {
        background: '#f4f7fb',
        panel: '#ffffff',
        panelSoft: '#eef2ff',
        panelStrong: '#e2e8f0',
        text: '#0f172a',
        textMuted: '#64748b',
        textSoft: '#334155',
        accent: '#2563eb',
        accentAlt: '#7c3aed',
        border: '#dbe4f0',
        chip: '#ffffff',
        chipActive: '#dbeafe',
        chartGrid: '#dbe4f0',
    };

    const fetchAnalyticsData = useCallback(async () => {
        const [{ data: orderData }, { data: servicesData }] = await Promise.all([
            supabase
                .from('orders')
                .select('id, total_cost, payment_status, status, created_at, updated_at, items, services, is_urgent, profiles(full_name)')
                .order('created_at', { ascending: false }),
            supabase
                .from('services')
                .select('name, rate'),
        ]);

        if (orderData) {
            setOrders(orderData as Order[]);
        }

        if (servicesData) {
            const rateMap = (servicesData as Service[]).reduce<Record<string, number>>((acc, service) => {
                acc[normalizeServiceKey(service.name)] = toAmount(service.rate);
                return acc;
            }, {});
            setServiceRates(rateMap);
        }
    }, []);

    useEffect(() => {
        fetchAnalyticsData();
    }, [fetchAnalyticsData]);

    useEffect(() => {
        if (monthOptions.length === 0) {
            return;
        }

        const firstMonthWithOrders = monthOptions.find((option) =>
            orders.some((order) => isInMonth(order.created_at, option))
        );

        setSelectedMonthKey((current) => {
            if (current && monthOptions.some((option) => option.key === current)) {
                return current;
            }

            return firstMonthWithOrders?.key ?? monthOptions[0].key;
        });
    }, [orders, monthOptions]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchAnalyticsData();
        setRefreshing(false);
    };

    const selectedMonth = monthOptions.find((option) => option.key === selectedMonthKey) ?? monthOptions[0];
    const monthlyOrders = selectedMonth
        ? orders.filter((order) => isInMonth(order.created_at, selectedMonth))
        : [];
    const paidMonthlyOrders = selectedMonth
        ? orders.filter((order) => order.payment_status === 'paid' && isInMonth(getRevenueDate(order), selectedMonth))
        : [];
    const hasMonthlyData = paidMonthlyOrders.length > 0;

    const collectedThisMonth = paidMonthlyOrders
        .reduce((sum, order) => sum + toAmount(order.total_cost), 0);

    const totalOrderValue = paidMonthlyOrders
        .reduce((sum, order) => sum + toAmount(order.total_cost), 0);

    const outstandingThisMonth = monthlyOrders
        .filter((order) => order.payment_status !== 'paid')
        .reduce((sum, order) => sum + toAmount(order.total_cost), 0);

    const deliveredThisMonth = paidMonthlyOrders.filter((order) => order.status === 'delivered').length;
    const averageOrderFee = paidMonthlyOrders.length === 0 ? 0 : Math.round(totalOrderValue / paidMonthlyOrders.length);

    const dailyRevenue = useMemo(() => {
        const groupedByDay = paidMonthlyOrders.reduce<Map<string, number>>((acc, order) => {
            const orderDate = new Date(getRevenueDate(order));
            const key = `${orderDate.getFullYear()}-${orderDate.getMonth()}-${orderDate.getDate()}`;
            acc.set(key, (acc.get(key) || 0) + toAmount(order.total_cost));
            return acc;
        }, new Map());

        const sortedDays = Array.from(groupedByDay.entries())
            .sort(([a], [b]) => {
                const [aYear, aMonth, aDay] = a.split('-').map(Number);
                const [bYear, bMonth, bDay] = b.split('-').map(Number);
                return new Date(aYear, aMonth, aDay).getTime() - new Date(bYear, bMonth, bDay).getTime();
            })
            .slice(-7);

        return sortedDays.map(([key, total]) => {
            const [year, month, day] = key.split('-').map(Number);
            const date = new Date(year, month, day);
            return {
                label: getWeekdayLabel(date),
                total,
            };
        });
    }, [paidMonthlyOrders]);

    const highestSingleDay = dailyRevenue.reduce((max, day) => Math.max(max, day.total), 0);
    const chartMax = Math.max(...dailyRevenue.map((day) => day.total), 1000);

    const chartPoints = dailyRevenue.map((day, index) => {
        const width = 320;
        const height = 170;
        const x = 24 + (index * ((width - 48) / Math.max(dailyRevenue.length - 1, 1)));
        const y = 16 + ((chartMax - day.total) / chartMax) * (height - 32);
        return { x, y, value: day.total, label: day.label };
    });

    const serviceBreakdown = useMemo(() => {
        const breakdown = new Map<string, number>();
        const fallbackRates: Record<string, number> = {
            wash: 25,
            iron: 15,
            stain_removal: 50,
        };

        paidMonthlyOrders.forEach((order) => {
            const services = order.services && order.services.length > 0 ? order.services : ['wash'];
            const quantity = Math.max(order.items?.quantity || 1, 1);

            services.forEach((service) => {
                const key = normalizeServiceKey(service);
                const rate = serviceRates[key] ?? fallbackRates[key] ?? 0;
                const multiplier = key === 'stain_removal' ? 1 : quantity;
                const amount = toAmount(rate) * multiplier;
                breakdown.set(key, (breakdown.get(key) || 0) + amount);
            });

            if (order.is_urgent) {
                breakdown.set('urgent_fee', (breakdown.get('urgent_fee') || 0) + 100);
            }
        });

        return Array.from(breakdown.entries())
            .map(([key, value], index) => ({
                key,
                label: toServiceLabel(key),
                value: Math.round(value),
                color: ['#60a5fa', '#fbbf24', '#8b5cf6', '#ef4444'][index % 4],
            }))
            .sort((a, b) => b.value - a.value);
    }, [paidMonthlyOrders, serviceRates]);

    const topService = serviceBreakdown[0];
    const serviceMax = Math.max(...serviceBreakdown.map((service) => service.value), 1);

    return (
        <ScrollView
            className="flex-1"
            style={{ backgroundColor: theme.background }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />}
        >
            <View className="px-6 pt-14 pb-12">
                <View className="flex-row items-center justify-between mb-6">
                    <View className="flex-row items-center">
                        <TouchableOpacity onPress={() => router.back()} className="mr-4">
                            <ChevronLeft size={24} color={theme.textSoft} />
                        </TouchableOpacity>
                        <View>
                            <Text className="text-xs font-bold uppercase" style={{ color: theme.accent }}>Laundry Dashboard</Text>
                            <Text className="text-2xl font-bold mt-1" style={{ color: theme.text }}>Monthly Earnings</Text>
                        </View>
                    </View>
                    <View className="items-end">
                        <Text className="text-base font-semibold" style={{ color: theme.text }}>
                            Laundry Guy
                        </Text>
                        <Text className="text-xs mt-1" style={{ color: theme.textMuted }}>
                            {selectedMonth?.label || 'Current Month'}
                        </Text>
                    </View>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-5">
                    <View className="flex-row gap-3">
                        {monthOptions.map((option) => {
                            const active = option.key === selectedMonthKey;
                            return (
                                <TouchableOpacity
                                    key={option.key}
                                    onPress={() => setSelectedMonthKey(option.key)}
                                    className="px-4 py-3 rounded-2xl border flex-row items-center"
                                    style={{
                                        backgroundColor: active ? theme.chipActive : theme.chip,
                                        borderColor: active ? theme.accent : theme.border,
                                    }}
                                >
                                    <CalendarDays size={14} color={active ? theme.accent : theme.textMuted} />
                                    <Text
                                        className="font-semibold ml-2"
                                        style={{ color: active ? theme.text : theme.textSoft }}
                                    >
                                        {option.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </ScrollView>

                <View
                    className="rounded-[28px] p-5 mb-5"
                    style={{
                        backgroundColor: isDark ? '#0f172a' : '#eff6ff',
                        borderWidth: 1,
                        borderColor: theme.border,
                    }}
                >
                    <View className="flex-row gap-3 mb-3">
                        <View className="flex-1 rounded-2xl p-4" style={{ backgroundColor: theme.panel }}>
                            <CircleDollarSign size={18} color="#38bdf8" />
                            <Text className="text-xs mt-2" style={{ color: theme.textMuted }}>Total Earnings</Text>
                            <Text className="text-3xl font-bold mt-2" style={{ color: theme.text }}>
                                {hasMonthlyData ? formatCurrency(collectedThisMonth) : '—'}
                            </Text>
                            <Text className="text-sm mt-1" style={{ color: theme.textMuted }}>
                                {hasMonthlyData ? (selectedMonth?.label || 'This month') : 'No orders in this month'}
                            </Text>
                        </View>
                        <View className="flex-1 rounded-2xl p-4" style={{ backgroundColor: theme.panel }}>
                            <Wallet size={18} color="#f59e0b" />
                            <Text className="text-xs mt-2" style={{ color: theme.textMuted }}>Average Order Fee</Text>
                            <Text className="text-3xl font-bold mt-2" style={{ color: theme.text }}>
                                {hasMonthlyData ? formatCurrency(averageOrderFee) : '—'}
                            </Text>
                        </View>
                    </View>
                    <View className="flex-row gap-3">
                        <View className="flex-1 rounded-2xl p-4" style={{ backgroundColor: theme.panel }}>
                            <TrendingUp size={18} color="#fb7185" />
                            <Text className="text-xs mt-2" style={{ color: theme.textMuted }}>Highest Single Day</Text>
                            <Text className="text-3xl font-bold mt-2" style={{ color: theme.text }}>
                                {hasMonthlyData ? formatCurrency(highestSingleDay) : '—'}
                            </Text>
                        </View>
                        <View className="flex-1 rounded-2xl p-4" style={{ backgroundColor: theme.panel }}>
                            <ShoppingBag size={18} color="#a78bfa" />
                            <Text className="text-xs mt-2" style={{ color: theme.textMuted }}>Top Service</Text>
                            <Text className="text-xl font-bold mt-2" style={{ color: theme.text }}>
                                {topService?.label || 'No data'}
                            </Text>
                            <Text className="text-sm mt-1" style={{ color: theme.textMuted }}>
                                {topService ? formatCurrency(topService.value) : 'Track orders to see this'}
                            </Text>
                        </View>
                    </View>
                </View>

                <View className="rounded-[28px] p-5 mb-5" style={{ backgroundColor: theme.panel, borderWidth: 1, borderColor: theme.border }}>
                    <View className="flex-row items-center justify-between mb-5">
                        <Text className="text-lg font-bold" style={{ color: theme.text }}>Revenue Trend</Text>
                        <Text className="text-xs" style={{ color: theme.textMuted }}>
                            {hasMonthlyData ? 'Latest 7 active days' : 'No activity'}
                        </Text>
                    </View>

                    <Svg width="100%" height="220" viewBox="0 0 320 220">
                        <Defs>
                            <LinearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <Stop offset="0%" stopColor="#60a5fa" />
                                <Stop offset="50%" stopColor="#c084fc" />
                                <Stop offset="100%" stopColor="#86efac" />
                            </LinearGradient>
                            <LinearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                <Stop offset="0%" stopColor="#c084fc" stopOpacity="0.35" />
                                <Stop offset="100%" stopColor="#60a5fa" stopOpacity="0.04" />
                            </LinearGradient>
                        </Defs>

                        {[0, 1, 2, 3].map((line) => {
                            const y = 30 + line * 42;
                            return (
                                <Path
                                    key={line}
                                    d={`M 20 ${y} L 300 ${y}`}
                                    stroke={theme.chartGrid}
                                    strokeWidth="1"
                                    opacity="0.7"
                                />
                            );
                        })}

                        {hasMonthlyData ? (
                            <>
                                <Path d={buildAreaPath(chartPoints, 188)} fill="url(#areaGradient)" />
                                <Path d={buildLinePath(chartPoints)} stroke="url(#lineGradient)" strokeWidth="4" fill="none" strokeLinecap="round" />

                                {chartPoints.map((point, index) => (
                                    <React.Fragment key={point.label}>
                                        <Circle cx={point.x} cy={point.y} r="4.5" fill="#f8fafc" />
                                        <Circle cx={point.x} cy={point.y} r="3" fill={['#60a5fa', '#c084fc', '#fb7185', '#22d3ee', '#f97316', '#fbbf24', '#86efac'][index % 7]} />
                                        {point.value > 0 && (
                                            <SvgText
                                                x={point.x}
                                                y={point.y - 12}
                                                fontSize="11"
                                                fontWeight="700"
                                                fill={isDark ? '#e2e8f0' : '#334155'}
                                                textAnchor="middle"
                                            >
                                                {`${point.value / 1000 >= 1 ? `₹${(point.value / 1000).toFixed(point.value % 1000 === 0 ? 0 : 1)}k` : formatCurrency(point.value)}`}
                                            </SvgText>
                                        )}
                                        <SvgText
                                            x={point.x}
                                            y="208"
                                            fontSize="11"
                                            fill={theme.textMuted}
                                            textAnchor="middle"
                                        >
                                            {point.label}
                                        </SvgText>
                                    </React.Fragment>
                                ))}
                            </>
                        ) : (
                            <SvgText
                                x="160"
                                y="112"
                                fontSize="14"
                                fontWeight="600"
                                fill={theme.textMuted}
                                textAnchor="middle"
                            >
                                No revenue data for this month
                            </SvgText>
                        )}
                    </Svg>
                </View>

                <View className="rounded-[28px] p-5 mb-5" style={{ backgroundColor: theme.panel, borderWidth: 1, borderColor: theme.border }}>
                    <View className="flex-row items-center justify-between mb-4">
                        <Text className="text-lg font-bold" style={{ color: theme.text }}>Earnings by Service Type</Text>
                        <Text className="text-xs" style={{ color: theme.textMuted }}>
                            {paidMonthlyOrders.length} paid orders
                        </Text>
                    </View>

                    {serviceBreakdown.length === 0 ? (
                        <Text style={{ color: theme.textMuted }}>No service data for this month yet.</Text>
                    ) : (
                        serviceBreakdown.map((service) => (
                            <View key={service.key} className="mb-4 last:mb-0">
                                <View className="flex-row items-center justify-between mb-2">
                                    <Text className="font-medium" style={{ color: theme.textSoft }}>{service.label}</Text>
                                    <Text className="font-semibold" style={{ color: theme.text }}>{formatCurrency(service.value)}</Text>
                                </View>
                                <View className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: theme.panelStrong }}>
                                    <View
                                        className="h-3 rounded-full"
                                        style={{
                                            width: `${(service.value / serviceMax) * 100}%`,
                                            backgroundColor: service.color,
                                        }}
                                    />
                                </View>
                            </View>
                        ))
                    )}
                </View>

                <View className="flex-row gap-3 mb-5">
                    <View className="flex-1 rounded-2xl p-4" style={{ backgroundColor: theme.panel, borderWidth: 1, borderColor: theme.border }}>
                        <Text className="text-xs" style={{ color: theme.textMuted }}>Outstanding</Text>
                        <Text className="text-2xl font-bold mt-2" style={{ color: theme.text }}>
                            {hasMonthlyData ? formatCurrency(outstandingThisMonth) : '—'}
                        </Text>
                    </View>
                    <View className="flex-1 rounded-2xl p-4" style={{ backgroundColor: theme.panel, borderWidth: 1, borderColor: theme.border }}>
                        <Text className="text-xs" style={{ color: theme.textMuted }}>Delivered Orders</Text>
                        <Text className="text-2xl font-bold mt-2" style={{ color: theme.text }}>
                            {hasMonthlyData ? String(deliveredThisMonth) : '—'}
                        </Text>
                    </View>
                </View>

                <View className="flex-row items-center justify-between mb-3">
                    <Text className="text-lg font-bold" style={{ color: theme.text }}>Monthly History</Text>
                    <Text className="text-xs" style={{ color: theme.textMuted }}>Newest first</Text>
                </View>

                {monthlyOrders.length === 0 ? (
                    <View className="rounded-2xl p-6 items-center" style={{ backgroundColor: theme.panel, borderWidth: 1, borderColor: theme.border }}>
                        <Text style={{ color: theme.textMuted }}>No orders found for this month.</Text>
                    </View>
                ) : (
                    monthlyOrders.map((order) => {
                        const isPaid = order.payment_status === 'paid';
                        return (
                            <View
                                key={order.id}
                                className="rounded-2xl p-4 mb-3"
                                style={{ backgroundColor: theme.panel, borderWidth: 1, borderColor: theme.border }}
                            >
                                <View className="flex-row items-center justify-between mb-2">
                                    <View className="flex-1 pr-3">
                                        <Text className="font-semibold" style={{ color: theme.text }}>
                                            {order.profiles?.full_name || 'Customer'}
                                        </Text>
                                        <Text className="text-xs mt-1" style={{ color: theme.textMuted }}>
                                            #{order.id.slice(0, 8)} · {new Date(order.created_at).toLocaleDateString('en-IN')}
                                        </Text>
                                    </View>
                                    <View
                                        className="px-3 py-1 rounded-full"
                                        style={{ backgroundColor: isPaid ? '#10b98120' : '#f59e0b20' }}
                                    >
                                        <Text
                                            className="text-xs font-bold"
                                            style={{ color: isPaid ? '#10b981' : '#f59e0b' }}
                                        >
                                            {isPaid ? 'Paid' : 'Pending'}
                                        </Text>
                                    </View>
                                </View>
                                <View className="flex-row items-center justify-between">
                                    <Text className="capitalize" style={{ color: theme.textMuted }}>{order.status || 'pending'}</Text>
                                    <Text className="font-bold text-lg" style={{ color: theme.text }}>
                                        {formatCurrency(order.total_cost || 0)}
                                    </Text>
                                </View>
                            </View>
                        );
                    })
                )}
            </View>
        </ScrollView>
    );
}
