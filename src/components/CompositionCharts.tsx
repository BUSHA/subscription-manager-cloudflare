import React, { useMemo } from 'react';
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';
import { Subscription } from '@/types';
import styles from './Charts.module.css';
import getSymbolFromCurrency from 'currency-symbol-map';
import { convertCurrencySync, useExchangeRates } from '@/lib/currencyConverter';

interface CompositionChartsProps {
    subscriptions: Subscription[];
    currency: string;
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

const CompositionCharts: React.FC<CompositionChartsProps> = ({ subscriptions, currency }) => {
    const { loaded } = useExchangeRates();

    // Normalize everything to monthly cost for fair comparison in pie chart
    const getMonthlyAmount = (sub: Subscription) => {
        if (sub.included === false) return 0;
        const amount = typeof sub.amount === 'string' ? parseFloat(sub.amount) : sub.amount;
        const intervalValue = sub.interval_value || sub.intervalValue || 1;
        const intervalUnit = sub.interval_unit || sub.intervalUnit || 'months';

        if (!amount || intervalValue <= 0) return 0;

        switch (intervalUnit) {
            case 'days': return (amount * 30) / intervalValue; // Approx
            case 'weeks': return (amount * 4.33) / intervalValue; // Approx
            case 'months': return amount / intervalValue;
            case 'years': return amount / (12 * intervalValue);
            default: return amount;
        }
    };

    const { categoryData, paymentData } = useMemo(() => {
        const catMap = new Map<string, number>();
        const payMap = new Map<string, number>();

        subscriptions.forEach(sub => {
            const monthlyCost = getMonthlyAmount(sub);
            if (monthlyCost === 0) return;

            // Convert to selected currency
            const subCurrency = sub.currency || 'USD';
            const convertedCost = convertCurrencySync(monthlyCost, subCurrency, currency);
            if (convertedCost === null) return;

            // Categories (First tag)
            let category = 'Uncategorized';
            if (sub.tags && sub.tags.length > 0) {
                category = sub.tags[0];
            }
            catMap.set(category, (catMap.get(category) || 0) + convertedCost);

            // Payment Method
            const payment = sub.account || 'Unspecified';
            payMap.set(payment, (payMap.get(payment) || 0) + convertedCost);
        });

        const formatData = (map: Map<string, number>) => {
            return Array.from(map.entries())
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value); // Descending
        };

        return {
            categoryData: formatData(catMap),
            paymentData: formatData(payMap)
        };
    }, [subscriptions, currency, loaded]);

    const categoryTotal = categoryData.reduce((sum, d) => sum + d.value, 0);
    const paymentTotal = paymentData.reduce((sum, d) => sum + d.value, 0);

    const renderTooltip = (total: number) => ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0];
            const symbol = getSymbolFromCurrency(currency) || '$';
            const percentage = total > 0 ? ((data.value / total) * 100).toFixed(1) : '0.0';
            
            return (
                <div className={styles.customTooltip}>
                    <p className={styles.tooltipLabel}>{data.name}</p>
                    <p className={styles.tooltipValue}>
                        {symbol}{data.value.toFixed(2)} / mo
                    </p>
                    <p style={{ color: '#aaa', fontSize: '0.8em' }}>
                        {percentage}%
                    </p>
                </div>
            );
        }
        return null;
    };

    const renderChart = (title: string, data: any[], total: number) => (
        <div className={styles.chartCard} style={{ flex: 1, minWidth: '300px' }}>
            <div className={styles.title}>{title}</div>
            <div className={styles.subtitle}>Monthly cost distribution</div>
            <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            fill="#8884d8"
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip content={renderTooltip(total)} />
                        <Legend
                            formatter={(value, entry: any) => {
                                const percent = total > 0 ? ((entry.payload?.value || 0) / total * 100).toFixed(1) : '0.0';
                                return `${value} (${percent}%)`;
                            }}
                            layout="horizontal"
                            verticalAlign="bottom"
                            align="center"
                            wrapperStyle={{ paddingTop: '10px' }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );

    if (!loaded) {
        return null;
    }

    return (
        <div className={styles.pieChartsWrapper}>
            {renderChart("Spend by category", categoryData, categoryTotal)}
            {renderChart("Spend by method", paymentData, paymentTotal)}
        </div>
    );
};

export default CompositionCharts;
