
import React, { useState, useMemo } from 'react';
import { Download, FileText, Printer, FileSpreadsheet, Loader2, CheckCircle, Calendar, ChevronDown } from 'lucide-react';
import { Unit, Movement, Product, Collaborator, StockStaff } from '../types';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

interface ReportsProps {
  unit: Unit;
  movements: Movement[];
  products: Product[];
  collaborators: Collaborator[];
  stockStaff: StockStaff[];
}

const Reports: React.FC<ReportsProps> = ({ unit, movements, products, collaborators, stockStaff }) => {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [generating, setGenerating] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const months = [
    { value: 1, label: 'Janeiro' }, { value: 2, label: 'Fevereiro' }, { value: 3, label: 'Março' },
    { value: 4, label: 'Abril' }, { value: 5, label: 'Maio' }, { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' }, { value: 8, label: 'Agosto' }, { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' }, { value: 11, label: 'Novembro' }, { value: 12, label: 'Dezembro' }
  ];

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

  // Filtra movimentos pelo mês e ano selecionados
  const filteredMovements = useMemo(() => {
    return movements.filter(m => {
      if (m.unit !== unit) return false;
      const [day, month, year] = m.date.split('/').map(Number);
      return month === selectedMonth && year === selectedYear;
    }).sort((a, b) => {
      const dateA = new Date(`${a.date.split('/').reverse().join('-')} ${a.time}`);
      const dateB = new Date(`${b.date.split('/').reverse().join('-')} ${b.time}`);
      return dateA.getTime() - dateB.getTime(); // Ordem cronológica para o relatório
    });
  }, [movements, unit, selectedMonth, selectedYear]);

  const getCollaboratorName = (id: string) => collaborators.find(c => c.id === id)?.name || id;
  const getProductName = (id: string) => products.find(p => p.id === id)?.name || id;
  const getStaffName = (id: string) => stockStaff.find(s => s.id === id)?.name || id;

  const monthLabel = months.find(m => m.value === selectedMonth)?.label;
  const periodLabel = `${monthLabel?.toUpperCase()} ${selectedYear}`;
  const lastDayOfMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const dateRange = `01/${selectedMonth.toString().padStart(2, '0')}/${selectedYear} a ${lastDayOfMonth}/${selectedMonth.toString().padStart(2, '0')}/${selectedYear}`;

  const handleDownloadCSV = () => {
    setGenerating('csv');
    setTimeout(() => {
      let csvContent = "\ufeffRelatorio Mensal de Logistica - Unidade " + unit.toUpperCase() + "\n";
      csvContent += "Periodo: " + dateRange + "\n\n";
      csvContent += "Data;Hora;Colaborador;Produto;Quantidade;Responsavel\n";
      
      filteredMovements.forEach(m => {
        const row = [
          m.date,
          m.time,
          getCollaboratorName(m.collaboratorId),
          getProductName(m.productId),
          m.quantity,
          getStaffName(m.stockStaffId)
        ].join(';');
        csvContent += row + "\n";
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Relatorio_${unit.toUpperCase()}_${selectedMonth}_${selectedYear}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setGenerating(null);
      setDone(true);
      setTimeout(() => setDone(false), 3000);
    }, 800);
  };

  const handleDownloadPDF = () => {
    setGenerating('pdf');
    setTimeout(() => {
      try {
        const doc = new jsPDF();
        const timestamp = new Date().toLocaleString('pt-br');
        
        doc.setFontSize(18);
        doc.setTextColor(20, 33, 61);
        doc.text('ASSEFAZ LOGÍSTICA', 14, 22);
        
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.text(`UNIDADE: ${unit.toUpperCase()}`, 14, 28);
        doc.text(`PERÍODO: ${dateRange}`, 14, 33);
        doc.text(`GERADO EM: ${timestamp}`, 14, 38);

        doc.setDrawColor(226, 232, 240);
        doc.line(14, 42, 196, 42);

        const tableData = filteredMovements.map(m => [
          `${m.date} ${m.time}`,
          getCollaboratorName(m.collaboratorId).toUpperCase(),
          getProductName(m.productId).toUpperCase(),
          m.quantity.toString(),
          getStaffName(m.stockStaffId).toUpperCase()
        ]);

        (doc as any).autoTable({
          startY: 48,
          head: [['DATA/HORA', 'COLABORADOR', 'PRODUTO', 'QTD', 'RESPONSÁVEL']],
          body: tableData,
          headStyles: { fillColor: [20, 33, 61], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
          bodyStyles: { fontSize: 7, textColor: [51, 65, 85] },
          alternateRowStyles: { fillColor: [248, 250, 252] },
          margin: { top: 48 }
        });

        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          doc.setFontSize(8);
          doc.setTextColor(148, 163, 184);
          doc.text(`Página ${i} de ${pageCount} - Documento de controle interno Assefaz`, 105, 285, { align: 'center' });
        }

        doc.save(`Relatorio_${unit.toUpperCase()}_${selectedMonth}_${selectedYear}.pdf`);
      } catch (error) {
        console.error("Erro ao gerar PDF:", error);
        alert("Erro ao gerar PDF.");
      }
      setGenerating(null);
      setDone(true);
      setTimeout(() => setDone(false), 3000);
    }, 1000);
  };

  const theme = {
    badgeText: unit === 'sede' ? 'text-[#14213D]' : 'text-[#9A4E12]',
    primaryIcon: unit === 'sede' ? 'text-[#14213D]' : 'text-[#9A4E12]',
    primaryFocus: unit === 'sede' ? 'focus:border-[#14213D]' : 'focus:border-[#9A4E12]',
  };

  const selectClass = `appearance-none bg-white border border-slate-200 px-10 py-2.5 text-[10px] font-bold uppercase tracking-widest outline-none ${theme.primaryFocus} shadow-sm transition-all min-w-[160px] cursor-pointer`;

  return (
    <div className="space-y-6 sm:space-y-10 pb-10">
      <header className="border-b border-slate-200 pb-6 print:hidden">
        <h1 className="text-xl sm:text-2xl font-bold text-[#14213D] uppercase tracking-tighter">Emissão de Relatórios</h1>
        <p className="text-[9px] sm:text-[10px] text-slate-500 mt-1 uppercase tracking-[0.2em] font-medium">Documentação Oficial Mensal</p>
      </header>

      {/* Seletor de Período */}
      <div className="flex flex-col sm:flex-row gap-4 print:hidden">
        <div className="relative flex-1 sm:flex-none">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
          <select 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(Number(e.target.value))} 
            className={selectClass}
          >
            {months.map(m => <option key={m.value} value={m.value}>{m.label.toUpperCase()}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5 pointer-events-none" />
        </div>

        <div className="relative flex-1 sm:flex-none">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(Number(e.target.value))} 
            className={selectClass}
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5 pointer-events-none" />
        </div>
      </div>

      <div className="bg-white border border-slate-200 p-8 sm:p-16 flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden">
        {done && (
          <div className="absolute top-4 right-4 animate-in slide-in-from-right-4 duration-300 print:hidden">
             <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-2 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
               <CheckCircle className="w-3 h-3" /> Concluído
             </div>
          </div>
        )}

        <div className="bg-slate-50 w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center border border-slate-100 mb-6 sm:mb-8 shrink-0 print:hidden">
          <FileText className={`w-10 h-10 sm:w-12 sm:h-12 ${theme.primaryIcon} opacity-80`} />
        </div>
        
        <div className="mb-8 sm:mb-12">
          <h2 className="text-lg sm:text-xl font-bold text-slate-800 uppercase tracking-tighter mb-2">Relatório Consolidado de Insumos</h2>
          <div className="flex flex-col gap-2 items-center">
            <p className={`text-[9px] sm:text-[10px] uppercase tracking-[0.2em] font-bold border border-slate-100 px-4 py-1 inline-block ${theme.badgeText}`}>
              Unidade ASSEFAZ {unit.toUpperCase()}
            </p>
            <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest">
              {periodLabel}
            </p>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-6 max-w-sm mx-auto leading-relaxed print:hidden">
            Documento abrangendo de {dateRange}. Total de {filteredMovements.length} movimentações localizadas no período.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 w-full max-w-2xl border border-slate-100 print:hidden">
          <button 
            onClick={handleDownloadPDF}
            disabled={!!generating || filteredMovements.length === 0}
            className="flex flex-col items-center gap-3 p-8 sm:p-10 bg-white hover:bg-slate-50 border-b md:border-b-0 md:border-r border-slate-100 transition-all group disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {generating === 'pdf' ? (
              <Loader2 className="w-5 h-5 text-[#14213D] animate-spin" />
            ) : (
              <Download className="w-5 h-5 text-slate-300 group-hover:text-[#14213D] transition-colors" />
            )}
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">PDF Oficial</span>
          </button>
          
          <button 
            onClick={handleDownloadCSV}
            disabled={!!generating || filteredMovements.length === 0}
            className="flex flex-col items-center gap-3 p-8 sm:p-10 bg-white hover:bg-slate-50 border-b md:border-b-0 md:border-r border-slate-100 transition-all group disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {generating === 'csv' ? (
              <Loader2 className="w-5 h-5 text-[#14213D] animate-spin" />
            ) : (
              <FileSpreadsheet className="w-5 h-5 text-slate-300 group-hover:text-[#14213D] transition-colors" />
            )}
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">Planilha Excel</span>
          </button>

          <button 
            onClick={() => window.print()}
            disabled={filteredMovements.length === 0}
            className="flex flex-col items-center gap-3 p-8 sm:p-10 bg-white hover:bg-slate-50 transition-all group disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Printer className="w-5 h-5 text-slate-300 group-hover:text-[#14213D] transition-colors" />
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">Imprimir</span>
          </button>
        </div>

        {/* Visualização de Impressão (Apenas Ctrl+P) */}
        <div className="hidden print:block text-left w-full mt-10">
           <div className="mb-10 border-b-2 border-slate-900 pb-4">
              <h3 className="text-2xl font-bold uppercase tracking-tighter">Relatório de Logística - Unidade {unit.toUpperCase()}</h3>
              <p className="text-xs uppercase font-bold text-slate-600">Período: {dateRange}</p>
              <p className="text-[9px] uppercase text-slate-400">Emissão: {new Date().toLocaleString('pt-br')}</p>
           </div>
           <table className="w-full text-[9px] border-collapse">
             <thead>
               <tr className="border-b-2 border-slate-900 bg-slate-100">
                 <th className="py-2 px-1 text-left uppercase font-bold">Data/Hora</th>
                 <th className="py-2 px-1 text-left uppercase font-bold">Solicitante</th>
                 <th className="py-2 px-1 text-left uppercase font-bold">Produto</th>
                 <th className="py-2 px-1 text-center uppercase font-bold">Qtd</th>
                 <th className="py-2 px-1 text-right uppercase font-bold">Responsável</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-200">
               {filteredMovements.length > 0 ? (
                 filteredMovements.map(m => (
                   <tr key={m.id}>
                     <td className="py-2 px-1 whitespace-nowrap">{m.date} {m.time}</td>
                     <td className="py-2 px-1 uppercase font-medium">{getCollaboratorName(m.collaboratorId)}</td>
                     <td className="py-2 px-1 uppercase">{getProductName(m.productId)}</td>
                     <td className="py-2 px-1 text-center font-bold">{m.quantity}</td>
                     <td className="py-2 px-1 text-right uppercase text-slate-500">{getStaffName(m.stockStaffId)}</td>
                   </tr>
                 ))
               ) : (
                 <tr>
                   <td colSpan={5} className="py-10 text-center uppercase font-bold text-slate-300 tracking-widest">Nenhum registro no período</td>
                 </tr>
               )}
             </tbody>
           </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
