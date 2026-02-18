
import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend
} from 'recharts';
import { Movement, Product, Collaborator, Unit } from '../types';

interface DashboardProps {
  unit: Unit;
  movements: Movement[];
  products: Product[];
  collaborators: Collaborator[];
}

const Dashboard: React.FC<DashboardProps> = ({ unit, movements, products, collaborators }) => {
  const currentMonth = new Date().toLocaleString('pt-br', { month: 'long', year: 'numeric' });
  const unitMovements = movements.filter(m => m.unit === unit);

  // Paleta de Cores Expandida para Diferenciação
  const COLORS = [
    '#14213D', '#FCA311', '#00A8E8', '#007EA7', '#003459', 
    '#8D99AE', '#EF233C', '#D90429', '#2B2D42', '#8AC926',
    '#1982C4', '#6A4C93', '#FF595E', '#FFCA3A', '#4267B2'
  ];

  // Cálculo de Consumo por Produto (Soma das Quantidades)
  const productQuantities = unitMovements.reduce((acc, m) => {
    acc[m.productId] = (acc[m.productId] || 0) + m.quantity;
    return acc;
  }, {} as Record<string, number>);

  // Ranking de Produtos (Top 8 que mais saíram)
  const productRankingData = Object.entries(productQuantities)
    .map(([id, qty]) => ({
      name: products.find(p => p.id === id)?.name.toUpperCase() || 'DESCONHECIDO',
      quantidade: qty as number,
      shortName: (products.find(p => p.id === id)?.name || '').substring(0, 15) + '...'
    }))
    .sort((a, b) => (b.quantidade as number) - (a.quantidade as number))
    .slice(0, 8);

  // Consumo por Colaborador
  const collaboratorVolume = unitMovements.reduce((acc, m) => {
    acc[m.collaboratorId] = (acc[m.collaboratorId] || 0) + m.quantity;
    return acc;
  }, {} as Record<string, number>);

  const collaboratorData = Object.entries(collaboratorVolume)
    .map(([id, qty]) => ({
      name: (collaborators.find(c => c.id === id)?.name || 'Outro').split(' ')[0],
      total: qty as number
    }))
    .sort((a, b) => (b.total as number) - (a.total as number))
    .slice(0, 5);

  // Giro por Categoria
  const categoryDataMap = unitMovements.reduce((acc, m) => {
    const p = products.find(prod => prod.id === m.productId);
    const cat = p?.category || 'Outros';
    acc[cat] = (acc[cat] || 0) + m.quantity;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(categoryDataMap)
    .map(([name, value]) => ({ name: name.toUpperCase(), value: value as number }))
    .sort((a, b) => (b.value as number) - (a.value as number));

  const IndicatorCard = ({ title, value, subtext, highlight = false }: { title: string, value: string | number, subtext: string, highlight?: boolean }) => (
    <div className={`bg-white border ${highlight ? 'border-[#FCA311] ring-1 ring-[#FCA311]/20' : 'border-slate-200'} p-5 sm:p-6 shadow-sm`}>
      <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400 mb-2">{title}</p>
      <div className="flex items-baseline gap-2">
        <h3 className={`text-2xl sm:text-3xl font-bold ${highlight ? 'text-[#FCA311]' : 'text-[#14213D]'}`}>{value}</h3>
      </div>
      <div className="mt-4 pt-4 border-t border-slate-100">
        <p className="text-[9px] text-slate-500 uppercase tracking-tight truncate font-medium">{subtext}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 sm:space-y-10">
      <header className="border-b border-slate-200 pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#14213D] uppercase tracking-tighter">Análise de Saídas</h1>
          <p className="text-[9px] sm:text-[10px] text-slate-500 mt-1 uppercase tracking-[0.2em] font-medium">Volumetria e Ranking de Insumos — {currentMonth}</p>
        </div>
        <div className="bg-slate-100 px-4 py-1 border border-slate-200">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Base de Dados Atualizada</span>
        </div>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <IndicatorCard 
          title="Volume Total Saído" 
          value={unitMovements.reduce((acc: number, m: Movement) => acc + m.quantity, 0)} 
          subtext="Total de itens entregues"
          highlight={true}
        />
        <IndicatorCard 
          title="Item Mais Solicitado" 
          value={productRankingData[0]?.quantidade || 0} 
          subtext={productRankingData[0]?.name || 'N/A'}
        />
        <IndicatorCard 
          title="Média por Retirada" 
          value={unitMovements.length > 0 ? (unitMovements.reduce((acc: number, m: Movement) => acc + m.quantity, 0) / unitMovements.length).toFixed(1) : 0} 
          subtext="Itens por requisição"
        />
        <IndicatorCard 
          title="Total de Requisições" 
          value={unitMovements.length} 
          subtext="Fluxo de assinaturas"
        />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 pb-10">
        {/* Ranking de Produtos */}
        <div className="bg-white border border-slate-200 p-5 sm:p-8 shadow-sm lg:col-span-2">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-8 border-b border-slate-50 pb-4 flex justify-between items-center">
            Ranking de Insumos: Maior Volume de Saída
            <span className="text-[8px] bg-slate-100 px-2 py-0.5 text-slate-400 uppercase">Top 8 Itens</span>
          </h3>
          <div className="h-80 sm:h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={productRankingData} margin={{ left: 20, right: 40, top: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" fontSize={9} hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  fontSize={8} 
                  tick={{fill: '#334155', fontWeight: 'bold'}} 
                  width={140}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}} 
                  contentStyle={{borderRadius: '0', border: '1px solid #e2e8f0', fontSize: '10px', textTransform: 'uppercase'}}
                />
                <Bar dataKey="quantidade" radius={[0, 4, 4, 0]} barSize={25}>
                  {productRankingData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Volume por Colaborador */}
        <div className="bg-white border border-slate-200 p-5 sm:p-8 shadow-sm">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-8 border-b border-slate-50 pb-4">Volume por Colaborador (Itens)</h3>
          <div className="h-72 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={collaboratorData} margin={{ top: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="1 1" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" fontSize={9} tick={{fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                <YAxis fontSize={9} tick={{fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '0', border: '1px solid #e2e8f0', fontSize: '10px', textTransform: 'uppercase'}} />
                <Bar dataKey="total" barSize={24} radius={[2, 2, 0, 0]}>
                  {collaboratorData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[(index + 5) % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Giro por Categoria - CORREÇÃO FINAL DE LAYOUT */}
        <div className="bg-white border border-slate-200 p-5 sm:p-8 shadow-sm flex flex-col min-h-[400px]">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-8 border-b border-slate-50 pb-4">Giro Total por Categoria</h3>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 0, right: 0, bottom: 60, left: 0 }}>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="45%" 
                  innerRadius={60} 
                  outerRadius={90} 
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{borderRadius: '0', border: '1px solid #e2e8f0', fontSize: '10px', textTransform: 'uppercase'}} />
                <Legend 
                  verticalAlign="bottom" 
                  align="center"
                  iconType="circle" 
                  iconSize={8}
                  layout="horizontal"
                  wrapperStyle={{ 
                    paddingTop: '20px',
                    width: '100%',
                    fontSize: '9px'
                  }}
                  formatter={(value) => <span className="text-[9px] uppercase tracking-widest font-bold text-slate-600 px-1">{value}</span>} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
