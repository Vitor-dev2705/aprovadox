import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  FiBookOpen,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiChevronDown,
  FiClock,
  FiEdit,
  FiExternalLink,
  FiList,
} from "react-icons/fi"

import { materiaService } from "../services/materia.service"
import { conteudoService } from "../services/conteudo.service"

import Card from "../components/ui/Card"
import Button from "../components/ui/Button"
import Modal from "../components/ui/Modal"
import Input from "../components/ui/Input"
import EmptyState from "../components/ui/EmptyState"
import Loader from "../components/ui/Loader"
import PageHeader from "../components/ui/PageHeader"

import toast from "react-hot-toast"

const CORES = [
  "#6366f1",
  "#10b981",
  "#f59e0b",
  "#3b82f6",
  "#ec4899",
  "#8b5cf6",
  "#ef4444",
  "#06b6d4",
  "#84cc16",
  "#f97316",
]

const EMPTY_FORM = {
  nome: "",
  cor: "#6366f1",
  conteudos_texto: "",
}

const EMPTY_CONTEUDO = {
  titulo: "",
  tipo: "anotacao",
  url: "",
  descricao: "",
}

const TIPOS_CONTEUDO = [
  {
    value: "anotacao",
    label: "Anotação",
    icon: FiEdit,
    color: "#64748b",
  },
]

const getTipoInfo = (tipo) =>
  TIPOS_CONTEUDO.find((t) => t.value === tipo) ||
  TIPOS_CONTEUDO[0]

/* ==================================================
   FORMATADOR TEMPO
================================================== */

function formatarTempo(minutosTotal) {
  const minutos = minutosTotal || 0

  const horas = Math.floor(minutos / 60)
  const minutosRestantes = minutos % 60

  if (horas === 0) return `${minutosRestantes}min`
  if (minutosRestantes === 0) return `${horas}h`

  return `${horas}h ${minutosRestantes}min`
}

/* ==================================================
   ITEM CONTEÚDO
================================================== */

function ConteudoItem({
  conteudo,
  onDelete,
  onEdit,
}) {
  const info = getTipoInfo(conteudo.tipo)
  const Icon = info.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="group flex items-start gap-3 p-3 rounded-xl border border-white/5 bg-dark-600/30 hover:border-white/10 transition-all"
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{
          backgroundColor: info.color + "20",
          border: `1px solid ${info.color}40`,
        }}
      >
        <Icon
          size={16}
          style={{ color: info.color }}
        />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">
          {conteudo.titulo}
        </p>

        <span
          className="text-[10px] uppercase tracking-wider font-bold"
          style={{ color: info.color }}
        >
          {info.label}
        </span>

        {conteudo.descricao && (
          <p className="text-xs text-slate-500 mt-1 line-clamp-2">
            {conteudo.descricao}
          </p>
        )}

        {conteudo.url && (
          <a
            href={conteudo.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-brand-400 mt-1"
          >
            <FiExternalLink size={11} />
            Abrir link
          </a>
        )}
      </div>

      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(conteudo)}
          className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5"
        >
          <FiEdit2 size={12} />
        </button>

        <button
          onClick={() => onDelete(conteudo.id)}
          className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10"
        >
          <FiTrash2 size={12} />
        </button>
      </div>
    </motion.div>
  )
}

/* ==================================================
   CARD MATÉRIA
================================================== */

function MateriaCard({
  materia,
  onEdit,
  onDelete,
  onAddConteudo,
}) {
  const [expanded, setExpanded] =
    useState(false)

  const [conteudos, setConteudos] =
    useState([])

  const [loadingConteudos, setLoadingConteudos] =
    useState(false)

  const tempoEstudado = formatarTempo(
    materia.horas_estudadas
  )

  const totalConteudos =
    conteudos.length ||
    materia.total_conteudos ||
    0

  const loadConteudos = async () => {
    setLoadingConteudos(true)

    try {
      const r =
        await conteudoService.getByMateria(
          materia.id
        )

      setConteudos(r.data || [])
    } catch {
      setConteudos([])
    } finally {
      setLoadingConteudos(false)
    }
  }

  useEffect(() => {
    if (expanded) loadConteudos()
  }, [expanded])

  const handleDeleteConteudo =
    async (id) => {
      if (
        !confirm(
          "Remover este conteúdo?"
        )
      )
        return

      try {
        await conteudoService.delete(id)

        setConteudos((prev) =>
          prev.filter(
            (c) => c.id !== id
          )
        )

        toast.success(
          "Conteúdo removido"
        )
      } catch {
        toast.error(
          "Erro ao remover"
        )
      }
    }

  return (
    <Card
      accent={materia.cor}
      className="overflow-hidden"
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{
                backgroundColor:
                  materia.cor + "25",
                border: `1px solid ${materia.cor}50`,
              }}
            >
              <FiBookOpen
                size={22}
                style={{
                  color: materia.cor,
                }}
              />
            </div>

            <div>
              <h3 className="font-bold text-white">
                {materia.nome}
              </h3>

              <div className="flex gap-3 text-xs text-slate-500 mt-1">
                <span className="flex gap-1 items-center">
                  <FiClock size={11} />
                  {tempoEstudado}
                </span>

                <span className="flex gap-1 items-center">
                  <FiList size={11} />
                  {totalConteudos} conteúdos
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-1">
            <button
              onClick={() =>
                onEdit(materia)
              }
              className="p-1.5 rounded-lg text-slate-500 hover:text-white"
            >
              <FiEdit2 size={14} />
            </button>

            <button
              onClick={() =>
                onDelete(materia.id)
              }
              className="p-1.5 rounded-lg text-slate-500 hover:text-red-400"
            >
              <FiTrash2 size={14} />
            </button>
          </div>
        </div>

        <button
          onClick={() =>
            setExpanded(!expanded)
          }
          className="w-full flex items-center justify-between py-2.5 px-3 rounded-xl bg-dark-600/50 text-sm text-brand-400"
        >
          <span className="flex items-center gap-2">
            <FiList size={14} />
            {expanded
              ? "Recolher conteúdos"
              : "Ver conteúdos"}
          </span>

          <motion.div
            animate={{
              rotate: expanded
                ? 180
                : 0,
            }}
          >
            <FiChevronDown
              size={14}
            />
          </motion.div>
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{
                height: 0,
                opacity: 0,
              }}
              animate={{
                height: "auto",
                opacity: 1,
              }}
              exit={{
                height: 0,
                opacity: 0,
              }}
              className="overflow-hidden"
            >
              <div className="pt-4 mt-4 border-t border-white/5">
                {loadingConteudos ? (
                  <div className="py-4 text-center">
                    Carregando...
                  </div>
                ) : conteudos.length ===
                  0 ? (
                  <p className="text-xs text-slate-500 text-center py-4">
                    Nenhum conteúdo ainda.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {conteudos.map(
                      (c) => (
                        <ConteudoItem
                          key={c.id}
                          conteudo={c}
                          onDelete={
                            handleDeleteConteudo
                          }
                          onEdit={(
                            item
                          ) =>
                            onAddConteudo(
                              materia,
                              item,
                              loadConteudos
                            )
                          }
                        />
                      )
                    )}
                  </div>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  className="w-full mt-3"
                  icon={
                    <FiPlus size={12} />
                  }
                  onClick={() =>
                    onAddConteudo(
                      materia,
                      null,
                      loadConteudos
                    )
                  }
                >
                  Adicionar Conteúdo
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  )
}