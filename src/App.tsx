import React, { useState, useEffect } from 'react'; // Force UI sync
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle2, MapPin, Phone, Mail, Instagram, Linkedin, Menu, ArrowRight, Building2, TrendingUp, ShieldCheck, Wallet } from 'lucide-react';

// --- Icons ---
const WhatsAppIcon = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

// --- Components ---

const Navbar = () => (
  <nav className="sticky top-0 z-40 bg-[#FDFCFB]/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
    <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 shrink-0">
        <div className="hidden lg:flex flex-col border-r border-gray-200 pr-4 text-right">
          <div className="text-3xl font-sans text-primary font-bold leading-none tracking-tight whitespace-nowrap">Paula Malheiro</div>
          <div className="text-[11px] text-gray-500 uppercase tracking-[0.2em] mt-1.5 font-medium">Corretora de Imóveis</div>
        </div>
        <img 
          src="/logo.png" 
          alt="Logo VCA" 
          width={110} 
          height={40} 
          className="object-contain"
          referrerPolicy="no-referrer"
        />
      </div>
      <div className="hidden xl:flex items-center justify-center gap-6 text-[13px] font-semibold text-gray-600 flex-1">
        <a href="#home" className="hover:text-primary transition-colors whitespace-nowrap">Início</a>
        <a href="#projects" className="hover:text-primary transition-colors whitespace-nowrap">Empreendimentos</a>
        <a href="#simulation" className="hover:text-primary transition-colors whitespace-nowrap">Simulação</a>
        <a href="#construction" className="hover:text-primary transition-colors whitespace-nowrap">Evolução das Obras</a>
        <a href="#about" className="hover:text-primary transition-colors whitespace-nowrap">Sobre Mim</a>
        <a href="#contact" className="hover:text-primary transition-colors whitespace-nowrap">Contato</a>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <a 
          href="https://www.instagram.com/paulamalheiro_vca?igsh=MXZsOHV5cWQ2bnAyaQ=="
          target="_blank"
          className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] flex items-center justify-center text-white shadow-sm hover:scale-110 transition-all"
          title="Instagram"
        >
          <Instagram size={18} />
        </a>
        <a 
          href="https://wa.me/5577991465337"
          target="_blank"
          className="bg-[#25D366] text-white px-5 py-2.5 rounded-full text-xs font-bold hover:opacity-90 transition-all shadow-md flex items-center gap-2"
        >
          <WhatsAppIcon size={18} />
          <span className="hidden sm:inline">WhatsApp</span>
        </a>
        <button className="xl:hidden text-gray-600 p-2">
          <Menu size={24} />
        </button>
      </div>
    </div>
  </nav>
);

const Hero = () => (
  <section id="home" className="relative pt-12 pb-24 overflow-hidden">
    <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
      <motion.div 
        initial={{ opacity: 0, x: -50 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        className="space-y-8"
      >
        <div className="space-y-4">
          <span className="text-xs font-bold text-accent uppercase tracking-[0.3em]">Especialista em Imóveis na Planta</span>
          <h1 className="flex flex-col">
            <span className="text-2xl md:text-3xl font-sans text-gray-500 uppercase tracking-[0.2em] mb-2">
              a compra do seu
            </span>
            <span className="text-7xl md:text-9xl font-sans font-black text-primary leading-none mb-4 tracking-tight">
              imóvel
            </span>
            <span className="text-lg md:text-xl font-sans text-gray-600 leading-relaxed italic">
              como uma experiência segura e transparente!
            </span>
          </h1>
        </div>
        <p className="text-lg text-gray-600 max-w-lg leading-relaxed">
          Com mais de 10 anos de experiência, minha intenção aqui é conectar você às oportunidades em imóveis através de um atendimento humano e personalizado para encontrarmos a melhor opção para o seu momento atual.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <a 
            href="#projects"
            className="w-full sm:w-auto bg-primary text-white px-8 py-4 rounded-lg font-bold hover:bg-accent transition-all shadow-xl shadow-primary/20 text-center"
          >
            Conheça os Empreendimentos
          </a>
          <div className="flex gap-4 w-full sm:w-auto">
            <a 
              href="https://wa.me/5577991465337"
              target="_blank"
              className="flex-1 sm:flex-none bg-[#25D366] text-white px-8 py-4 rounded-lg font-bold hover:opacity-90 transition-all shadow-xl shadow-[#25D366]/20 text-center flex items-center justify-center gap-2"
            >
              <WhatsAppIcon size={20} />
              Agendar Atendimento
            </a>
            <a 
              href="https://www.instagram.com/paulamalheiro_vca?igsh=MXZsOHV5cWQ2bnAyaQ=="
              target="_blank"
              className="w-14 h-14 shrink-0 rounded-lg bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] flex items-center justify-center text-white hover:scale-105 transition-all shadow-lg"
              title="Instagram"
            >
              <Instagram size={24} />
            </a>
          </div>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl"
      >
        <img 
          src="/pm_perfil.jpeg" 
          alt="Paula Malheiro" 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      </motion.div>
    </div>
  </section>
);

const ProjectCard = ({ project, idx }: { project: any, idx: number, key?: any }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: idx * 0.1 }}
      onClick={() => setIsExpanded(!isExpanded)}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      className={`group cursor-pointer bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col ${isExpanded ? 'md:col-span-2 lg:col-span-1' : ''}`}
    >
      <div className="relative aspect-[3/4] overflow-hidden shrink-0">
        <img 
          src={project.image} 
          alt={project.title} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-4 left-4 bg-accent text-white text-[10px] font-bold px-3 py-1 rounded-full">
          {project.tag}
        </div>
      </div>
      <div className="p-6 flex flex-col flex-1">
        <div className="space-y-3 mb-4">
          <h3 className="text-xl font-sans text-primary font-bold">{project.title}</h3>
          <div className="flex items-center gap-1 text-gray-500 text-sm">
            <MapPin size={14} /> {project.location}
          </div>
          <div className={`text-sm text-gray-600 leading-relaxed transition-all duration-500 overflow-hidden ${isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-20 opacity-80'}`}>
            <div className="whitespace-pre-line">
              {project.description}
            </div>
          </div>
          <button 
            className="text-xs font-bold text-primary/60 hover:text-primary transition-colors uppercase tracking-widest"
          >
            {isExpanded ? 'Ver menos' : 'Ver mais detalhes'}
          </button>
        </div>
        <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
          <div>
            <span className="block text-[10px] text-gray-400 uppercase font-bold">Destaque</span>
            <span className="font-bold text-primary">{project.range}</span>
          </div>
          <a 
            href={`https://wa.me/5577991465337?text=${encodeURIComponent(project.fullMessage || `Olá Paula! Gostaria de mais informações sobre o empreendimento ${project.title}.`)}`}
            target="_blank"
            onClick={(e) => e.stopPropagation()}
            className="text-primary font-bold text-sm flex items-center gap-1 group-hover:gap-2 transition-all"
          >
            Saiba Mais <ArrowRight size={16} />
          </a>
        </div>
      </div>
    </motion.div>
  );
};

const FeaturedProjects = () => {
  const projects = [
    {
      title: 'DUQUE Lavenir Residence',
      location: 'Próximo a Olívia Flores',
      range: 'Casas Soltas',
      image: '/duque-lavenir.png',
      tag: 'LANÇAMENTO',
      description: `Casas soltas com duas opções de planta: térrea com 3 suítes e reforço estrutural, possibilidade de ampliação, ou duplex, com 4 suites + sala íntima + home office. 

Conceito moderno de arquitetura e área de lazer maravilhosa! Tudo o que você sempre sonhou, num só empreendimento.

Próximo a Olívia Flores, na área de lazer mais desejada da cidade, com grande expectativa de valorização.
 
PARCELAMENTO SEM BUROCRACIA, direto com a construtora em até 100x

Área de lazer de clube: 

✅Mega Piscina semi-olimpica com Sauna Integrada
✅Quadra de Tênis, Quadra Poliesportiva
✅Salão de jogos
✅ Academia completa e com espaço para Crossfit.
✅Amplo Salão de Festas 
e muito mais!`,
      fullMessage: 'Olá Paula! Gostaria de mais informações sobre o DUQUE Lavenir Residence. Vi que tem opções de casas térreas e duplex, lazer de clube completo com piscina semi-olímpica e quadra de tênis, e parcelamento em até 100x.'
    },
    {
      title: 'UNI House',
      location: 'Região do Terras Alphaville',
      range: '2 Quartos + Quintal',
      image: '/uni-house.png.jpeg',
      tag: 'LANÇAMENTO',
      description: `Condomínio de casas soltas com quintais de 30 a 130m², o UNI House é lançamento da VCA Construtora com aquela área de lazer maravilhosa e cheia de muito verde e qualidade de vida! 

Localizado na região que mais cresce em Vitória da Conquista: próximo ao Terras Alphaville, Bellator, Baron Connect e vários outros condomínios!

Opções de pagamento: Financiamento Caixa e plano exclusivo para investidor em até 60x!`,
      fullMessage: 'Olá Paula! Gostaria de mais informações sobre o UNI House. Vi que tem quintais amplos e opções de financiamento Caixa ou plano para investidor.'
    },
    {
      title: 'Connect Tech II - bairro planejado murado',
      location: 'Área nobre do Baron Connect',
      range: 'Bairro Planejado Murado',
      image: '/Connect-Tech-2.jpg',
      tag: 'LANÇAMENTO',
      description: `Connect Tech II é um bairro planejado murado localizado em uma área nobre do Baron Connect (bairro planejado), que contará com estrutura de lazer, ruas pavimentadas e amplas, água encanada, iluminação em led, rede de fibra óptica e paisagismo caprichado. 

Investir na região que mais cresce atualmente em Vitória da Conquista - próximo a Estrada da Barra, Alphaville - proporcionará a você um excelente retorno financeiro do seu investimento ao longo do tempo.

É um bairro planejado mas com conceito de condomínio, para quem gosta de exclusividade! Perfeito para construir seu melhor sonho! 

Área de lazer com quiosques gourmet, espaço pet, quadras poliesportiva, salão de festas, salão de jogos, parque infantil, e posso possibilidade até de uma futura piscina para completar! 

Plano direto pela construtora - VCA, sem burocracia, sem consulta SPC e Serada. Oportunidade para que você, pagando uma parcela irrisória, aplique seu dinheiro onde verdadeiramente lhe trará rentabilidade e um futuro promissor.

Quem investe em terra, não erra!`,
      fullMessage: 'Olá Paula! Gostaria de mais informações sobre o Connect Tech II. Vi que é um bairro planejado murado com lazer completo e plano direto pela VCA sem burocracia.'
    },
    {
      title: 'Dona Lys - Apartamentos próximo a Olívia Flores',
      location: 'Próximo a Olívia Flores',
      range: 'Duo Residences',
      image: '/dona-lys.jpeg',
      tag: 'LANÇAMENTO',
      description: `São "duo residences" com opção de térreo com quintal, ou 1º andar, próximo a Olivia Flores com aquela área de lazer maravilhosa que só a VCA faz.

Dona Lys Residencial - a nova Dona Olívia!

O empreendimento será localizado próximo a outros três empreendimentos da VCA! Em frente à fonte luminosa da Olivia/ Senai; onde tem próximo a Uesb, órgãos da Justiça, shopping, Ufba, escolas, supermercados e muito mais! Localização estratégica para que você tenha qualidade de vida e rentabilidade no investimento e com aluguéis. 

Além de plano exclusivo para investidor, há também a opção de financiamento pela Caixa Econômica Federal pelo Programa Minha Casa Minha Vida.

Solicite sua simulação agora mesmo!`,
      fullMessage: 'Olá Paula! Gostaria de mais informações sobre o Dona Lys. Vi que são apartamentos duo residences próximo à Olívia Flores com financiamento Caixa.'
    },
    {
      title: 'DON OESTE - próximo ao CAIC, Lagoa das Bateias',
      location: 'Próximo ao CAIC, Lagoa das Bateias',
      range: 'Duo Residences',
      image: '/DON-OESTE.jpeg',
      tag: 'LANÇAMENTO',
      description: `O 1º VCA na zona Oeste de Conquista chegou!

Bem-vindo ao seu novo lar, onde localização e lazer se encontram!
Próximo à Avenida Brumado, o Don Oeste é um projeto pensado para quem valoriza, praticidade no dia a dia e momentos incríveis com a família.

 A melhor área de lazer da Zona Oeste, com espaços para todas as idades aproveitarem o melhor da vida.

São "duo residences" com opção no térreo com quintal, ou no 1º andar, de dois quartos (com ou sem suíte).

Financiamento Caixa Econômica pelo Programa Minha Casa Minha Vida (solicite sua simulação), ou plano direto pela Construtora sem burocracia, em 60x!

Garanta já sua unidade e viva onde tudo acontece!`,
      fullMessage: 'Olá Paula! Gostaria de mais informações sobre o DON OESTE. Vi que é o 1º VCA na zona Oeste, próximo ao CAIC e Lagoa das Bateias.'
    }
  ];

  return (
    <section id="projects" className="py-24 bg-secondary/30">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-16 text-center">
          <h2 className="text-4xl font-sans text-primary mb-4">Lançamentos em Destaque</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            As opções vão desde casa em condomínio, apartamentos e terrenos dentro e fora de condomínio. Vamos encontrar a melhor para você?
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
          {projects.map((project, idx) => (
            <ProjectCard key={idx} project={project} idx={idx} />
          ))}
        </div>
      </div>
    </section>
  );
};

const Benefits = () => (
  <section className="py-24">
    <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-2 gap-16 items-center">
      <div className="space-y-8">
        <h2 className="text-4xl font-sans text-primary leading-tight">
          O Diferencial de Investir em Lançamentos
        </h2>
        
        <div className="space-y-6">
          {[
            { icon: <TrendingUp />, title: 'Alta Valorização', desc: 'Adquirir na planta permite capturar toda a curva de valorização do empreendimento até a entrega das chaves.' },
            { icon: <ShieldCheck />, title: 'Personalização e Inovação', desc: 'Acesso às últimas tendências em automação, sustentabilidade e layouts modernos que atendem às demandas atuais.' },
            { icon: <Wallet />, title: 'Condições Facilitadas', desc: 'Fluxos de pagamento flexíveis durante a obra, permitindo um planejamento financeiro muito mais estratégico.' }
          ].map((item, idx) => (
            <div key={idx} className="flex gap-6 p-6 rounded-2xl hover:bg-secondary/50 transition-colors">
              <div className="w-14 h-14 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                {item.icon}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-1">{item.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="relative">
        <div className="aspect-square rounded-3xl overflow-hidden shadow-2xl relative">
          <img src="/velli.jpeg" alt="Investimento" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        </div>
        <div className="absolute -bottom-8 -left-8 bg-white p-8 rounded-2xl shadow-xl max-w-xs border border-gray-100">
          <p className="italic text-gray-600 text-sm mb-4">
            &quot;Investir em imóveis na planta é a forma mais inteligente de construir patrimônio sólido com segurança e planejamento.&quot;
          </p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 relative overflow-hidden">
              <img src="/velli.jpeg" alt="Paula Malheiro" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div>
              <span className="block font-bold text-primary text-sm leading-none">Paula Malheiro</span>
              <span className="text-[10px] text-gray-400 uppercase font-bold mt-1">Corretora de Imóveis</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const CTA = () => (
  <section className="py-24 px-4">
    <div className="max-w-5xl mx-auto bg-primary rounded-[3rem] p-12 md:p-20 text-center text-white relative overflow-hidden shadow-2xl shadow-primary/30">
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <Building2 className="absolute -top-10 -left-10 w-64 h-64" />
        <Building2 className="absolute -bottom-10 -right-10 w-64 h-64" />
      </div>
      
      <div className="relative z-10 space-y-8">
        <h2 className="text-4xl md:text-6xl font-sans leading-tight">
          Não encontrou o que procura?
        </h2>
        <p className="text-lg text-white/80 max-w-xl mx-auto">
          Estou pronta para apresentar as melhores oportunidades em imóveis para você.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <a 
            href="https://wa.me/5577991465337"
            target="_blank"
            className="bg-[#25D366] text-white px-10 py-5 rounded-xl font-bold text-lg hover:scale-105 transition-transform shadow-xl inline-flex items-center gap-3"
          >
            <WhatsAppIcon size={24} />
            Chame aqui
          </a>
          <a 
            href="https://www.instagram.com/paulamalheiro_vca?igsh=MXZsOHV5cWQ2bnAyaQ=="
            target="_blank"
            className="w-16 h-16 rounded-xl bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] flex items-center justify-center text-white hover:scale-110 transition-transform shadow-xl"
            title="Instagram"
          >
            <Instagram size={32} />
          </a>
        </div>
      </div>
    </div>
  </section>
);

const Footer = () => (
  <footer id="contact" className="bg-secondary/50 pt-24 pb-12 border-t border-gray-100">
    <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-4 gap-12 mb-16">
      <div className="space-y-6">
        <div className="flex flex-col gap-4">
          <div className="text-2xl font-sans text-primary font-bold leading-none tracking-tight">Paula Malheiro</div>
          <img 
            src="/logo.png" 
            alt="Logo VCA" 
            width={140} 
            height={50} 
            className="object-contain"
            referrerPolicy="no-referrer"
          />
          <div className="text-[12px] text-gray-500 uppercase tracking-[0.2em] font-medium">Corretora de Imóveis</div>
        </div>
        <p className="text-sm text-gray-500 leading-relaxed">
          Especialista em lançamentos. Ética e transparência para o seu próximo imóvel na planta.
        </p>
        <div className="flex gap-4">
          <a href="https://www.instagram.com/paulamalheiro_vca?igsh=MXZsOHV5cWQ2bnAyaQ==" target="_blank" className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] flex items-center justify-center text-white shadow-sm hover:scale-110 transition-all"><Instagram size={20} /></a>
          <a href="#" className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-primary shadow-sm hover:bg-primary hover:text-white transition-all"><Linkedin size={20} /></a>
          <a href="https://wa.me/5577991465337" target="_blank" className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-primary shadow-sm hover:bg-primary hover:text-white transition-all"><WhatsAppIcon size={20} /></a>
        </div>
      </div>

      <div>
        <h4 className="font-bold text-gray-800 mb-6 uppercase text-xs tracking-widest">Navegação</h4>
        <ul className="space-y-4 text-sm text-gray-500">
          <li><a href="#" className="hover:text-primary transition-colors">Início</a></li>
          <li><a href="#" className="hover:text-primary transition-colors">Sobre Mim</a></li>
          <li><a href="#" className="hover:text-primary transition-colors">Empreendimentos</a></li>
          <li><a href="#" className="hover:text-primary transition-colors">Simulação</a></li>
          <li><a href="#clients" className="hover:text-primary transition-colors">Clientes</a></li>
          <li><a href="#" className="hover:text-primary transition-colors">Contato</a></li>
        </ul>
      </div>

      <div>
        <h4 className="font-bold text-gray-800 mb-6 uppercase text-xs tracking-widest">Legal</h4>
        <ul className="space-y-4 text-sm text-gray-500 mb-8">
          <li><a href="#" className="hover:text-primary transition-colors">Privacidade</a></li>
          <li><a href="#" className="hover:text-primary transition-colors">Termos de Uso</a></li>
          <li><a href="#" className="hover:text-primary transition-colors">Mapa do Site</a></li>
        </ul>
        <img 
          src="/logo.png" 
          alt="Logo Paula Malheiro" 
          width={120} 
          height={40} 
          className="object-contain"
          referrerPolicy="no-referrer"
        />
      </div>

      <div>
        <h4 className="font-bold text-gray-800 mb-6 uppercase text-xs tracking-widest">Contato</h4>
        <ul className="space-y-4 text-sm text-gray-500">
          <li className="flex items-start gap-3"><MapPin size={18} className="text-primary shrink-0" /> <span>Avenida Olivia Flores, 1275, Candeias<br/>Vitoria da Conquista - BA - 45028-610</span></li>
          <li className="flex items-center gap-3"><Phone size={18} className="text-primary shrink-0" /> <span>+55 (77) 99146-5337</span></li>
          <li className="flex items-center gap-3"><Mail size={18} className="text-primary shrink-0" /> <span>paula-malheiro@hotmail.com</span></li>
        </ul>
      </div>
    </div>
    
    <div className="max-w-7xl mx-auto px-4 pt-8 border-t border-gray-200 flex flex-col md:row items-center justify-between gap-4">
      <p className="text-xs text-gray-400">© 2024 Paula Malheiro. Todos os direitos reservados.</p>
      <div className="flex items-center gap-2 text-xs text-gray-400">
        Desenvolvido com <ArrowRight size={12} className="text-primary" /> Especialista em Imóveis na Planta
      </div>
    </div>

    <a 
      href="https://wa.me/5577991465337" 
      target="_blank" 
      className="fixed bottom-8 right-8 w-16 h-16 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform z-50"
    >
      <WhatsAppIcon size={32} />
    </a>
  </footer>
);

const About = () => (
  <section id="about" className="py-24 bg-white">
    <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-2 gap-16 items-start">
      <motion.div 
        initial={{ opacity: 0, x: -50 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        className="rounded-3xl overflow-hidden shadow-2xl"
      >
        <img 
          src="/pm_perfil.jpeg" 
          alt="Paula Malheiro" 
          width={800}
          height={1000}
          className="w-full h-auto"
          referrerPolicy="no-referrer"
        />
      </motion.div>
      <motion.div 
        initial={{ opacity: 0, x: 50 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        className="space-y-6"
      >
        <span className="text-xs font-bold text-accent uppercase tracking-widest">Minha História</span>
        <div className="space-y-4 text-gray-600 leading-relaxed">
          <p>
            Sou natural de Caetité – Bahia, e após passar um período no Estado do Amapá, cheguei em Vitória da Conquista no ano de 2012 onde finalizei a faculdade de Direito e comecei a trabalhar na área. Mas as vendas sempre me acompanharam como forma de ter um extra, e desde pequena via meu pai falar sobre imóveis já que ele é um fanático por negócios e sempre me inspirava de que não há nada mais concreto e lucrativo.
          </p>
          <p>
            Em 2016 ingressei no ramo de Corretagem de Imóveis e desde sempre meu interesse foi por lançamentos imobiliários. Iniciei como Corretora no Alphaville onde aprendi sobre o poder de confiar no que se vende, e a não ter vergonha do trabalho. Em seguida, trabalhei na Gráfico Construtora e Incorporadora, período de muitas experiencias e que me fez ter certeza de estar no ramo certo. E em 2018 fui convidada para trabalhar na VCA Construtora, responsável pela maior parte do meu desenvolvimento como ser humano e profissional, me provando o quanto sou determinada e resiliente.
          </p>
          <p>
            Gosto muito de desafios, de inovar, sou criativa e adoro marketing. Já atuei também na coordenação comercial, e entre inspirar e utilizar minha experiência como bússola, percebi que gosto da liberdade de estar presente e gerir meu próprio negócio ajudando os meus clientes a tomarem a decisão certa, sempre pautado em muita transparência.
          </p>
          <p>
            Hoje, com 10 anos de profissão, vivo um novo momento com mais maturidade e prezo por um bom atendimento humano e personalizado, a fim de contribuir numa vida mais feliz e próspera a quem me procura para ajudar na compra do seu imóvel.
          </p>
          <p className="font-bold text-primary pt-4">
            Paula Malheiro – CRECI 21.188
          </p>
        </div>
        <div className="pt-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary"><CheckCircle2 size={20} /></div>
            <span className="font-bold text-gray-700">Segurança e Planejamento</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary"><CheckCircle2 size={20} /></div>
            <span className="font-bold text-gray-700">Atendimento Personalizado</span>
          </div>
        </div>
      </motion.div>
    </div>
  </section>
);

const Simulation = () => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    dataNascimento: '',
    profissao: '',
    renda: '',
    dependentes: 'Não',
    possuiImoveis: 'Não',
    ondeReside: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const message = `*Nova Simulação de Financiamento*\n\n` +
      `*Nome:* ${formData.nome}\n` +
      `*Data de Nascimento:* ${formData.dataNascimento}\n` +
      `*Profissão:* ${formData.profissao}\n` +
      `*Renda:* ${formData.renda}\n` +
      `*Possui dependentes:* ${formData.dependentes}\n` +
      `*Já possui imóveis:* ${formData.possuiImoveis}\n` +
      `*Onde reside:* ${formData.ondeReside}`;
      
    const whatsappUrl = `https://wa.me/5577991465337?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    setTimeout(() => {
      setIsSubmitting(false);
      setShowForm(false);
    }, 1000);
  };

  return (
    <section id="simulation" className="py-24 bg-secondary/20">
      <div className="max-w-4xl mx-auto px-4 text-center space-y-12">
        <div className="space-y-4">
          <h2 className="text-4xl font-sans text-primary">Simulação de Financiamento</h2>
          <p className="text-gray-600">Descubra as melhores condições para o seu perfil financeiro.</p>
        </div>
        
        <AnimatePresence mode="wait">
          {!showForm ? (
            <motion.div
              key="button"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex justify-center"
            >
              <button 
                onClick={() => setShowForm(true)}
                className="group relative bg-primary text-white px-12 py-6 rounded-2xl font-bold text-xl shadow-2xl shadow-primary/30 hover:scale-105 transition-all flex items-center justify-center overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <span>Simular</span>
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white p-8 md:p-12 rounded-[2rem] shadow-2xl border border-gray-100 text-left max-w-2xl mx-auto"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-sans text-primary">Dados para Simulação</h3>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-primary transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">Nome Completo</label>
                  <input 
                    required
                    type="text" 
                    placeholder="Seu nome completo" 
                    className="w-full p-4 rounded-xl border border-gray-200 focus:border-primary outline-none transition-all"
                    value={formData.nome}
                    onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">Data de Nascimento</label>
                  <input 
                    required
                    type="date" 
                    className="w-full p-4 rounded-xl border border-gray-200 focus:border-primary outline-none transition-all"
                    value={formData.dataNascimento}
                    onChange={(e) => setFormData({...formData, dataNascimento: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">Profissão</label>
                  <input 
                    required
                    type="text" 
                    placeholder="Sua profissão" 
                    className="w-full p-4 rounded-xl border border-gray-200 focus:border-primary outline-none transition-all"
                    value={formData.profissao}
                    onChange={(e) => setFormData({...formData, profissao: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">Renda R$</label>
                  <input 
                    required
                    type="text" 
                    placeholder="Ex: 5.000,00" 
                    className="w-full p-4 rounded-xl border border-gray-200 focus:border-primary outline-none transition-all"
                    value={formData.renda}
                    onChange={(e) => setFormData({...formData, renda: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">Possui dependentes?</label>
                  <div className="flex gap-4 p-1 bg-secondary/30 rounded-xl">
                    {['Sim', 'Não'].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setFormData({...formData, dependentes: opt})}
                        className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all ${formData.dependentes === opt ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-primary'}`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">Já possui Imóveis?</label>
                  <div className="flex gap-4 p-1 bg-secondary/30 rounded-xl">
                    {['Sim', 'Não'].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setFormData({...formData, possuiImoveis: opt})}
                        className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all ${formData.possuiImoveis === opt ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-primary'}`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">Onde Reside</label>
                  <input 
                    required
                    type="text" 
                    placeholder="Cidade / Estado" 
                    className="w-full p-4 rounded-xl border border-gray-200 focus:border-primary outline-none transition-all"
                    value={formData.ondeReside}
                    onChange={(e) => setFormData({...formData, ondeReside: e.target.value})}
                  />
                </div>

                <div className="md:col-span-2 pt-4">
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-primary text-white py-5 rounded-xl font-bold text-lg hover:bg-accent transition-all flex items-center justify-center gap-3 shadow-xl shadow-primary/20 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <div className="flex items-center gap-3">
                        Simular
                      </div>
                    )}
                  </button>
                  <p className="text-[10px] text-gray-400 text-center mt-4 uppercase tracking-widest">
                    Seus dados estão protegidos e serão usados apenas para a simulação.
                  </p>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

const Progress = () => (
  <section id="construction" className="py-24 bg-white">
    <div className="max-w-7xl mx-auto px-4">
      <div className="mb-16 text-center">
        <h2 className="text-4xl font-sans text-primary mb-4">Evolução das Obras</h2>
        <p className="text-gray-600">Confira o acompanhamento real de cada etapa dos nossos empreendimentos.</p>
      </div>

      <div className="flex justify-center mb-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-accent text-white px-12 py-4 rounded-full font-bold text-sm uppercase tracking-[0.5em] shadow-xl shadow-accent/30 animate-pulse"
        >
          Aguardem
        </motion.div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {[
          { label: 'Bellator', img: '/bellator.jpeg' },
          { label: 'Amado', img: '/amado.jpeg' },
          { label: 'Verso', img: '/verso.jpeg', link: 'https://www.instagram.com/reel/DT8XsQojhti/?igsh=MThyOHU0eWQ4ajNhaw==' },
          { label: 'Baron', img: '/baron.jpeg' },
          { label: 'Sculptor', img: '/sculptor.jpeg' },
          { label: 'Uni', img: '/uni.jpeg', link: 'https://www.instagram.com/reel/DWWQfOYDuAn/?igsh=MXFlamt6aGZlZWFndQ==' },
          { label: 'Vila', img: '/vila.jpeg' }
        ].map((item, idx) => {
          const Wrapper = item.link ? 'a' : 'div';
          return (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="group relative aspect-[3/4] rounded-2xl overflow-hidden shadow-md"
            >
              <Wrapper 
                href={item.link} 
                target={item.link ? "_blank" : undefined}
                className={`block w-full h-full ${item.link ? 'cursor-pointer' : ''}`}
              >
                <img src={item.img} alt={item.label} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                  <span className="text-white font-bold text-xs">{item.label}</span>
                </div>
              </Wrapper>
            </motion.div>
          );
        })}
      </div>
    </div>
  </section>
);

// --- Main Page ---

export default function App() {
  return (
    <main className="min-h-screen">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <Navbar />
        <Hero />
        <FeaturedProjects />
        <Simulation />
        <Benefits />
        <Progress />
        <About />
        <CTA />
        <Footer />
      </motion.div>
    </main>
  );
}
