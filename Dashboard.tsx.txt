
import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area 
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Users, Package, BarChart3, 
  Calendar, Filter, ChevronDown, Award, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { Movement, Product, Collaborator, Unit } from '../types';

interface DashboardProps {
  unit: Unit;
  movements: Movement[];
  products: Product[];
  collaborators: Collaborator[];
}

const Dashboard: React.FC<DashboardProps> = ({ unit, movements, products, collaborators }) => {
  const now = new Date();
  
  // Estados de Filtro
  const [filterMonth, setFilterMonth] = useState<number | 'all'>(now.getMonth() + 1);
  const [filterYear, setFilterYear] = useState<number>(now.getFullYear());
  const [filterCollaborator, setFilterCollaborator] = useState<string>('all');
  const [filterProduct, setFilterProduct] = useState<string>('all');

  // Constantes de Layout
  const isSede = unit === 'sede';
  const theme = {
    primary: isSede ? '#14213D' : '#9A4E12',
    secondary: isSede ? '#FCA311' : '#14213D',
    bgLight: isSede ? 'bg-[#14213D]/5' : 'bg-[#9A4E12]/5',
    border: isSede ? 'border-[#14213D]/10' : 'border-[#9A4E12]/10',
    text: isSede ? 'text-[#14213D]' : 'text-[#9A4E12]',
  };

  const COLORS = [theme.primary, theme.secondary, '#00A8E8', '#EF233C', '#8AC926', '#6A4C93'];

  const months = [
    { v: 1, l: 'Janeiro' }, { v: 2, l: 'Fevereiro' }, { v: 3, l: 'Março' },
    { v: 4, l: 'Abril' }, { v: 5, l: 'Maio' }, { v: 6, l: 'Junho' },
    { v: 7, l: 'Julho' }, { v: 8, l: 'Agosto' }, { v: 9, l: 'Setembro' },
    { v: 10, l: 'Outubro' }, { v: 11, l: 'Novembro' }, { v: 12, l: 'Dezembro' }
  ];

  // 1. Filtragem de Dados
  const filteredData = useMemo(() => {
    return movements.filter(m => {
      const [d, mon, y] = m.date.split('/').map(Number);
      const matchMonth = filterMonth === 'all' || mon === filterMonth;
      const matchYear = y === filterYear;
      const matchCol = filterCollaborator === 'all' || m.collaboratorId === filterCollaborator;
      const matchProd = filterProduct === 'all' || m.productId === filterProduct;
      return matchMonth && matchYear && matchCol && matchProd;
    });
  }, [movements, filterMonth, filterYear, filterCollaborator, filterProduct]);

  // 2. Cálculos de Crescimento (KPI 4)
  const growthMetrics = useMemo(() => {
    if (filterMonth === 'all') return { val: 0, trend: 'stable' };
    
    const currentTotal = filteredData.reduce((acc, m) => acc + m.quantity, 0);
    
    const prevMonth = filterMonth === 1 ? 12 : filterMonth - 1;
    const prevYear = filterMonth === 1 ? filterYear - 1 : filterYear;
    
    const prevData = movements.filter(m => {
      const [d, mon, y] = m.date.split('/').map(Number);
      return mon === prevMonth && y === prevYear;
    });
    
    const prevTotal = prevData.reduce((acc, m) => acc + m.quantity, 0);
    
    if (prevTotal === 0) return { val: 0, trend: 'stable' };
    const diff = ((currentTotal - prevTotal) / prevTotal) * 100;
    return { 
      val: Math.abs(diff).toFixed(1), 
      trend: diff > 0 ? 'up' : diff < 0 ? 'down' : 'stable' 
    };
  }, [filteredData, movements, filterMonth, filterYear]);

  // 3. Agregações para Gráficos
  const collaboratorRanking = useMemo(() => {
    const map: Record<string, number> = {};
    filteredData.forEach(m => {
      map[m.collaboratorId] = (map[m.collaboratorId] || 0) + m.quantity;
    });
    return Object.entries(map)
      .map(([id, qty]) => ({
        name: collaborators.find(c => c.id === id)?.name.split(' ')[0].toUpperCase() || 'OUTRO',
        total: qty
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [filteredData, collaborators]);

  const productRanking = useMemo(() => {
    const map: Record<string, number> = {};
    const totalQty = filteredData.reduce((acc, m) => acc + m.quantity, 0);
    filteredData.forEach(m => {
      map[m.productId] = (map[m.productId] || 0) + m.quantity;
    });
    return Object.entries(map)
      .map(([id, qty]) => {
        const p = products.find(prod => prod.id === id);
        return {
          name: p?.name.toUpperCase() || 'DESCONHECIDO',
          value: qty,
          percent: totalQty > 0 ? ((qty / totalQty) * 100).toFixed(1) : 0
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [filteredData, products]);

  const evolutionData = useMemo(() => {
    const data = months.map(m => {
      const monthMovs = movements.filter(mov => {
        const [,, y] = mov.date.split('/').map(Number);
        const mon = parseInt(mov.date.split('/')[1]);
        return mon === m.v && y === filterYear;
      });
      return {
        name: m.l.substring(0, 3).toUpperCase(),
        total: monthMovs.reduce((acc, curr) => acc + curr.quantity, 0)
      };
    });
    return data;
  }, [movements, filterYear]);

  const accumulatedRanking = useMemo(() => {
    const map: Record<string, number> = {};
    movements.forEach(m => {
      map[m.collaboratorId] = (map[m.collaboratorId] || 0) + m.quantity;
    });
    return Object.entries(map)
      .map(([id, qty]) => ({
        name: collaborators.find(c => c.id === id)?.name.toUpperCase() || 'OUTRO',
        total: qty
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [movements, collaborators]);

  // Componentes Internos
  const KPICard = ({ title, value, sub, icon: Icon, trend }: any) => (
    <div className={`bg-white border ${theme.border} p-6 shadow-sm flex flex-col justify-between relative overflow-hidden group`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</p>
          <h3 className={`text-3xl font-black ${theme.text} tracking-tighter`}>{value}</h3>
        </div>
        <div className={`p-3 ${theme.bgLight} ${theme.text}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="flex items-center gap-2 mt-2">
        {trend && (
          <span className={`flex items-center text-[10px] font-bold uppercase px-2 py-0.5 ${trend === 'up' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
            {trend === 'up' ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
            {sub}
          </span>
        )}
        {!trend && <span className="text-[9px] text-slate-400 uppercase font-bold tracking-tight">{sub}</span>}
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* FILTROS GLOBAIS */}
      <section className="bg-white border border-slate-200 p-4 sm:p-6 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-1">
          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Período (Mês)</label>
          <div className="relative">
            <select 
              value={filterMonth} 
              onChange={(e) => setFilterMonth(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className={`w-full appearance-none bg-slate-50 border border-slate-100 px-4 py-2.5 text-[10px] font-bold uppercase outline-none focus:border-slate-300 transition-all`}
            >
              <option value="all">TODOS OS MESES</option>
              {months.map(m => <option key={m.v} value={m.v}>{m.l.toUpperCase()}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Ano Base</label>
          <div className="relative">
            <select 
              value={filterYear} 
              onChange={(e) => setFilterYear(Number(e.target.value))}
              className="w-full appearance-none bg-slate-50 border border-slate-100 px-4 py-2.5 text-[10px] font-bold uppercase outline-none focus:border-slate-300 transition-all"
            >
              {[2024, 2025].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Colaborador</label>
          <div className="relative">
            <select 
              value={filterCollaborator} 
              onChange={(e) => setFilterCollaborator(e.target.value)}
              className="w-full appearance-none bg-slate-50 border border-slate-100 px-4 py-2.5 text-[10px] font-bold uppercase outline-none focus:border-slate-300 transition-all"
            >
              <option value="all">TODOS</option>
              {collaborators.map(c => <option key={c.id} value={c.id}>{c.name.toUpperCase()}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Material</label>
          <div className="relative">
            <select 
              value={filterProduct} 
              onChange={(e) => setFilterProduct(e.target.value)}
              className="w-full appearance-none bg-slate-50 border border-slate-100 px-4 py-2.5 text-[10px] font-bold uppercase outline-none focus:border-slate-300 transition-all"
            >
              <option value="all">TODOS OS ITENS</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name.toUpperCase()}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </section>

      {/* CARDS INDICADORES (KPIs) */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <KPICard 
          title="Total Retirado" 
          value={filteredData.reduce((acc, m) => acc + m.quantity, 0)} 
          sub="Volume total no período" 
          icon={Package} 
        />
        <KPICard 
          title="Líder de Retirada" 
          value={collaboratorRanking[0]?.name || 'N/A'} 
          sub="Maior volume solicitado" 
          icon={Users} 
        />
        <KPICard 
          title="Item Mais Saído" 
          value={productRanking[0]?.value || 0} 
          sub={productRanking[0]?.name || 'Nenhum'} 
          icon={BarChart3} 
        />
        <KPICard 
          title="Crescimento" 
          value={growthMetrics.val + '%'} 
          sub={`${growthMetrics.val}% vs Mês Anterior`} 
          trend={growthMetrics.trend}
          icon={growthMetrics.trend === 'up' ? TrendingUp : TrendingDown}
        />
      </section>

      {/* GRÁFICOS PRINCIPAIS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Ranking de Colaboradores */}
        <div className="bg-white border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="flex justify-between items-center mb-10 border-b border-slate-50 pb-4">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Ranking: Colaboradores do Mês</h3>
            <Award className={`w-4 h-4 ${theme.text}`} />
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={collaboratorRanking} margin={{ left: 10, right: 30 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={80} fontSize={9} tick={{fill: '#64748b', fontWeight: 'bold'}} axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{fontSize: '10px', borderRadius: '0', border: '1px solid #e2e8f0'}} />
                <Bar dataKey="total" fill={theme.primary} radius={[0, 4, 4, 0]} barSize={20} label={{ position: 'right', fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Ranking de Materiais */}
        <div className="bg-white border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="flex justify-between items-center mb-10 border-b border-slate-50 pb-4">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Ranking: Materiais mais Retirados</h3>
            <Package className={`w-4 h-4 ${theme.text}`} />
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={productRanking} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                  {productRanking.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{fontSize: '10px', borderRadius: '0'}} />
                <Legend layout="vertical" align="right" verticalAlign="middle" iconType="circle" formatter={(value, entry: any) => <span className="text-[9px] uppercase font-bold text-slate-500">{value} ({entry.payload.percent}%)</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Evolução Mensal */}
        <div className="bg-white border border-slate-200 p-6 sm:p-8 shadow-sm lg:col-span-2">
          <div className="flex justify-between items-center mb-10 border-b border-slate-50 pb-4">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Evolução de Consumo Mensal — {filterYear}</h3>
            <Calendar className={`w-4 h-4 ${theme.text}`} />
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={evolutionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={theme.primary} stopOpacity={0.1}/>
                    <stop offset="95%" stopColor={theme.primary} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="1 1" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" fontSize={9} axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                <YAxis fontSize={9} axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                <Tooltip contentStyle={{fontSize: '10px', borderRadius: '0'}} />
                <Area type="monotone" dataKey="total" stroke={theme.primary} strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* RANKING ACUMULADO GERAL */}
      <section className="bg-white border border-slate-200 p-6 sm:p-10 shadow-sm">
        <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-6">
          <Award className={`w-5 h-5 ${theme.text}`} />
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-800">Ranking Geral Acumulado (Histórico Total)</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Top Colaboradores (Total Histórico)</p>
            <div className="space-y-4">
              {accumulatedRanking.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${idx === 0 ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'}`}>{idx + 1}</span>
                    <span className="text-[10px] font-bold text-slate-700 uppercase group-hover:text-slate-900 transition-colors">{item.name}</span>
                  </div>
                  <span className="text-[10px] font-black text-slate-400">{item.total} ITENS</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-slate-50/50 p-6 border-l-4 border-slate-200">
             <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-4">Insights Gerenciais</h4>
             <p className="text-[10px] text-slate-500 leading-relaxed uppercase font-medium">
               O colaborador <strong className={theme.text}>{accumulatedRanking[0]?.name}</strong> lidera o consumo histórico com um total de <strong className={theme.text}>{accumulatedRanking[0]?.total}</strong> requisições atendidas. Este ranking considera todos os registros salvos no banco de dados até o momento.
             </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
