// src/components/overview-chart.tsx
"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { Appointment } from "@/lib/firebase/firestore";
import { subDays, format } from 'date-fns';

interface OverviewChartProps {
    data: Appointment[];
}

export function OverviewChart({ data }: OverviewChartProps) {
    const chartData = Array.from({ length: 7 }, (_, i) => {
        const date = subDays(new Date(), i);
        return {
            name: format(date, 'MMM d'),
            total: 0,
        };
    }).reverse();

    data.forEach(appointment => {
        const appointmentDateStr = format(new Date(appointment.dateTime), 'MMM d');
        const dayData = chartData.find(d => d.name === appointmentDateStr);
        if (dayData && appointment.paymentStatus === 'Paid' && appointment.amountPaid) {
            dayData.total += appointment.amountPaid;
        }
    });

    return (
        <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData}>
                <XAxis
                    dataKey="name"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                />
                <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `PKR ${value}`}
                />
                <Tooltip 
                    cursor={{ fill: 'hsl(var(--muted))' }}
                    contentStyle={{ 
                        background: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 'var(--radius)' 
                    }}
                />
                <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
}
