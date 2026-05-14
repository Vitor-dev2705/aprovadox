import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FiStar,
  FiTrendingUp,
  FiZap,
  FiAward,
  FiClock,
  FiHeart,
} from "react-icons/fi";
import { useAuthStore } from "../store/authStore";
import { dashboardService } from "../services/dashboard.service";
import Card from "../components/ui/Card";
import ProgressBar from "../components/ui/ProgressBar";

const FRASES = [
  {
    texto: "A aprovação é inevitável para quem não desiste.",
    autor: "Princípio do AprovadoX",
  },
  {
    texto: "Cada hora de estudo te aproxima do resultado que você merece.",
    autor: "Mentalidade Vencedora",
  },
  {
    texto: "Não estude até acertar. Estude até não errar mais.",
    autor: "Concurseiro de Sucesso",
  },
  {
    texto:
      "O único lugar onde 'sucesso' vem antes de 'trabalho' é no dicionário.",
    autor: "Vidal Sassoon",
  },
  {
    texto: "Sua sequência de hoje é o seu salário de amanhã.",
    autor: "AprovadoX",
  },
  {
    texto: "Quem tem método, não tem pressa. Quem tem pressa, perde o método.",
    autor: "Filosofia Concurseira",
  },
];

const MILESTONES = [
  { horas: 10, label: "Iniciando a jornada", emoji: "🌱" },
  { horas: 50, label: "Estudante comprometido", emoji: "📚" },
  { horas: 100, label: "Cem horas de dedicação", emoji: "💯" },
  { horas: 200, label: "Meio caminho andado", emoji: "🏃" },
  { horas: 500, label: "Maratonista do estudo", emoji: "🏆" },
  { horas: 1000, label: "Mil horas! Você é incrível", emoji: "👑" },
];

export default function Motivacional() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [fraseIdx] = useState(() => new Date().getDate() % FRASES.length);

  useEffect(() => {
    dashboardService
      .get()
      .then((r) => setStats(r.data))
      .catch(() => {});
  }, []);

  const formatarTempo = (minutos) => {
    if (!minutos || minutos <= 0) return '0min';
    const h = Math.floor(minutos / 60);
    const m = Math.round(minutos % 60);
    if (h === 0) return `${m}min`;
    if (m === 0) return `${h}h`;
    return `${h}h${m}min`;
  };

  const totalMes = formatarTempo(stats?.mes_minutos || 0);
  const totalSemana = formatarTempo(stats?.semana_minutos || 0);
  const streak = user?.streak || stats?.streak || 0;
  const xp = user?.xp || 0;

  const frase = FRASES[fraseIdx];
  const nextMilestone =
    MILESTONES.find((m) => m.horas > xp / 10) ||
    MILESTONES[MILESTONES.length - 1];
  const currentMilestone = MILESTONES.slice()
    .reverse()
    .find((m) => m.horas <= xp / 10);

  return (
    <div className="space-y-6 pb-20 lg:pb-0 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-white">Motivação 🌟</h1>
        <p className="text-slate-400 text-sm mt-1">
          Acompanhe seu progresso e mantenha-se motivado
        </p>
      </div>

      {/* Daily quote */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl p-8 bg-gradient-to-br from-brand-500/20 via-dark-700 to-accent-500/15 border border-brand-500/20"
      >
        <div className="absolute top-4 left-6 text-8xl opacity-10 font-serif">
          "
        </div>
        <div className="relative z-10">
          <FiStar size={20} className="text-yellow-400 mb-4" />
          <blockquote className="text-xl font-bold text-white leading-relaxed mb-4">
            "{frase.texto}"
          </blockquote>
          <cite className="text-sm text-slate-400 not-italic">
            — {frase.autor}
          </cite>
        </div>
      </motion.div>

      {/* Personal stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            icon: "🔥",
            value: `${streak}`,
            label: "Dias seguidos",
            color: "text-orange-400",
          },
          {
            icon: "⚡",
            value: `${xp}`,
            label: "XP total",
            color: "text-brand-400",
          },
          {
            icon: "📅",
            value: totalSemana,
            label: "Esta semana",
            color: "text-accent-400",
          },
          {
            icon: "🏆",
            value: `Nível ${user?.level || 1}`,
            label: "Seu nível",
            color: "text-yellow-400",
          },
        ].map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="p-4 text-center">
              <div className="text-2xl mb-1">{s.icon}</div>
              <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Streak visualization */}
      <Card className="p-5">
        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
          <span className="text-orange-400">🔥</span> Sua Sequência
        </h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {Array.from({ length: 30 }, (_, i) => (
            <div
              key={i}
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                i < streak
                  ? "bg-orange-500/30 border border-orange-500/50 text-orange-400"
                  : "bg-dark-600 border border-white/5 text-slate-600"
              }`}
            >
              {i < streak ? "🔥" : "○"}
            </div>
          ))}
        </div>
        <p className="text-sm text-slate-400">
          {streak === 0
            ? "Comece a estudar hoje para iniciar sua sequência!"
            : streak < 7
              ? `Você está em chamas! ${7 - streak} dias para a medalha de 7 dias.`
              : streak < 30
                ? `Incrível! ${30 - streak} dias para o mês completo!`
                : "👑 Você é uma lenda! Sequência de mais de 30 dias!"}
        </p>
      </Card>

      {/* Milestone progress */}
      <Card className="p-5">
        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
          <FiTrendingUp size={16} className="text-brand-400" /> Marcos de
          Progresso
        </h3>
        <div className="space-y-4">
          {MILESTONES.map((m, i) => {
            const horasEstudadas = xp / 10;
            const done = horasEstudadas >= m.horas;
            const active =
              !done && (i === 0 || MILESTONES[i - 1].horas <= horasEstudadas);
            const pct = done
              ? 100
              : active
                ? Math.min(100, (horasEstudadas / m.horas) * 100)
                : 0;
            return (
              <div
                key={i}
                className={`flex items-center gap-4 p-3 rounded-xl transition-all ${done ? "bg-accent-500/10 border border-accent-500/20" : active ? "bg-brand-500/10 border border-brand-500/20" : "opacity-40"}`}
              >
                <span className="text-2xl flex-shrink-0">{m.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-white">
                      {m.label}
                    </span>
                    <span className="text-xs text-slate-500">{m.horas}h</span>
                  </div>
                  <ProgressBar
                    value={pct}
                    color={done ? "success" : "brand"}
                    size="sm"
                  />
                </div>
                {done && (
                  <span className="text-xs text-accent-400 font-bold flex-shrink-0">
                    ✅
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Encouragement */}
      <Card className="p-6 text-center bg-gradient-to-br from-accent-500/10 to-brand-500/10 border-accent-500/20">
        <h3 className="text-lg font-black text-white mb-2">
          Continue assim! 💪
        </h3>
        <p className="text-slate-400 text-sm max-w-md mx-auto">
          {streak > 0
            ? `Você tem uma sequência de ${streak} dias! Cada dia de estudo é um tijolo na construção da sua aprovação.`
            : "Cada grande conquista começa com um pequeno primeiro passo. O seu pode ser hoje!"}
        </p>
      </Card>
    </div>
  );
}
