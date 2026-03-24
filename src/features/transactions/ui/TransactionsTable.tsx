import {
    ArrowUpCircle,
    Building2, Wallet, Banknote, RefreshCw, CreditCard, Loader2
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import type { FinancialRecord } from "@/entities/financial-record/model/types"

interface Props {
    transactions: FinancialRecord[]
    onView: (t: FinancialRecord) => void
    isLoading?: boolean
}

// ─── Group transactions by transactionGroupId ────────────────────────────────
// For wallet recharges, ValidateWalletRecharges generates 2 records (INCOME + INTERNAL)
// with the same transactionGroupId. We merge them into a single card using INCOME as
// the primary record and INTERNAL as the wallet leg.

interface TransactionGroup {
    primary: FinancialRecord
    walletLeg?: FinancialRecord // INTERNAL leg of a wallet recharge group
}

function extractOrderInfo(notes: string | null | undefined): { 
    id?: string;         // Identification number (Cédula)
    ordenNumber?: string; // System ID (OR-...)
    pedidoNumber?: string; // Catalog ID (PD-...)
    brandName?: string; 
    orderType?: string;
    comprobante?: string;
    isInitial?: boolean 
} {
    if (!notes) return {}
    
    // Normalize notes for initial check
    const n = notes.toLowerCase()
    const isInitial = n.includes('inicial')

    // Improved Regex: Search for the key and capture until the next pipe or end of string
    const getMatch = (keyPattern: string) => {
        const regex = new RegExp(`${keyPattern}:\\s*([^|\\n\\r]+)`, 'i')
        const match = notes.match(regex)
        return match?.[1]?.trim()
    }

    const id = getMatch('C[eé]dula') || getMatch('ID') || getMatch('IDENTIFICACI[OÓ]N')
    const orden = getMatch('Orden')
    const pedido = getMatch('Pedido')
    const brand = getMatch('Marca')
    const type = getMatch('Tipo')
    const comp = getMatch('Comprobante')
    
    // Additional fallback for old records using "Recibo" instead of "Orden"
    const fallbackOrden = orden || getMatch('Recibo')

    return {
        id,
        ordenNumber: fallbackOrden,
        pedidoNumber: pedido,
        brandName: brand,
        orderType: type,
        comprobante: comp,
        isInitial
    }
}

function groupTransactions(transactions: FinancialRecord[]): TransactionGroup[] {
    const grouped = new Map<string, FinancialRecord[]>()
    const ungrouped: FinancialRecord[] = []

    for (const t of transactions) {
        if (t.transactionGroupId) {
            const existing = grouped.get(t.transactionGroupId) ?? []
            existing.push(t)
            grouped.set(t.transactionGroupId, existing)
        } else {
            ungrouped.push(t)
        }
    }

    const result: TransactionGroup[] = []

    // Process grouped records
    for (const [, records] of grouped) {
        const income = records.find(r => r.movementType === 'INCOME')
        const internal = records.find(r => r.movementType === 'INTERNAL')

        if (income && internal) {
            // Wallet recharge pair: show as one card
            result.push({ primary: income, walletLeg: internal })
        } else {
            // Other groups or incomplete pairs: show each individually
            for (const r of records) result.push({ primary: r })
        }
    }

    // Add ungrouped records, but SKIP CREDIT_GENERATION (internal accounting only)
    for (const t of ungrouped) {
        if (t.type !== 'CREDIT_GENERATION') {
            result.push({ primary: t })
        }
    }

    // Re-sort by date descending (most recent first)
    result.sort((a, b) => new Date(b.primary.date).getTime() - new Date(a.primary.date).getTime())

    return result
}

// ─── Card type detection ────────────────────────────────────────────────────

type CardType = 'wallet-recharge' | 'wallet-use' | 'cash' | 'bank' | 'exchange'

function getCardType(t: FinancialRecord): CardType {
    const type = t.type as string
    const source = t.source as string
    const pm = t.paymentMethod

    // CREDIT_APPLICATION: Depends on source
    if (type === 'CREDIT_APPLICATION') {
        // Cash return from reception overpayment
        if (source === 'CASH_RETURN') return 'cash'
        
        // Distribution to wallet (shows as recharge)
        if (source === 'CREDIT_DISTRIBUTION' && !t.orderId) return 'wallet-recharge'
        
        // Distribution to another order (shows as wallet use)
        if (source === 'CREDIT_DISTRIBUTION' && t.orderId) return 'wallet-use'
    }

    // Exchange types
    if (['EXCHANGE_SAME_VALUE', 'EXCHANGE_ADDITIONAL_CHARGE', 'EXCHANGE_CREDIT', 'CASH_RETURN'].includes(type)) {
        if (type === 'CASH_RETURN') return 'cash'
        return 'exchange'
    }

    // Wallet use: payment with wallet/credit
    if (pm === 'BILLETERA_VIRTUAL' || pm === 'CREDITO_CLIENTE' || pm === 'SALDO_A_FAVOR') {
        return 'wallet-use'
    }

    // Wallet recharge: MANUAL source going to wallet or bank (the income leg)
    if (source === 'MANUAL' && (
        t.toAccountType === 'WALLET' ||
        t.toAccountType === 'BANK_ACCOUNT'
    )) {
        return 'wallet-recharge'
    }

    // Cash
    if (pm === 'EFECTIVO') return 'cash'

    // Bank (TRANSFERENCIA, DEPOSITO, CHEQUE)
    if (pm === 'TRANSFERENCIA' || pm === 'DEPOSITO' || pm === 'CHEQUE') return 'bank'

    // Fallback by movementType
    if (t.movementType === 'INTERNAL') return 'wallet-use'
    return 'bank'
}

// ─── Labels ─────────────────────────────────────────────────────────────────

function getCardTitle(t: FinancialRecord, cardType: CardType): string {
    const type = t.type as string
    const source = t.source as string
    
    switch (cardType) {
        case 'wallet-recharge': {
            // CREDIT_APPLICATION to wallet from reception
            if (type === 'CREDIT_APPLICATION' && source === 'CREDIT_DISTRIBUTION') {
                return 'Recarga Billetera Virtual'
            }
            return 'Recarga Billetera Virtual'
        }
        case 'wallet-use': {
            const info = extractOrderInfo(t.notes)
            if (info.isInitial) return 'Pedido Inicial — Billetera'
            if (type === 'EXCHANGE_CREDIT') return 'Crédito por Cambio'
            return 'Uso de Billetera Virtual'
        }
        case 'cash': {
            const info = extractOrderInfo(t.notes)
            // CREDIT_APPLICATION with CASH_RETURN source
            if (type === 'CREDIT_APPLICATION' && source === 'CASH_RETURN') {
                return 'Devolución en Efectivo'
            }
            if (type === 'CASH_RETURN') return 'Devolución en Efectivo'
            if (info.isInitial) return 'Pedido Inicial — Efectivo'
            return 'Pago en Efectivo'
        }
        case 'bank': {
            const info = extractOrderInfo(t.notes)
            const pm = t.paymentMethod
            let base = 'Movimiento Bancario'
            if (pm === 'TRANSFERENCIA') base = 'Transferencia Bancaria'
            if (pm === 'DEPOSITO') base = 'Depósito Bancario'
            if (pm === 'CHEQUE') base = 'Pago con Cheque'
            
            if (info.isInitial) return `Pedido Inicial — ${base}`
            return base
        }
        case 'exchange': {
            if (type === 'EXCHANGE_SAME_VALUE') return 'Cambio — Mismo Valor'
            if (type === 'EXCHANGE_ADDITIONAL_CHARGE') return 'Cargo Adicional por Cambio'
            if (type === 'EXCHANGE_CREDIT') return 'Crédito por Cambio'
            return 'Cambio'
        }
    }
}

function getSubBadge(t: FinancialRecord, cardType: CardType): string | null {
    if (cardType === 'wallet-use') {
        const src = t.source as string
        if (src === 'ORDER_PAYMENT') return 'Abono a Pedido'
        if (src === 'EXCHANGE') return 'Crédito por Cambio'
        if (src === 'CREDIT_DISTRIBUTION') return 'Distribución de Saldo'
        return null
    }
    return null
}

// ─── Color themes ────────────────────────────────────────────────────────────

interface Theme {
    bg: string; border: string; icon: string; amount: string
    badge: string; headerIcon: React.ElementType
}

function getTheme(cardType: CardType, movementType: string): Theme {
    switch (cardType) {
        case 'wallet-recharge':
            return {
                bg: 'bg-violet-50/50', border: 'border-violet-200',
                icon: 'text-violet-500', amount: 'text-violet-700',
                badge: 'bg-violet-100 text-violet-700', headerIcon: Wallet
            }
        case 'wallet-use':
            return {
                bg: 'bg-purple-50/40', border: 'border-purple-200',
                icon: 'text-purple-500', amount: 'text-purple-700',
                badge: 'bg-purple-100 text-purple-700', headerIcon: CreditCard
            }
        case 'cash':
            if (movementType === 'EXPENSE') return {
                bg: 'bg-red-50/40', border: 'border-red-200',
                icon: 'text-red-500', amount: 'text-red-600',
                badge: 'bg-red-100 text-red-700', headerIcon: ArrowUpCircle
            }
            return {
                bg: 'bg-emerald-50/40', border: 'border-emerald-200',
                icon: 'text-emerald-600', amount: 'text-emerald-700',
                badge: 'bg-emerald-100 text-emerald-700', headerIcon: Banknote
            }
        case 'bank':
            if (movementType === 'EXPENSE') return {
                bg: 'bg-amber-50/40', border: 'border-amber-200',
                icon: 'text-amber-600', amount: 'text-amber-700',
                badge: 'bg-amber-100 text-amber-700', headerIcon: ArrowUpCircle
            }
            return {
                bg: 'bg-blue-50/40', border: 'border-blue-200',
                icon: 'text-blue-600', amount: 'text-blue-700',
                badge: 'bg-blue-100 text-blue-700', headerIcon: Building2
            }
        case 'exchange':
            return {
                bg: 'bg-orange-50/40', border: 'border-orange-200',
                icon: 'text-orange-500', amount: 'text-orange-700',
                badge: 'bg-orange-100 text-orange-700', headerIcon: RefreshCw
            }
    }
}

// ─── Amount sign helper ──────────────────────────────────────────────────────

function amountPrefix(movementType: string): string {
    if (movementType === 'INCOME') return '+'
    if (movementType === 'EXPENSE') return '-'
    return '↔'
}

// ─── Main component ──────────────────────────────────────────────────────────

export function TransactionsTable({ transactions, onView, isLoading }: Props) {
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-24 bg-white rounded-2xl border border-slate-100 space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-monchito-purple" />
                <p className="text-sm font-medium text-slate-400">Cargando transacciones...</p>
            </div>
        )
    }

    if (transactions.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
                <p className="text-sm font-medium text-slate-400">No hay transacciones registradas.</p>
            </div>
        )
    }

    const groups = groupTransactions(transactions)

    return (
        <div className="space-y-3">
            {groups.map(({ primary: t, walletLeg }) => {
                const cardType = getCardType(t)
                const theme = getTheme(cardType, t.movementType)
                const title = getCardTitle(t, cardType)
                const subBadge = getSubBadge(t, cardType)
                const Icon = theme.headerIcon

                return (
                    <div
                        key={t.id}
                        onClick={() => onView(t)}
                        className={`rounded-2xl border ${theme.border} ${theme.bg} p-3 cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-[1.002]`}
                    >
                        {/* ── Header ── */}
                        <div className="flex items-start justify-between gap-4 mb-2">
                            <div className="flex items-center gap-2.5">
                                <Icon className={`h-5 w-5 shrink-0 ${theme.icon}`} />
                                <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="text-sm font-black text-slate-800">{title}</p>
                                        {subBadge && (
                                            <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${theme.badge}`}>
                                                {subBadge}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-0.5">
                                        {format(new Date(t.date), "dd MMM yyyy · HH:mm", { locale: es })}
                                        {t.createdBy && <span className="ml-2 text-slate-300">· {t.createdBy}</span>}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right shrink-0">
                                <p className={`text-xl font-black ${theme.amount} leading-none`}>
                                    {amountPrefix(t.movementType)}${t.amount.toFixed(2)}
                                </p>
                                {t.balanceAfter != null && (
                                    <div className="mt-1 flex flex-col items-end">
                                        <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest leading-none">Saldo Final</span>
                                        <p className="text-sm font-black text-slate-800 font-mono tracking-tighter">
                                            ${t.balanceAfter.toFixed(2)}
                                        </p>
                                    </div>
                                )}
                                {t.userReference && (
                                    <p className="text-[10px] font-mono text-slate-400 mt-1">
                                        {t.source === 'ORDER_PAYMENT' ? 'Recibo' : 'Comprobante'}: {t.userReference}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* ── Standardized Metadata Grid (Universal for all card types) ── */}
                        <div className="mb-4 grid grid-cols-2 sm:grid-cols-5 gap-4 px-1">
                            {/* Col 1: Empresaria */}
                            <div className="space-y-0.5 min-w-0">
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">Empresaria</span>
                                <p className="text-sm font-bold text-slate-800 line-clamp-1">{t.clientName || '—'}</p>
                                {(() => {
                                    const info = extractOrderInfo(t.notes)
                                    const id = info.id || t.clientDocument
                                    return id ? (
                                        <p className="text-[10px] font-mono text-slate-500 truncate">ID: {id}</p>
                                    ) : null
                                })()}
                            </div>

                            {/* Col 2: N° Orden */}
                            {(() => {
                                const info = extractOrderInfo(t.notes)
                                return (
                                    <div className="space-y-0.5">
                                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">N° Orden</span>
                                        <p className="text-xs font-mono font-bold text-slate-600 bg-slate-100/50 px-1.5 py-0.5 rounded w-fit">
                                            {info.ordenNumber || '—'}
                                        </p>
                                    </div>
                                )
                            })()}

                            {/* Col 3: N° Pedido */}
                            {(() => {
                                const info = extractOrderInfo(t.notes)
                                return (
                                    <div className="space-y-0.5">
                                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">N° Pedido</span>
                                        <p className="text-xs font-mono text-slate-500 truncate">
                                            {info.pedidoNumber || (t.orderId ? t.orderId.slice(-8).toUpperCase() : '—')}
                                        </p>
                                    </div>
                                )
                            })()}

                            {/* Col 4: Marca */}
                            {(() => {
                                const info = extractOrderInfo(t.notes)
                                return (
                                    <div className="space-y-0.5">
                                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">Marca</span>
                                        <p className="text-xs font-black text-slate-700 truncate">{info.brandName || '—'}</p>
                                    </div>
                                )
                            })()}

                            {/* Col 5: Tipo / Concepto */}
                            {(() => {
                                const info = extractOrderInfo(t.notes)
                                let concept = info.orderType || t.type
                                if (t.type === 'CASH_RETURN') concept = 'Reembolso'
                                if (cardType === 'wallet-recharge') concept = 'Recarga'
                                
                                return (
                                    <div className="space-y-0.5">
                                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">Tipo</span>
                                        <p className="text-[11px] font-bold text-monchito-purple uppercase tracking-tighter truncate">
                                            {concept || 'General'}
                                        </p>
                                    </div>
                                )
                            })()}
                        </div>

                        {/* ── Movimientos y Saldo ── */}
                        <MovimientosSection t={t} cardType={cardType} walletLeg={walletLeg} />
                    </div>
                )
            })}
        </div>
    )
}

// ─── Movimientos section per card type ──────────────────────────────────────

function MovimientosSection({ t, cardType, walletLeg }: {
    t: FinancialRecord
    cardType: CardType
    walletLeg?: FinancialRecord
}) {
    const hasBankBalance = t.balanceBefore != null && t.balanceAfter != null

    return (
        <>
            <div className="flex items-center gap-2 mb-2.5">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Movimientos</span>
                <div className="flex-1 h-px bg-slate-200" />
            </div>
            <div className="space-y-2">
        {cardType === 'wallet-recharge' && <WalletRechargeMovements t={t} hasBankBalance={hasBankBalance} walletLeg={walletLeg} />}
                {cardType === 'wallet-use' && <WalletUseMovements t={t} />}
                {cardType === 'cash' && <CashMovements t={t} hasBankBalance={hasBankBalance} />}
                {cardType === 'bank' && <BankMovements t={t} hasBankBalance={hasBankBalance} />}
                {cardType === 'exchange' && <ExchangeMovements t={t} hasBankBalance={hasBankBalance} />}
            </div>
        </>
    )
}

// Card 1: Recarga Billetera Virtual
// Banco (real, con saldo) + Billetera Virtual (informativo)
// Handles both manual recharges and credit distributions from reception
function WalletRechargeMovements({ t, hasBankBalance, walletLeg }: {
    t: FinancialRecord
    hasBankBalance: boolean
    walletLeg?: FinancialRecord
}) {
    const type = t.type as string
    const source = t.source as string
    
    // CREDIT_APPLICATION from reception (distribution to wallet)
    if (type === 'CREDIT_APPLICATION' && source === 'CREDIT_DISTRIBUTION') {
        // This is a credit distribution to wallet - show as informative only
        // The actual bank movement happened when the order was originally paid
        const hasWalletBalance = t.balanceBefore != null && t.balanceAfter != null
        return (
            <>
                <MovementRow
                    icon={<Building2 className="h-3.5 w-3.5 text-blue-500" />}
                    label={t.bankAccountName || 'Cuenta Bancaria'}
                    detail="Saldo a favor aplicado"
                    delta={t.amount}
                    balanceBefore={undefined}
                    balanceAfter={undefined}
                    deltaColor="text-emerald-600"
                    informative={true}
                />
                <MovementRow
                    icon={<Wallet className="h-3.5 w-3.5 text-purple-500" />}
                    label="Billetera Virtual"
                    detail={t.clientName}
                    delta={t.amount}
                    balanceBefore={hasWalletBalance ? t.balanceBefore : undefined}
                    balanceAfter={hasWalletBalance ? t.balanceAfter : undefined}
                    deltaColor="text-purple-600"
                    informative={false}
                />
            </>
        )
    }
    
    // Manual recharge: t is always the INCOME record (bank leg). walletLeg is the INTERNAL record.
    const walletAmount = walletLeg?.amount ?? t.amount
    const hasWalletBalance = walletLeg?.balanceBefore != null && walletLeg?.balanceAfter != null
    return (
        <>
            <MovementRow
                icon={<Building2 className="h-3.5 w-3.5 text-blue-500" />}
                label={t.bankAccountName || 'Cuenta Bancaria'}
                detail={t.bankAccountName || '—'}
                delta={t.amount}
                balanceBefore={hasBankBalance ? t.balanceBefore : undefined}
                balanceAfter={hasBankBalance ? t.balanceAfter : undefined}
                deltaColor="text-emerald-600"
                informative={false}
            />
            <MovementRow
                icon={<Wallet className="h-3.5 w-3.5 text-purple-500" />}
                label="Billetera Virtual"
                detail={t.clientName}
                delta={walletAmount}
                balanceBefore={hasWalletBalance ? walletLeg!.balanceBefore : undefined}
                balanceAfter={hasWalletBalance ? walletLeg!.balanceAfter : undefined}
                deltaColor="text-purple-600"
                informative={true}
            />
        </>
    )
}

// Card 2: Uso de Billetera Virtual
// Solo billetera (real, resta)
function WalletUseMovements({ t }: { t: FinancialRecord }) {
    const hasWalletBalance = t.balanceBefore != null && t.balanceAfter != null
    return (
        <MovementRow
            icon={<Wallet className="h-3.5 w-3.5 text-purple-500" />}
            label="Billetera Virtual"
            detail={t.clientName}
            delta={-t.amount}
            balanceBefore={hasWalletBalance ? t.balanceBefore : undefined}
            balanceAfter={hasWalletBalance ? t.balanceAfter : undefined}
            deltaColor="text-red-500"
            informative={false}
        />
    )
}

// Card 3: Efectivo
function CashMovements({ t, hasBankBalance }: { t: FinancialRecord; hasBankBalance: boolean }) {
    const type = t.type as string
    const source = t.source as string
    const isExpense = t.movementType === 'EXPENSE'
    
    // CREDIT_APPLICATION with CASH_RETURN source (devolución en efectivo)
    if (type === 'CREDIT_APPLICATION' && source === 'CASH_RETURN') {
        return (
            <MovementRow
                icon={<Banknote className="h-3.5 w-3.5 text-red-500" />}
                label={t.bankAccountName || 'Caja / Efectivo'}
                detail="Devolución al cliente"
                delta={-t.amount}
                balanceBefore={hasBankBalance ? t.balanceBefore : undefined}
                balanceAfter={hasBankBalance ? t.balanceAfter : undefined}
                deltaColor="text-red-500"
                informative={false}
            />
        )
    }
    
    // Regular cash payment
    const delta = isExpense ? -t.amount : t.amount
    return (
        <MovementRow
            icon={<Banknote className="h-3.5 w-3.5 text-emerald-600" />}
            label={t.bankAccountName || 'Caja / Efectivo'}
            detail="Efectivo"
            delta={delta}
            balanceBefore={hasBankBalance ? t.balanceBefore : undefined}
            balanceAfter={hasBankBalance ? t.balanceAfter : undefined}
            deltaColor={isExpense ? 'text-red-500' : 'text-emerald-600'}
            informative={false}
        />
    )
}

// Card 4: Banco
function BankMovements({ t, hasBankBalance }: { t: FinancialRecord; hasBankBalance: boolean }) {
    const isExpense = t.movementType === 'EXPENSE'
    const delta = isExpense ? -t.amount : t.amount
    const methodLabel: Record<string, string> = {
        TRANSFERENCIA: 'Transferencia', DEPOSITO: 'Depósito', CHEQUE: 'Cheque'
    }
    return (
        <MovementRow
            icon={<Building2 className="h-3.5 w-3.5 text-blue-500" />}
            label={t.bankAccountName || 'Cuenta Bancaria'}
            detail={methodLabel[t.paymentMethod || ''] || t.bankAccountName || '—'}
            delta={delta}
            balanceBefore={hasBankBalance ? t.balanceBefore : undefined}
            balanceAfter={hasBankBalance ? t.balanceAfter : undefined}
            deltaColor={isExpense ? 'text-red-500' : 'text-emerald-600'}
            informative={false}
        />
    )
}

// Card 5: Exchange
function ExchangeMovements({ t, hasBankBalance }: { t: FinancialRecord; hasBankBalance: boolean }) {
    const type = t.type as string
    if (type === 'EXCHANGE_SAME_VALUE') {
        return (
            <div className="text-[11px] text-slate-400 text-center py-1">
                Sin movimiento de dinero — cambio por mismo valor
            </div>
        )
    }
    if (type === 'EXCHANGE_ADDITIONAL_CHARGE') {
        return (
            <MovementRow
                icon={<Building2 className="h-3.5 w-3.5 text-orange-500" />}
                label={t.bankAccountName || 'Cuenta'}
                detail="Cargo adicional"
                delta={t.amount}
                balanceBefore={hasBankBalance ? t.balanceBefore : undefined}
                balanceAfter={hasBankBalance ? t.balanceAfter : undefined}
                deltaColor="text-orange-600"
                informative={false}
            />
        )
    }
    // EXCHANGE_CREDIT
    return (
        <MovementRow
            icon={<Wallet className="h-3.5 w-3.5 text-purple-500" />}
            label="Billetera Virtual"
            detail={t.clientName}
            delta={t.amount}
            balanceBefore={undefined}
            balanceAfter={undefined}
            deltaColor="text-purple-600"
            informative={false}
        />
    )
}

// ─── Shared MovementRow ──────────────────────────────────────────────────────

interface MovementRowProps {
    icon: React.ReactNode
    label: string
    detail: string | undefined
    delta: number
    balanceBefore: number | undefined
    balanceAfter: number | undefined
    deltaColor: string
    informative: boolean
}

function MovementRow({ icon, label, detail, delta, balanceBefore, balanceAfter, deltaColor, informative }: MovementRowProps) {
    const hasBalance = balanceBefore != null && balanceAfter != null
    return (
        <div className={`flex items-center justify-between rounded-xl px-3 py-2.5 border ${informative ? 'bg-purple-50/50 border-purple-100' : 'bg-white/80 border-slate-100'}`}>
            <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg border ${informative ? 'bg-purple-50 border-purple-100' : 'bg-slate-50 border-slate-100'}`}>
                    {icon}
                </div>
                <div>
                    <p className="text-xs font-bold text-slate-700">
                        {label}
                        {informative && <span className="ml-1.5 text-[9px] font-semibold text-purple-400 uppercase tracking-wider">(informativo)</span>}
                    </p>
                    {detail && <p className="text-[10px] text-slate-400">{detail}</p>}
                </div>
            </div>
            <div className="text-right">
                <p className={`text-sm font-black ${deltaColor}`}>
                    {delta >= 0 ? '+' : ''}{delta.toFixed(2)}
                </p>
                {hasBalance && (
                    <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                        <span>{balanceBefore!.toFixed(2)}</span>
                        <span className="mx-1 text-slate-300">→</span>
                        <span className="text-sm font-black text-slate-800">{balanceAfter!.toFixed(2)}</span>
                    </p>
                )}
            </div>
        </div>
    )
}
