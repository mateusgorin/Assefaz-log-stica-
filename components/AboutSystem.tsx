import React from 'react';
import { X, Info, Database, Shield, Zap, FileText, Layout, Smartphone, CheckCircle2, Building2 } from 'lucide-react';

interface AboutSystemProps {
  onClose?: () => void;
  isModal?: boolean;
}

const AboutSystem: React.FC<AboutSystemProps> = ({ onClose, isModal = false }) => {
  const content = (
    <div className={`bg-white ${isModal ? 'max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border-t-8 border-amber-500' : 'animate-in fade-in duration-500'}`}>
      {isModal && (
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex justify-between items-center z-10">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-[#14213D]" />
            <h2 className="text-[16px] font-bold uppercase tracking-widest text-slate-800">Sobre o Sistema</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
      )}

      <div className="p-8 sm:p-12 space-y-12">
        {/* Header Section */}
        <header className="text-center space-y-4">
          <div className="w-20 h-20 bg-[#14213D]/5 rounded-full flex items-center justify-center mx-auto mb-6">
            <Building2 className="w-10 h-10 text-[#14213D]" />
          </div>
          <h1 className="text-[28px] sm:text-[36px] font-bold text-[#14213D] uppercase tracking-tighter leading-none">
            Controle Logístico Para Assefaz <span className="text-amber-600">Sede/506</span>
          </h1>
          <div className="max-w-2xl mx-auto space-y-4">
            <p className="text-[14px] sm:text-[16px] text-slate-600 leading-relaxed">
              O Controle Logístico é um sistema web desenvolvido para organizar, proteger e dar visibilidade total à gestão de insumos e materiais da Assefaz, tornando o processo mais seguro, rastreável e eficiente.
            </p>
            <p className="text-[13px] sm:text-[15px] text-slate-500 font-medium uppercase tracking-wide">
              Mais do que controlar estoque, a plataforma centraliza informações, reduz falhas operacionais e apoia a tomada de decisão com dados confiáveis e atualizados.
            </p>
          </div>
        </header>

        {/* Database Section */}
        <section className="bg-slate-50 border border-slate-100 p-8 sm:p-10 space-y-8">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="bg-[#14213D] p-4 text-white">
              <Database className="w-8 h-8" />
            </div>
            <div className="space-y-4">
              <h2 className="text-[20px] font-bold text-[#14213D] uppercase tracking-tight">Como funciona o banco de dados do sistema</h2>
              <p className="text-[14px] text-slate-600 leading-relaxed">
                No centro do sistema existe um banco de dados seguro, construído em <span className="font-bold text-emerald-600">Supabase</span>, que funciona como a “memória oficial” da plataforma.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              'Entradas de materiais',
              'Saídas e requisições',
              'Ajustes de estoque',
              'Assinaturas digitais',
              'Histórico de movimentações',
              'Geração de relatórios'
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 bg-white p-4 border border-slate-200 shadow-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-[12px] font-semibold uppercase tracking-wider text-slate-700">{item}</span>
              </div>
            ))}
          </div>

          <div className="space-y-6 text-[14px] text-slate-600 leading-relaxed">
            <p>
              Essas informações não ficam salvas no computador ou no celular do usuário. Elas são armazenadas de forma centralizada, segura e permanente no banco de dados, o que evita perda de informações, divergência entre unidades e registros incompletos.
            </p>
            <p>
              Sempre que um usuário realiza uma ação, o sistema grava automaticamente essa informação no banco de dados e atualiza os estoques em tempo real. Isso garante que <span className="font-bold">Sede e 506</span> visualizem dados consistentes, confiáveis e sincronizados.
            </p>
            <p>
              Além do controle físico dos materiais, o sistema também registra os valores financeiros informados na nota fiscal de entrada. Cada item recebido pode ter seu valor unitário registrado, permitindo acompanhar não apenas quantidade, mas também o custo real dos materiais adquiridos.
            </p>
            <div className="bg-amber-50 border-l-4 border-amber-500 p-6 space-y-4">
              <p className="font-medium text-amber-900">
                Com isso, o banco de dados consolida automaticamente esses valores ao longo do tempo, possibilitando visualizar quanto a empresa está investindo em materiais de forma clara e organizada.
              </p>
              <p>
                Por meio dos relatórios automáticos gerados pelo sistema, é possível obter parâmetros financeiros detalhados, com valores totais, históricos por período e base segura para conferências, análises de gastos e prestação de contas.
              </p>
            </div>
            <p>
              Além disso, o banco de dados mantém um histórico completo das movimentações. Caso alguma operação seja excluída ou corrigida, o sistema ajusta os saldos automaticamente, preservando a integridade das informações.
            </p>
          </div>
        </section>

        {/* Features Section */}
        <section className="space-y-8">
          <div className="text-center">
            <h2 className="text-[22px] font-bold text-[#14213D] uppercase tracking-widest mb-2">Principais funcionalidades do sistema</h2>
            <div className="w-20 h-1 bg-amber-500 mx-auto"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { icon: <Layout className="w-5 h-5" />, text: "Gestão centralizada de múltiplas unidades (Sede e 506)" },
              { icon: <Shield className="w-5 h-5" />, text: "Acesso protegido por usuário e senha" },
              { icon: <Zap className="w-5 h-5" />, text: "Dashboard com visão geral e alertas de estoque baixo" },
              { icon: <Layout className="w-5 h-5" />, text: "Registro de saídas em lote, otimizando o processo" },
              { icon: <CheckCircle2 className="w-5 h-5" />, text: "Assinatura digital do retirante e do responsável" },
              { icon: <Database className="w-5 h-5" />, text: "Controle de entradas com registro de valores e custos" },
              { icon: <Layout className="w-5 h-5" />, text: "Inventário com busca e filtros por categoria" },
              { icon: <Zap className="w-5 h-5" />, text: "Rastreabilidade completa de todas as movimentações" },
              { icon: <FileText className="w-5 h-5" />, text: "Relatórios automáticos em PDF (Operacionais e Financeiros)" },
              { icon: <Smartphone className="w-5 h-5" />, text: "Interface moderna e responsiva (PC, Tablet e Celular)" },
            ].map((feature, idx) => (
              <div key={idx} className="flex items-start gap-4 p-4 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
                <div className="text-[#14213D] mt-1">{feature.icon}</div>
                <span className="text-[13px] font-medium text-slate-700 uppercase tracking-tight">{feature.text}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Footer Section */}
        <footer className="pt-12 border-t border-slate-100 text-center space-y-6">
          <p className="text-[15px] text-slate-700 font-medium leading-relaxed max-w-3xl mx-auto">
            O Controle Logístico foi desenvolvido para ser uma ferramenta confiável de gestão. Com um banco de dados seguro e centralizado em Supabase, o sistema garante controle físico e financeiro dos materiais, oferecendo rastreabilidade, transparência e base sólida para decisões administrativas.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 pt-4">
            <p className="text-[11px] text-slate-400 uppercase tracking-widest font-medium">
              Em caso de dúvidas, sugestões ou identificação de falhas, entre em contato com o desenvolvedor responsável,{' '}
              <a 
                href="https://wa.me/5561981290099" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-amber-600 hover:underline"
              >
                Mateus Miranda
              </a>
            </p>
            <div className="flex items-center gap-4">
              <div className="h-px w-12 bg-slate-200"></div>
              <div className="h-px w-12 bg-slate-200"></div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
        {content}
      </div>
    );
  }

  return content;
};

export default AboutSystem;
