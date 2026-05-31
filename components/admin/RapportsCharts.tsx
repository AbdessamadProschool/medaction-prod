'use client';

import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

const COLORS = [
  'hsl(var(--gov-blue))',
  'hsl(var(--gov-green))',
  'hsl(var(--gov-yellow))',
  'hsl(var(--gov-red))',
  'hsl(var(--gov-muted))',
  '#8B5CF6'
];

export function ReclamationsStatusPieChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={8}
          dataKey="count"
          nameKey="statut"
          stroke="none"
        >
          {data?.map((entry: any, index: number) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'hsl(var(--card))', 
            border: '1px solid hsl(var(--border))', 
            borderRadius: '16px',
            fontSize: '12px',
            fontWeight: 'bold',
            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
          }}
        />
        <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function ReclamationsEvolutionAreaChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--gov-blue))" stopOpacity={0.1}/>
            <stop offset="95%" stopColor="hsl(var(--gov-blue))" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
        <XAxis 
          dataKey="date" 
          axisLine={false} 
          tickLine={false} 
          tick={{ fontSize: 10, fontWeight: 'bold', fill: 'hsl(var(--muted-foreground))' }} 
        />
        <YAxis 
          axisLine={false} 
          tickLine={false} 
          tick={{ fontSize: 10, fontWeight: 'bold', fill: 'hsl(var(--muted-foreground))' }} 
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'hsl(var(--card))', 
            border: '1px solid hsl(var(--border))', 
            borderRadius: '16px',
            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
          }}
        />
        <Area 
          type="monotone" 
          dataKey="count" 
          stroke="hsl(var(--gov-blue))" 
          strokeWidth={3} 
          fillOpacity={1} 
          fill="url(#colorCount)" 
          activeDot={{ r: 6, strokeWidth: 0, fill: 'hsl(var(--gov-blue))' }} 
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function ReclamationsCommuneBarChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
      <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
        <XAxis 
          type="number" 
          axisLine={false} 
          tickLine={false} 
          tick={{ fontSize: 10, fontWeight: 'bold', fill: 'hsl(var(--muted-foreground))' }} 
        />
        <YAxis 
          dataKey="commune" 
          type="category" 
          width={100} 
          axisLine={false} 
          tickLine={false} 
          tick={{ fontSize: 10, fontWeight: 'bold', fill: 'hsl(var(--muted-foreground))' }} 
        />
        <Tooltip 
          cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
          contentStyle={{ 
            backgroundColor: 'hsl(var(--card))', 
            border: '1px solid hsl(var(--border))', 
            borderRadius: '16px',
            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
          }}
        />
        <Bar dataKey="count" fill="hsl(var(--gov-blue))" radius={[0, 10, 10, 0]} barSize={24} />
      </BarChart>
    </ResponsiveContainer>
  );
}
