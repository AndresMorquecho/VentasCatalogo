/**
 * TransactionsTable.tsx
 *
 * PURE RENDER COMPONENT — zero financial logic.
 * Receives TransactionCardDTO[] from the backend and renders cards.
 *
 * REMOVED (now lives exclusively in backend):
 *  ❌ groupTransactions()
 *  ❌ extractOrderInfo()
 *  ❌ getCardTitle()
 *  ❌ getCardType()
 *  ❌ notes string parsing
 *  ❌ transactionGroupId grouping
 *  ❌ movementType filtering / paymentMethod inference
 */

import {
    ArrowUpCircle, ArrowDownCircle,
    Building2, Wallet, Banknote, RefreshCw, CreditCard,
    Loader2, ChevronDown, ChevronUp
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useState } from "react"
import type { TransactionCardDTO, CardMovement, OperationType } from "@/entities/financial-record/model/transactionCard.types"

// ─── Props ───────────────────────────────────────────────────────────────────

interface Props {
    cards: TransactionCardDTO[]
    isLoading?: boolean
}

// ─── Visual config maps (pure display, no logic) ─────────────────────────────

const OPERATION_COLOR: Record<OperationType, { bg: string; text: string; badge: string }> = {
    ABONO:     { bg: 'bg-gradient-to-br from-emerald-50 to-teal-50',  text: 'text-emerald-800', badge: 'bg-emerald-100 text-emerald-700' },
    ENTREGA:   { bg: 'bg-gradient-to-br from-blue-50 to-indigo-50',   text: 'text-blue-800',    badge: 'bg-blue-100 text-blue-700' },
    RECARGA:   { bg: 'bg-gradient-to-br from-violet-50 to-purple-50', text: 'text-violet-800',  badge: 'bg-violet-100 text-violet-700' },
    REEMBOLSO: { bg: 'bg-gradient-to-br from-red-50 to-rose-50',      text: 'text-red-800',     badge: 'bg-red-100 text-red-700' },
    CAMBIO:    { bg: 'bg-gradient-to-br from-amber-50 to-orange-50',  text: 'text-amber-800',   badge: 'bg-amber-100 text-amber-700' },
    TRASPASO:  { bg: 'bg-gradient-to-br from-slate-50 to-gray-50',    text: 'text-slate-700',   badge: 'bg-slate-100 text-slate-600' },
    INTERNO:   { bg: 'bg-gradient-to-br from-slate-50 to-gray-50',    text: 'text-slate-700',   badge: 'bg-slate-100 text-slate-600' },
}

const OPERATION_ICON: Record<OperationType, React.ElementType> = {
    ABONO:     CreditCard,
    ENTREGA:   Building2,
    RECARGA:   Wallet,
    REEMBOLSO: ArrowDownCircle,
    CAMBIO:    RefreshCw,
    TRASPASO:  ArrowUpCircle,
    INTERNO:   ArrowUpCircle,
}

const ACCOUNT_ICON: Record<string, React.ElementType> = {
    CASH:   Banknote,
    BANK:   Building2,
    WALLET: Wallet,
}



// ─── Subcomponent: Movement row ───────────────────────────────────────────────

function MovementRow({ m }: { m: CardMovement }) {
    const Icon = ACCOUNT_ICON[m.accountType] ?? Banknote
    const isIn = m.direction === 'IN'

    return (
        <div className={`flex items-center justify-between py-2 px-3 rounded-lg text-sm
            ${m.informative ? 'opacity-60 border border-dashed border-slate-200 bg-white/50'
                            : isIn ? 'bg-emerald-50/60 border border-emerald-100'
                                   : 'bg-red-50/60 border border-red-100'}`}>
            <div className="flex items-center gap-2 min-w-0">
                <Icon className={`w-4 h-4 flex-shrink-0 ${m.informative ? 'text-slate-400' : isIn ? 'text-emerald-600' : 'text-red-500'}`} />
                <span className="font-medium text-slate-700 text-xs truncate">
                    {m.accountName}
                    {m.informative && <span className="ml-1 text-[10px] text-slate-400 italic">(informativo)</span>}
                </span>
            </div>
            <div className="flex flex-col items-end gap-0.5 flex-shrink-0 ml-2">
                <span className={`font-mono font-bold text-sm ${m.informative ? 'text-slate-400' : isIn ? 'text-emerald-700' : 'text-red-600'}`}>
                    {isIn ? '+' : '-'}${Number(m.amount).toFixed(2)}
                </span>
                {m.balanceAfter != null && (
                    <span className="text-[10px] text-slate-400 font-mono">
                        Saldo: ${Number(m.balanceAfter).toFixed(2)}
                    </span>
                )}
            </div>
        </div>
    )
}

// ─── Subcomponent: Single card ────────────────────────────────────────────────

function TransactionCard({ card }: { card: TransactionCardDTO }) {
    const [expanded, setExpanded] = useState(false)
    let colors = OPERATION_COLOR[card.operationType] ?? OPERATION_COLOR.INTERNO
    let Icon = OPERATION_ICON[card.operationType] ?? CreditCard

    if (card.title === 'USO_BILLETERA') {
        colors = { bg: 'bg-gradient-to-br from-violet-50 to-purple-50', text: 'text-violet-800',  badge: 'bg-violet-100 text-violet-700' }
        Icon = Wallet
    }

    const isNegative = card.totalAmount < 0
    const amountColor = isNegative 
        ? (card.title === 'USO_BILLETERA' ? 'text-violet-600' : 'text-red-600') 
        : colors.text
    const formattedDate = (() => {
        try { return format(new Date(card.date), "dd MMM yyyy · HH:mm", { locale: es }) }
        catch { return card.date }
    })()

    return (
        <div className={`rounded-xl border border-slate-200/80 shadow-sm overflow-hidden
            hover:shadow-md transition-shadow duration-200 ${colors.bg}`}>

            {/* ── Header ── */}
            <button
                className="w-full text-left"
                onClick={() => setExpanded(v => !v)}
                aria-expanded={expanded}
            >
                <div className="flex items-start justify-between p-4 gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${colors.badge}`}>
                            <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                            {/* Title + operation badge */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-sm font-black tracking-tight ${colors.text}`}>
                                    {card.titleLabel.toUpperCase()}
                                </span>
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${colors.badge}`}>
                                    {card.operationType}
                                </span>
                            </div>
                            {/* Date · User */}
                            <p className="text-[11px] text-slate-500 mt-0.5">
                                {formattedDate} · {card.createdBy}
                                {card.reference && card.reference.length < 30 && (
                                    <span className="ml-1 font-mono text-slate-400">· {card.reference}</span>
                                )}
                            </p>
                        </div>
                    </div>

                    {/* Amount + expand toggle */}
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className={`text-lg font-black font-mono ${amountColor}`}>
                            {isNegative ? '-' : '+'}${Number(Math.abs(card.totalAmount)).toFixed(2)}
                        </span>
                        {expanded
                            ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                            : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                    </div>
                </div>
            </button>

            {/* ── Expanded Body ── */}
            {expanded && (
                <div className="px-4 pb-4 space-y-4 border-t border-slate-200/60">

                    {/* Metadata grid */}
                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-5 gap-3">
                        {/* Col 1: Empresaria */}
                        <div className="space-y-0.5 min-w-0">
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">Empresaria</span>
                            <p className="text-sm font-bold text-slate-800 line-clamp-1">{card.clientName || '—'}</p>
                            {card.clientDocument && (
                                <p className="text-[10px] font-mono text-slate-500 truncate">ID: {card.clientDocument}</p>
                            )}
                        </div>

                        {/* Col 2: N° Orden(es) */}
                        <div className="space-y-0.5">
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">N° Orden</span>
                            <p className="text-xs font-mono font-bold text-slate-600 bg-slate-100/50 px-1.5 py-0.5 rounded w-fit line-clamp-2">
                                {card.orders.length > 0 ? card.orders.map(o => o.receiptNumber).join(', ') : '—'}
                            </p>
                        </div>

                        {/* Col 3: N° Pedido(s) */}
                        <div className="space-y-0.5">
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">N° Pedido</span>
                            <p className="text-xs font-mono text-slate-500 line-clamp-2">
                                {card.orders.length > 0
                                    ? card.orders.map(o => o.orderNumber ?? '—').join(', ')
                                    : '—'}
                            </p>
                        </div>

                        {/* Col 4: Marca(s) */}
                        <div className="space-y-0.5">
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">Marca</span>
                            <p className="text-xs font-black text-slate-700 truncate">
                                {card.brands.length > 0 ? card.brands.join(', ') : '—'}
                            </p>
                        </div>

                        {/* Col 5: Tipo */}
                        <div className="space-y-0.5">
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">Tipo</span>
                            <p className={`text-[11px] font-bold uppercase tracking-tighter truncate ${colors.text}`}>
                                {card.operationType}
                            </p>
                        </div>
                    </div>

                    {/* Observaciones extraídas del campo description/notes */}
                    {card.notes && (
                        <div className="bg-slate-50/70 p-3 flex flex-col gap-1 rounded border border-slate-100 mt-3">
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">Observaciones</span>
                            <p className="text-xs text-slate-600 whitespace-pre-wrap">{card.notes}</p>
                        </div>
                    )}

                    {/* Financial flags */}
                    <div className="flex flex-wrap mt-3 gap-1.5">
                        {card.affectsCash  && <span className="text-[10px] flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold"><Banknote className="w-3 h-3" /> Caja</span>}
                        {card.affectsBank  && <span className="text-[10px] flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold"><Building2 className="w-3 h-3" /> Banco</span>}
                        {card.affectsWallet && <span className="text-[10px] flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-semibold"><Wallet className="w-3 h-3" /> Billetera</span>}
                        {card.isInternal   && <span className="text-[10px] flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-semibold"><RefreshCw className="w-3 h-3 p-[1px]" /> Interno</span>}
                    </div>

                    {/* Movements */}
                    {card.movements.length > 0 && (
                        <div className="space-y-1.5">
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">Movimientos</span>
                            {card.movements.map((m, i) => (
                                <MovementRow key={i} m={m} />
                            ))}
                        </div>
                    )}

                    {card.movements.length === 0 && (
                        <p className="text-xs text-slate-400 italic text-center py-1">Sin movimiento monetario (mismo valor)</p>
                    )}
                </div>
            )}
        </div>
    )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function TransactionsTable({ cards, isLoading }: Props) {
    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-7 h-7 animate-spin text-slate-400" />
            </div>
        )
    }

    if (!cards.length) {
        return (
            <div className="text-center py-16 text-slate-400">
                <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">No hay transacciones registradas</p>
            </div>
        )
    }

    return (
        <div className="space-y-3">
            {cards.map(card => (
                <TransactionCard key={card.id} card={card} />
            ))}
        </div>
    )
}
