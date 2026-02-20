
import React, { useState, useMemo } from 'react';
import { Download, FileText, Printer, FileSpreadsheet, Loader2, CheckCircle, Calendar, ChevronDown, AlertCircle } from 'lucide-react';
import { Unit, Movement, Product, Sector, StockStaff, Entry } from '../types';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

interface ReportsProps {
  unit: Unit;
  movements: Movement[];
  entries: Entry[];
  products: Product[];
  sectors: Sector[];
  stockStaff: StockStaff[];
}

const Reports: React.FC<ReportsProps> = ({ unit, movements, entries, products, sectors, stockStaff }) => {
  const now = new Date();
  const [activeTab, setActiveTab] = useState<'outflows' | 'entries'>('outflows');
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

  // --- LÓGICA DE CÁLCULO DE MÉTRICAS (Igual ao Dashboard para integridade) ---
  
  const filteredMovements = useMemo(() => {
    return movements.filter(m => {
      if (m.unit !== unit) return false;
      const [, month, year] = m.date.split('/').map(Number);
      return month === selectedMonth && year === selectedYear;
    }).sort((a, b) => {
      const dateA = new Date(`${a.date.split('/').reverse().join('-')} ${a.time}`);
      const dateB = new Date(`${b.date.split('/').reverse().join('-')} ${b.time}`);
      return dateA.getTime() - dateB.getTime();
    });
  }, [movements, unit, selectedMonth, selectedYear]);

  const filteredEntries = useMemo(() => {
    return entries.filter(e => {
      if (e.unit !== unit) return false;
      const [, month, year] = e.date.split('/').map(Number);
      return month === selectedMonth && year === selectedYear;
    }).sort((a, b) => {
      const dateA = new Date(`${a.date.split('/').reverse().join('-')} ${a.time}`);
      const dateB = new Date(`${b.date.split('/').reverse().join('-')} ${b.time}`);
      return dateA.getTime() - dateB.getTime();
    });
  }, [entries, unit, selectedMonth, selectedYear]);

  const stats = useMemo(() => {
    const totalQty = filteredMovements.reduce((acc, m) => acc + m.quantity, 0);
    
    // Rankings Período
    const secMap: Record<string, number> = {};
    const prodMap: Record<string, number> = {};
    filteredMovements.forEach(m => {
      secMap[m.sectorId] = (secMap[m.sectorId] || 0) + m.quantity;
      prodMap[m.productId] = (prodMap[m.productId] || 0) + m.quantity;
    });

    const secRanking = Object.entries(secMap)
      .map(([id, qty]) => ({ name: sectors.find(s => s.id === id)?.name || id, total: qty }))
      .sort((a, b) => b.total - a.total).slice(0, 5);

    const prodRanking = Object.entries(prodMap)
      .map(([id, qty]) => {
        const p = products.find(prod => prod.id === id);
        return { name: p?.name || id, value: qty, percent: totalQty > 0 ? ((qty / totalQty) * 100).toFixed(1) : "0" };
      })
      .sort((a, b) => b.value - a.value).slice(0, 5);

    // Crescimento
    const prevMonth = selectedMonth === 1 ? 12 : selectedMonth - 1;
    const prevYear = selectedMonth === 1 ? selectedYear - 1 : selectedYear;
    const prevTotal = movements.filter(m => {
      const [, mon, y] = m.date.split('/').map(Number);
      return m.unit === unit && mon === prevMonth && y === prevYear;
    }).reduce((acc, m) => acc + m.quantity, 0);

    const growth = prevTotal === 0 ? 0 : ((totalQty - prevTotal) / prevTotal) * 100;

    // Acumulado Geral
    const accSecMap: Record<string, number> = {};
    movements.filter(m => m.unit === unit).forEach(m => {
      accSecMap[m.sectorId] = (accSecMap[m.sectorId] || 0) + m.quantity;
    });
    const accRanking = Object.entries(accSecMap)
      .map(([id, qty]) => ({ name: sectors.find(s => s.id === id)?.name || id, total: qty }))
      .sort((a, b) => b.total - a.total).slice(0, 5);

    return { totalQty, secRanking, prodRanking, growth, accRanking, prevTotal };
  }, [filteredMovements, movements, unit, selectedMonth, selectedYear, sectors, products]);

  const entryStats = useMemo(() => {
    const totalQty = filteredEntries.reduce((acc, e) => acc + e.quantity, 0);
    const totalValue = filteredEntries.reduce((acc, e) => acc + (e.quantity * e.unitPrice), 0);
    return { totalQty, totalValue };
  }, [filteredEntries]);

  // --- FUNÇÕES DE EXPORTAÇÃO ---

  const getSectorName = (id: string) => sectors.find(s => s.id === id)?.name || id;
  const getProductName = (id: string) => products.find(p => p.id === id)?.name || id;
  const getStaffName = (id: string) => stockStaff.find(s => s.id === id)?.name || id;

  const monthLabel = months.find(m => m.value === selectedMonth)?.label;
  const periodLabel = `${monthLabel?.toUpperCase()} ${selectedYear}`;
  const lastDayOfMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const dateRange = `01/${selectedMonth.toString().padStart(2, '0')}/${selectedYear} a ${lastDayOfMonth}/${selectedMonth.toString().padStart(2, '0')}/${selectedYear}`;

  const handleDownloadPDF = () => {
    setGenerating('pdf');
    setTimeout(() => {
      try {
        const doc = new jsPDF();
        const primaryColor = unit === 'sede' ? [20, 33, 61] : [154, 78, 18]; // Azul Navy vs Laranja Brown
        
        // 1. Cabeçalho Principal
        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.rect(0, 0, 210, 40, 'F');
        
        doc.setFontSize(22);
        doc.setTextColor(255, 255, 255);
        doc.text('ASSEFAZ LOGÍSTICA', 14, 20);
        
        doc.setFontSize(10);
        doc.text(`RELATÓRIO GERENCIAL DE CONSUMO (SAÍDAS) - UNIDADE ${unit.toUpperCase()}`, 14, 28);
        doc.text(`PERÍODO: ${periodLabel}`, 14, 34);

        // 2. Quadro de Indicadores (KPIs)
        let currentY = 50;
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setFontSize(12);
        doc.text('RESUMO DE INDICADORES (KPIs)', 14, currentY);
        doc.line(14, currentY + 2, 196, currentY + 2);

        (doc as any).autoTable({
          startY: currentY + 6,
          head: [['TOTAL RETIRADO', 'SETOR LÍDER', 'ITEM MAIS SAÍDO', 'CRESCIMENTO']],
          body: [[
            stats.totalQty,
            stats.secRanking[0]?.name.toUpperCase() || 'N/A',
            stats.prodRanking[0]?.name.toUpperCase() || 'N/A',
            `${stats.growth.toFixed(1)}%`
          ]],
          theme: 'grid',
          headStyles: { fillColor: [241, 245, 249], textColor: [71, 85, 105], fontSize: 8 },
          bodyStyles: { fontSize: 10, fontStyle: 'bold', textColor: primaryColor }
        });

        // 3. Rankings do Mês
        currentY = (doc as any).lastAutoTable.finalY + 15;
        doc.setFontSize(12);
        doc.text('RANKINGS DE CONSUMO MENSAL', 14, currentY);
        
        // Setores
        (doc as any).autoTable({
          startY: currentY + 5,
          head: [['RANK', 'TOP 5 SETORES', 'QTD TOTAL']],
          body: stats.secRanking.map((c, i) => [i + 1, c.name.toUpperCase(), c.total]),
          headStyles: { fillColor: primaryColor, fontSize: 8 },
          columnStyles: { 0: { cellWidth: 15 }, 2: { cellWidth: 30, halign: 'right' } }
        });

        // Materiais
        (doc as any).autoTable({
          startY: (doc as any).lastAutoTable.finalY + 5,
          head: [['RANK', 'TOP 5 MATERIAIS MAIS RETIRADOS', 'QTD', '% DO TOTAL']],
          body: stats.prodRanking.map((p, i) => [i + 1, p.name.toUpperCase(), p.value, `${p.percent}%`]),
          headStyles: { fillColor: primaryColor, fontSize: 8 },
          columnStyles: { 0: { cellWidth: 15 }, 2: { cellWidth: 20 }, 3: { cellWidth: 30, halign: 'right' } }
        });

        // 4. Ranking Geral Acumulado (Integridade Histórica)
        currentY = (doc as any).lastAutoTable.finalY + 15;
        if (currentY > 240) { doc.addPage(); currentY = 20; }
        doc.setFontSize(12);
        doc.text('RANKING GERAL ACUMULADO (HISTÓRICO)', 14, currentY);
        (doc as any).autoTable({
          startY: currentY + 5,
          head: [['RANK', 'SETOR (HISTÓRICO TOTAL)', 'TOTAL ACUMULADO']],
          body: stats.accRanking.map((c, i) => [i + 1, c.name.toUpperCase(), c.total]),
          headStyles: { fillColor: [71, 85, 105], fontSize: 8 },
          columnStyles: { 0: { cellWidth: 15 }, 2: { cellWidth: 40, halign: 'right' } }
        });

        // 5. Histórico Detalhado (Obrigatório)
        doc.addPage();
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setFontSize(14);
        doc.text('ANEXO: HISTÓRICO COMPLETO DE MOVIMENTAÇÕES', 14, 20);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(`Listagem integral cronológica para auditoria do período ${dateRange}`, 14, 25);

        (doc as any).autoTable({
          startY: 30,
          head: [['DATA/HORA', 'SETOR', 'MATERIAL RETIRADO', 'QTD', 'UNIDADE', 'RESPONSÁVEL']],
          body: filteredMovements.map(m => [
            `${m.date} ${m.time}`,
            getSectorName(m.sectorId).toUpperCase(),
            getProductName(m.productId).toUpperCase(),
            m.quantity.toString(),
            (products.find(p => p.id === m.productId)?.unit || 'UN').toUpperCase(),
            getStaffName(m.stockStaffId).toUpperCase()
          ]),
          headStyles: { fillColor: primaryColor, fontSize: 8 },
          bodyStyles: { fontSize: 7 },
          alternateRowStyles: { fillColor: [248, 250, 252] }
        });

        // Rodapé de Todas as Páginas
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          doc.setFontSize(8);
          doc.setTextColor(148, 163, 184);
          doc.text(`Página ${i} de ${pageCount} - Documento oficial de controle Assefaz - Gerado em ${new Date().toLocaleString('pt-br')}`, 105, 285, { align: 'center' });
        }

        doc.save(`Relatorio_Integrado_${unit.toUpperCase()}_${selectedMonth}_${selectedYear}.pdf`);
      } catch (error) {
        console.error("Erro ao gerar PDF:", error);
        alert("Erro ao processar a integridade do relatório.");
      }
      setGenerating(null);
      setDone(true);
      setTimeout(() => setDone(false), 3000);
    }, 1200);
  };

  const handleDownloadEntriesPDF = () => {
    setGenerating('pdf-entries');
    setTimeout(() => {
      try {
        const doc = new jsPDF();
        const primaryColor = [5, 150, 105]; // Emerald-600 para Entradas
        
        // 1. Cabeçalho Principal
        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.rect(0, 0, 210, 40, 'F');
        
        doc.setFontSize(22);
        doc.setTextColor(255, 255, 255);
        doc.text('ASSEFAZ LOGÍSTICA', 14, 20);
        
        doc.setFontSize(10);
        doc.text(`RELATÓRIO GERENCIAL DE RECEBIMENTO (ENTRADAS) - UNIDADE ${unit.toUpperCase()}`, 14, 28);
        doc.text(`PERÍODO: ${periodLabel}`, 14, 34);

        // 2. Quadro de Indicadores
        let currentY = 50;
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setFontSize(12);
        doc.text('RESUMO DE RECEBIMENTO', 14, currentY);
        doc.line(14, currentY + 2, 196, currentY + 2);

        (doc as any).autoTable({
          startY: currentY + 6,
          head: [['TOTAL DE ITENS RECEBIDOS', 'VALOR TOTAL EM PRODUTOS']],
          body: [[
            entryStats.totalQty,
            `R$ ${entryStats.totalValue.toLocaleString('pt-br', { minimumFractionDigits: 2 })}`
          ]],
          theme: 'grid',
          headStyles: { fillColor: [241, 245, 249], textColor: [71, 85, 105], fontSize: 8 },
          bodyStyles: { fontSize: 10, fontStyle: 'bold', textColor: primaryColor }
        });

        // 3. Histórico Detalhado
        currentY = (doc as any).lastAutoTable.finalY + 15;
        doc.setFontSize(12);
        doc.text('HISTÓRICO DETALHADO DE ENTRADAS', 14, currentY);

        (doc as any).autoTable({
          startY: currentY + 5,
          head: [['DATA/HORA', 'MATERIAL RECEBIDO', 'V. UNIT', 'QTD', 'TOTAL ITEM', 'RESPONSÁVEL']],
          body: filteredEntries.map(e => [
            `${e.date} ${e.time}`,
            getProductName(e.productId).toUpperCase(),
            `R$ ${e.unitPrice.toFixed(2)}`,
            e.quantity.toString(),
            `R$ ${(e.quantity * e.unitPrice).toFixed(2)}`,
            getStaffName(e.stockStaffId).toUpperCase()
          ]),
          headStyles: { fillColor: primaryColor, fontSize: 8 },
          bodyStyles: { fontSize: 7 },
          alternateRowStyles: { fillColor: [248, 250, 252] }
        });

        // Rodapé
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          doc.setFontSize(8);
          doc.setTextColor(148, 163, 184);
          doc.text(`Página ${i} de ${pageCount} - Documento oficial de controle Assefaz - Gerado em ${new Date().toLocaleString('pt-br')}`, 105, 285, { align: 'center' });
        }

        doc.save(`Relatorio_Entradas_${unit.toUpperCase()}_${selectedMonth}_${selectedYear}.pdf`);
      } catch (error) {
        console.error("Erro ao gerar PDF de entradas:", error);
        alert("Erro ao processar o relatório de entradas.");
      }
      setGenerating(null);
      setDone(true);
      setTimeout(() => setDone(false), 3000);
    }, 1200);
  };

  const handleDownloadCSV = () => {
    setGenerating('csv');
    setTimeout(() => {
      let csvContent = "\ufeffRELATORIO CONSOLIDADO ASSEFAZ - UNIDADE " + unit.toUpperCase() + "\n";
      csvContent += "PERIODO: " + dateRange + "\n";
      
      if (activeTab === 'outflows') {
        csvContent += "TOTAL NO PERIODO: " + stats.totalQty + "\n\n";
        csvContent += "HISTORICO DE SAIDAS\n";
        csvContent += "Data;Hora;Setor;Produto;Quantidade;Responsavel\n";
        
        filteredMovements.forEach(m => {
          csvContent += [
            m.date, m.time,
            getSectorName(m.sectorId),
            getProductName(m.productId),
            m.quantity,
            getStaffName(m.stockStaffId)
          ].join(';') + "\n";
        });
      } else {
        csvContent += "TOTAL DE ITENS: " + entryStats.totalQty + "\n";
        csvContent += "VALOR TOTAL: " + entryStats.totalValue.toFixed(2) + "\n\n";
        csvContent += "HISTORICO DE ENTRADAS\n";
        csvContent += "Data;Hora;Produto;V.Unit;Quantidade;Total;Responsavel\n";
        
        filteredEntries.forEach(e => {
          csvContent += [
            e.date, e.time,
            getProductName(e.productId),
            e.unitPrice.toFixed(2),
            e.quantity,
            (e.quantity * e.unitPrice).toFixed(2),
            getStaffName(e.stockStaffId)
          ].join(';') + "\n";
        });
      }

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Planilha_${activeTab === 'outflows' ? 'Saidas' : 'Entradas'}_${unit.toUpperCase()}_${selectedMonth}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setGenerating(null);
      setDone(true);
      setTimeout(() => setDone(false), 3000);
    }, 800);
  };

  const theme = {
    badgeText: unit === 'sede' ? 'text-[#14213D]' : 'text-[#9A4E12]',
    primaryIcon: unit === 'sede' ? 'text-[#14213D]' : 'text-[#9A4E12]',
    primaryFocus: unit === 'sede' ? 'focus:border-[#14213D]' : 'focus:border-[#9A4E12]',
  };

  return (
    <div className="space-y-6 sm:space-y-10 pb-10">
      <header className="border-b border-slate-200 pb-6 print:hidden">
        <h1 className="text-[22px] font-semibold text-[#14213D] uppercase tracking-tighter">Exportação Gerencial</h1>
        <p className="text-[14px] text-slate-500 mt-1 uppercase tracking-[0.2em] font-normal">Validação e Emissão de Documentos de Auditoria</p>
      </header>

      {/* TABS DE RELATÓRIO */}
      <div className="flex border-b border-slate-200 print:hidden">
        <button 
          onClick={() => setActiveTab('outflows')}
          className={`px-6 py-4 text-[14px] font-semibold uppercase tracking-widest transition-all border-b-2 ${activeTab === 'outflows' ? `border-[#14213D] text-[#14213D]` : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          Relatório de Saídas
        </button>
        <button 
          onClick={() => setActiveTab('entries')}
          className={`px-6 py-4 text-[14px] font-semibold uppercase tracking-widest transition-all border-b-2 ${activeTab === 'entries' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          Relatório de Entradas
        </button>
      </div>

      {/* Seletor de Período */}
      <div className="flex flex-col sm:flex-row gap-4 print:hidden">
        <div className="relative flex-1 sm:flex-none">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
          <select 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(Number(e.target.value))} 
            className={`appearance-none bg-white border border-slate-200 px-10 py-2.5 text-[14px] font-normal uppercase tracking-widest outline-none ${theme.primaryFocus} shadow-sm transition-all min-w-[160px]`}
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
            className={`appearance-none bg-white border border-slate-200 px-10 py-2.5 text-[14px] font-normal uppercase tracking-widest outline-none ${theme.primaryFocus} shadow-sm transition-all min-w-[120px]`}
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5 pointer-events-none" />
        </div>
      </div>

      <div className="bg-white border border-slate-200 p-8 sm:p-12 shadow-sm relative overflow-hidden">
        {done && (
          <div className="absolute top-4 right-4 animate-in slide-in-from-right-4 duration-300 print:hidden">
             <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-2 text-[13px] font-semibold uppercase tracking-widest flex items-center gap-2">
               <CheckCircle className="w-3 h-3" /> Relatório Validado
             </div>
          </div>
        )}

        <div className="max-w-4xl mx-auto flex flex-col items-center">
          <div className="bg-slate-50 w-20 h-20 flex items-center justify-center border border-slate-100 mb-8 print:hidden">
            <FileText className={`w-10 h-10 ${activeTab === 'outflows' ? theme.primaryIcon : 'text-emerald-600'} opacity-80`} />
          </div>
          
          <div className="text-center mb-10">
            <h2 className="text-[22px] font-semibold text-slate-800 uppercase tracking-tighter mb-4">
              {activeTab === 'outflows' ? 'Relatório Integrado de Saídas' : 'Relatório Integrado de Entradas'}
            </h2>
            <div className="flex flex-wrap gap-4 justify-center items-center">
              <span className={`text-[13px] uppercase tracking-widest font-semibold border ${unit === 'sede' ? 'border-blue-100 bg-blue-50 text-blue-700' : 'border-amber-100 bg-amber-50 text-amber-700'} px-4 py-1`}>
                UNIDADE {unit.toUpperCase()}
              </span>
              <span className="text-[13px] uppercase tracking-widest font-semibold bg-slate-100 text-slate-600 px-4 py-1">
                PERÍODO: {periodLabel}
              </span>
            </div>
          </div>

          {activeTab === 'outflows' ? (
            <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
               <div className="bg-slate-50/50 p-4 border-l-4 border-slate-200 text-center">
                  <p className="text-[13px] font-semibold text-slate-400 uppercase mb-1">Total Período</p>
                  <p className="text-[28px] font-bold text-slate-700">{stats.totalQty}</p>
               </div>
               <div className="bg-slate-50/50 p-4 border-l-4 border-slate-200 text-center">
                  <p className="text-[13px] font-semibold text-slate-400 uppercase mb-1">Movimentações</p>
                  <p className="text-[28px] font-bold text-slate-700">{filteredMovements.length}</p>
               </div>
               <div className="bg-slate-50/50 p-4 border-l-4 border-slate-200 text-center">
                  <p className="text-[13px] font-semibold text-slate-400 uppercase mb-1">Top Setor</p>
                  <p className="text-[14px] font-bold text-slate-700 uppercase truncate">{stats.secRanking[0]?.name || 'N/A'}</p>
               </div>
               <div className="bg-slate-50/50 p-4 border-l-4 border-slate-200 text-center">
                  <p className="text-[13px] font-semibold text-slate-400 uppercase mb-1">Crescimento</p>
                  <p className={`text-[28px] font-bold ${stats.growth > 0 ? 'text-red-600' : 'text-green-600'}`}>{stats.growth.toFixed(1)}%</p>
               </div>
            </div>
          ) : (
            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
               <div className="bg-slate-50/50 p-4 border-l-4 border-emerald-200 text-center">
                  <p className="text-[13px] font-semibold text-slate-400 uppercase mb-1">Total Recebido (Itens)</p>
                  <p className="text-[28px] font-bold text-slate-700">{entryStats.totalQty}</p>
               </div>
               <div className="bg-slate-50/50 p-4 border-l-4 border-emerald-200 text-center">
                  <p className="text-[13px] font-semibold text-slate-400 uppercase mb-1">Valor Total em Produtos</p>
                  <p className="text-[28px] font-bold text-emerald-600">
                    R$ {entryStats.totalValue.toLocaleString('pt-br', { minimumFractionDigits: 2 })}
                  </p>
               </div>
            </div>
          )}

          <div className="w-full flex flex-col md:flex-row gap-0 border border-slate-100 print:hidden mb-12">
            <button 
              onClick={activeTab === 'outflows' ? handleDownloadPDF : handleDownloadEntriesPDF}
              disabled={!!generating || (activeTab === 'outflows' ? filteredMovements.length === 0 : filteredEntries.length === 0)}
              className="flex-1 flex flex-col items-center gap-3 p-10 bg-white hover:bg-slate-50 border-b md:border-b-0 md:border-r border-slate-100 transition-all group disabled:cursor-not-allowed"
            >
              {generating?.startsWith('pdf') ? <Loader2 className="w-5 h-5 text-slate-800 animate-spin" /> : <Download className="w-5 h-5 text-slate-500 group-hover:text-slate-800 transition-colors" />}
              <span className="text-[14px] font-semibold uppercase tracking-[0.2em] text-slate-800">Relatório PDF Completo</span>
            </button>
            
            <button 
              onClick={handleDownloadCSV}
              disabled={!!generating || (activeTab === 'outflows' ? filteredMovements.length === 0 : filteredEntries.length === 0)}
              className="flex-1 flex flex-col items-center gap-3 p-10 bg-white hover:bg-slate-50 border-b md:border-b-0 md:border-r border-slate-100 transition-all group disabled:cursor-not-allowed"
            >
              {generating === 'csv' ? <Loader2 className="w-5 h-5 text-slate-800 animate-spin" /> : <FileSpreadsheet className="w-5 h-5 text-slate-500 group-hover:text-slate-800 transition-colors" />}
              <span className="text-[14px] font-semibold uppercase tracking-[0.2em] text-slate-800">Dados Brutos (CSV)</span>
            </button>

            <button 
              onClick={() => window.print()}
              disabled={activeTab === 'outflows' ? filteredMovements.length === 0 : filteredEntries.length === 0}
              className="flex-1 flex flex-col items-center gap-3 p-10 bg-white hover:bg-slate-50 transition-all group disabled:cursor-not-allowed"
            >
              <Printer className="w-5 h-5 text-slate-500 group-hover:text-slate-800 transition-colors" />
              <span className="text-[14px] font-semibold uppercase tracking-[0.2em] text-slate-800">Imprimir Visualização</span>
            </button>
          </div>

          <div className="bg-amber-50 border border-amber-100 p-6 flex items-start gap-4 text-left print:hidden">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-[13px] font-semibold text-amber-800 uppercase mb-1">Garantia de Integridade</p>
              <p className="text-[13px] text-amber-600 leading-relaxed uppercase font-normal">
                {activeTab === 'outflows' 
                  ? "O arquivo PDF exportado conterá automaticamente os rankings mensais, indicadores de crescimento, ranking acumulado e histórico detalhado de saídas."
                  : "O arquivo PDF exportado conterá o resumo de recebimento, valor total investido e o histórico detalhado de todas as entradas do período."}
              </p>
            </div>
          </div>
        </div>

        {/* Visualização de Impressão nativa */}
        <div className="hidden print:block text-left w-full mt-10">
           <div className="mb-10 border-b-4 border-slate-900 pb-4">
              <h3 className="text-3xl font-black uppercase tracking-tighter">RELATÓRIO DE LOGÍSTICA - ASSEFAZ {unit.toUpperCase()}</h3>
              <p className="text-sm uppercase font-bold text-slate-600">
                {activeTab === 'outflows' ? 'Relatório de Saídas' : 'Relatório de Entradas'} - Período Selecionado: {periodLabel}
              </p>
           </div>
           
           {activeTab === 'outflows' ? (
             <table className="w-full text-[9px] border-collapse mb-10">
               <thead>
                 <tr className="border-b-2 border-slate-900 bg-slate-100">
                   <th className="py-2 px-1 text-left uppercase font-bold">Data/Hora</th>
                   <th className="py-2 px-1 text-left uppercase font-bold">Setor</th>
                   <th className="py-2 px-1 text-left uppercase font-bold">Material</th>
                   <th className="py-2 px-1 text-center uppercase font-bold">Qtd</th>
                   <th className="py-2 px-1 text-right uppercase font-bold">Responsável</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-200">
                 {filteredMovements.map(m => (
                   <tr key={m.id}>
                     <td className="py-2 px-1">{m.date} {m.time}</td>
                     <td className="py-2 px-1 uppercase font-bold">{getSectorName(m.sectorId)}</td>
                     <td className="py-2 px-1 uppercase">{getProductName(m.productId)}</td>
                     <td className="py-2 px-1 text-center font-bold">{m.quantity}</td>
                     <td className="py-2 px-1 text-right uppercase text-slate-500">{getStaffName(m.stockStaffId)}</td>
                   </tr>
                 ))}
               </tbody>
             </table>
           ) : (
             <table className="w-full text-[9px] border-collapse mb-10">
               <thead>
                 <tr className="border-b-2 border-slate-900 bg-slate-100">
                   <th className="py-2 px-1 text-left uppercase font-bold">Data/Hora</th>
                   <th className="py-2 px-1 text-left uppercase font-bold">Material</th>
                   <th className="py-2 px-1 text-right uppercase font-bold">V. Unit</th>
                   <th className="py-2 px-1 text-center uppercase font-bold">Qtd</th>
                   <th className="py-2 px-1 text-right uppercase font-bold">Total</th>
                   <th className="py-2 px-1 text-right uppercase font-bold">Responsável</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-200">
                 {filteredEntries.map(e => (
                   <tr key={e.id}>
                     <td className="py-2 px-1">{e.date} {e.time}</td>
                     <td className="py-2 px-1 uppercase font-bold">{getProductName(e.productId)}</td>
                     <td className="py-2 px-1 text-right">R$ {e.unitPrice.toFixed(2)}</td>
                     <td className="py-2 px-1 text-center font-bold">{e.quantity}</td>
                     <td className="py-2 px-1 text-right font-bold">R$ {(e.quantity * e.unitPrice).toFixed(2)}</td>
                     <td className="py-2 px-1 text-right uppercase text-slate-500">{getStaffName(e.stockStaffId)}</td>
                   </tr>
                 ))}
               </tbody>
             </table>
           )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
