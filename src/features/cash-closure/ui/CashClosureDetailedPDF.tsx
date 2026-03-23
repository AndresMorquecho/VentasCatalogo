import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import type { CashClosureDetailedReport } from '@/entities/cash-closure/model/detailed-types';

const C = {
    primary: '#6D28D9',
    green: '#16A34A',
    red: '#DC2626',
    blue: '#2563EB',
    violet: '#7C3AED',
    slate900: '#0F172A',
    slate700: '#334155',
    slate500: '#64748B',
    slate300: '#CBD5E1',
    slate100: '#F1F5F9',
    slate50: '#F8FAFC',
    white: '#FFFFFF',
};

const s = StyleSheet.create({
    page: { padding: 32, fontFamily: 'Helvetica', fontSize: 9, backgroundColor: C.white },
    // Header
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottomWidth: 1.5, borderBottomColor: C.primary, paddingBottom: 12 },
    logo: { width: 90, height: 45, objectFit: 'contain' },
    headerRight: { alignItems: 'flex-end' },
    headerTitle: { fontSize: 15, fontFamily: 'Helvetica-Bold', color: C.slate900, marginBottom: 3 },
    headerSub: { fontSize: 8, color: C.slate500 },
    // Section
    sectionHeader: { backgroundColor: C.slate100, padding: '6 10', borderRadius: 4, marginTop: 14, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: C.primary },
    sectionTitle: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.slate700, textTransform: 'uppercase', letterSpacing: 0.8 },
    // Summary cards row
    summaryRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
    summaryCard: { flex: 1, borderRadius: 6, padding: '8 10', alignItems: 'center' },
    summaryLabel: { fontSize: 7, color: C.slate500, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 },
    summaryValue: { fontSize: 13, fontFamily: 'Helvetica-Bold' },
    // Info rows
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3, borderBottomWidth: 1, borderBottomColor: C.slate100 },
    infoLabel: { fontSize: 8, color: C.slate500 },
    infoValue: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.slate700 },
    // Table
    table: { width: '100%', marginBottom: 8 },
    tableHeader: { flexDirection: 'row', borderBottomWidth: 1.5, borderBottomColor: C.slate700, paddingVertical: 4, paddingHorizontal: 2 },
    tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: C.slate100, paddingVertical: 4, paddingHorizontal: 2 },
    tableRowAlt: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: C.slate100, paddingVertical: 4, paddingHorizontal: 2, backgroundColor: C.slate50 },
    th: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.slate700, textTransform: 'uppercase' },
    td: { fontSize: 8, color: C.slate500 },
    tdBold: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.slate900 },
    // Cuadre box
    cuadreBox: { flexDirection: 'row', borderRadius: 6, padding: '8 12', marginBottom: 14, borderWidth: 1 },
    // Signature
    sigRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 40 },
    sigBox: { width: 160, alignItems: 'center' },
    sigLine: { width: '100%', borderTopWidth: 1, borderTopColor: C.slate300, marginBottom: 5 },
    sigLabel: { fontSize: 8, color: C.slate500 },
    sigName: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.slate900, marginTop: 2 },
    // Footer
    footer: { position: 'absolute', bottom: 24, left: 32, right: 32, textAlign: 'center', fontSize: 7, color: C.slate300, borderTopWidth: 1, borderTopColor: C.slate100, paddingTop: 8 },
    // Income block
    incomeBlock: { borderRadius: 5, padding: '6 8', marginBottom: 5, borderWidth: 1 },
    incomeBlockTitle: { fontSize: 8, fontFamily: 'Helvetica-Bold', marginBottom: 3 },
    // Account card
    accountCard: { borderRadius: 5, padding: '6 8', marginBottom: 5, borderWidth: 1, borderColor: C.slate100, backgroundColor: C.slate50 },
    accountName: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.slate900, marginBottom: 4 },
    accountGrid: { flexDirection: 'row' },
    accountCell: { flex: 1, alignItems: 'center' },
    accountCellLabel: { fontSize: 7, color: C.slate500, textTransform: 'uppercase', marginBottom: 2 },
    accountCellValue: { fontSize: 9, fontFamily: 'Helvetica-Bold' },
});

const fmt = (n: number) => `$${(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (d: string) => new Date(d).toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' });
const fmtDateTime = (d: string) => new Date(d).toLocaleString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

interface Props { report: CashClosureDetailedReport; }

export function CashClosureDetailedPDF({ report }: Props) {
    const { fromDate, toDate, closedByName, closedAt, totalIncome, totalExpense, movementCount,
        incomeBySource, walletRechargeByMethod, incomeByMethod, balanceByBank, movementsByUser,
        movements, expectedAmount, actualAmount, difference, notes } = report;

    const netTotal = totalIncome - totalExpense;
    const ibs = incomeBySource || { orderPayments: 0, additionalPayments: 0, walletRecharges: 0, adjustments: 0, manual: 0 };
    const wbm = walletRechargeByMethod || { TRANSFERENCIA: 0, DEPOSITO: 0, CHEQUE: 0 };
    const ibm = incomeByMethod || { EFECTIVO: 0, TRANSFERENCIA: 0, DEPOSITO: 0, CHEQUE: 0 };
    const bbb = balanceByBank || [];
    const mbu = movementsByUser || [];
    const movs = movements || [];

    // Only real movements for detail table (exclude INTERNAL)
    const realMovs = movs.filter(m => m.type !== 'INTERNAL');

    return (
        <Document title={`Cierre de Caja - ${fmtDate(closedAt)}`}>

            {/* ═══════════════════════════════════════════════════════
                PÁGINA 1: Resumen + Ingresos + Egresos + Cuentas
            ═══════════════════════════════════════════════════════ */}
            <Page size="A4" style={s.page}>
                {/* Header */}
                <View style={s.header}>
                    <Image src="/images/mochitopng.png" style={s.logo} />
                    <View style={s.headerRight}>
                        <Text style={s.headerTitle}>REPORTE DE CIERRE DE CAJA</Text>
                        <Text style={s.headerSub}>Generado: {fmtDateTime(closedAt)}</Text>
                        <Text style={s.headerSub}>Responsable: {closedByName || 'Sistema'}</Text>
                        <Text style={s.headerSub}>Periodo: {fmtDate(fromDate)} — {fmtDate(toDate)}</Text>
                    </View>
                </View>

                {/* ── SECCIÓN 1: RESUMEN GENERAL ── */}
                <View style={s.sectionHeader}><Text style={s.sectionTitle}>1. Resumen General</Text></View>
                <View style={s.summaryRow}>
                    <View style={[s.summaryCard, { backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#BBF7D0' }]}>
                        <Text style={s.summaryLabel}>Total Ingresos</Text>
                        <Text style={[s.summaryValue, { color: C.green }]}>{fmt(totalIncome)}</Text>
                    </View>
                    <View style={[s.summaryCard, { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA' }]}>
                        <Text style={s.summaryLabel}>Total Egresos</Text>
                        <Text style={[s.summaryValue, { color: C.red }]}>{fmt(totalExpense)}</Text>
                    </View>
                    <View style={[s.summaryCard, { backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE' }]}>
                        <Text style={s.summaryLabel}>Balance Neto</Text>
                        <Text style={[s.summaryValue, { color: C.blue }]}>{fmt(netTotal)}</Text>
                    </View>
                    <View style={[s.summaryCard, { backgroundColor: C.slate50, borderWidth: 1, borderColor: C.slate300 }]}>
                        <Text style={s.summaryLabel}>Movimientos</Text>
                        <Text style={[s.summaryValue, { color: C.slate700 }]}>{movementCount}</Text>
                    </View>
                </View>

                {/* Cuadre de efectivo */}
                {expectedAmount !== undefined && actualAmount !== undefined && (
                    <View style={[s.cuadreBox, { backgroundColor: Math.abs(difference || 0) > 0.01 ? '#FEF2F2' : '#F0FDF4', borderColor: Math.abs(difference || 0) > 0.01 ? '#FECACA' : '#BBF7D0' }]}>
                        <View style={{ flex: 1, alignItems: 'center' }}>
                            <Text style={[s.summaryLabel]}>Efectivo Sistema</Text>
                            <Text style={[s.summaryValue, { fontSize: 11, color: C.slate700 }]}>{fmt(expectedAmount)}</Text>
                        </View>
                        <View style={{ width: 1, backgroundColor: C.slate300 }} />
                        <View style={{ flex: 1, alignItems: 'center' }}>
                            <Text style={s.summaryLabel}>Efectivo Contado</Text>
                            <Text style={[s.summaryValue, { fontSize: 11, color: C.slate700 }]}>{fmt(actualAmount)}</Text>
                        </View>
                        <View style={{ width: 1, backgroundColor: C.slate300 }} />
                        <View style={{ flex: 1, alignItems: 'center' }}>
                            <Text style={s.summaryLabel}>Estado del Cuadre</Text>
                            <Text style={[s.summaryValue, { fontSize: 10, color: Math.abs(difference || 0) > 0.01 ? C.red : C.green }]}>
                                {Math.abs(difference || 0) < 0.01 ? 'CUADRÓ EXACTO' : (difference! < 0 ? `FALTANTE ${fmt(Math.abs(difference!))}` : `SOBRANTE ${fmt(difference!)}`)}
                            </Text>
                        </View>
                    </View>
                )}

                {notes && notes.trim().length > 0 && (
                    <View style={{ backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FDE68A', borderRadius: 4, padding: '6 8', marginBottom: 10 }}>
                        <Text style={[s.infoLabel, { fontFamily: 'Helvetica-Bold', marginBottom: 2 }]}>Observaciones:</Text>
                        <Text style={s.infoValue}>{notes}</Text>
                    </View>
                )}

                {/* ── SECCIÓN 2: INGRESOS SEPARADOS ── */}
                <View style={s.sectionHeader}><Text style={s.sectionTitle}>2. Ingresos por Tipo</Text></View>

                {ibs.orderPayments > 0 && (
                    <View style={[s.incomeBlock, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={[s.incomeBlockTitle, { color: C.green }]}>Abonos Iniciales (pedidos nuevos)</Text>
                            <Text style={[s.incomeBlockTitle, { color: C.green }]}>{fmt(ibs.orderPayments)}</Text>
                        </View>
                    </View>
                )}
                {ibs.additionalPayments > 0 && (
                    <View style={[s.incomeBlock, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={[s.incomeBlockTitle, { color: C.green }]}>Abonos Posteriores (módulo de abonos)</Text>
                            <Text style={[s.incomeBlockTitle, { color: C.green }]}>{fmt(ibs.additionalPayments)}</Text>
                        </View>
                    </View>
                )}
                {ibs.walletRecharges > 0 && (
                    <View style={[s.incomeBlock, { backgroundColor: '#F5F3FF', borderColor: '#DDD6FE' }]}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                            <Text style={[s.incomeBlockTitle, { color: C.violet }]}>Recargas de Billetera</Text>
                            <Text style={[s.incomeBlockTitle, { color: C.violet }]}>{fmt(ibs.walletRecharges)}</Text>
                        </View>
                        {wbm.TRANSFERENCIA > 0 && <View style={s.infoRow}><Text style={s.infoLabel}>  Transferencia</Text><Text style={s.infoValue}>{fmt(wbm.TRANSFERENCIA)}</Text></View>}
                        {wbm.DEPOSITO > 0 && <View style={s.infoRow}><Text style={s.infoLabel}>  Depósito</Text><Text style={s.infoValue}>{fmt(wbm.DEPOSITO)}</Text></View>}
                        {wbm.CHEQUE > 0 && <View style={s.infoRow}><Text style={s.infoLabel}>  Cheque</Text><Text style={s.infoValue}>{fmt(wbm.CHEQUE)}</Text></View>}
                    </View>
                )}
                {ibs.adjustments > 0 && (
                    <View style={[s.incomeBlock, { backgroundColor: C.slate50, borderColor: C.slate300 }]}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={[s.incomeBlockTitle, { color: C.slate700 }]}>Otros Ingresos / Ajustes</Text>
                            <Text style={[s.incomeBlockTitle, { color: C.slate700 }]}>{fmt(ibs.adjustments)}</Text>
                        </View>
                    </View>
                )}

                {/* Por método */}
                <View style={s.sectionHeader}><Text style={s.sectionTitle}>Distribución por Método de Pago</Text></View>
                <View style={s.table}>
                    <View style={s.tableHeader}>
                        <Text style={[s.th, { width: '50%' }]}>Método</Text>
                        <Text style={[s.th, { width: '30%', textAlign: 'right' }]}>Monto</Text>
                        <Text style={[s.th, { width: '20%', textAlign: 'right' }]}>%</Text>
                    </View>
                    {Object.entries(ibm).filter(([, v]) => v > 0).map(([method, value], i) => (
                        <View key={i} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                            <Text style={[s.td, { width: '50%' }]}>{method}</Text>
                            <Text style={[s.tdBold, { width: '30%', textAlign: 'right' }]}>{fmt(value)}</Text>
                            <Text style={[s.td, { width: '20%', textAlign: 'right' }]}>{((value / (totalIncome || 1)) * 100).toFixed(1)}%</Text>
                        </View>
                    ))}
                </View>

                {/* ── SECCIÓN 3: EGRESOS ── */}
                {totalExpense > 0 && (
                    <>
                        <View style={s.sectionHeader}><Text style={s.sectionTitle}>3. Egresos</Text></View>
                        <View style={[s.incomeBlock, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                <Text style={[s.incomeBlockTitle, { color: C.red }]}>Total Egresos del Periodo</Text>
                                <Text style={[s.incomeBlockTitle, { color: C.red }]}>{fmt(totalExpense)}</Text>
                            </View>
                        </View>
                    </>
                )}

                {/* ── SECCIÓN 4: MOVIMIENTOS POR CUENTA ── */}
                {bbb.length > 0 && (
                    <>
                        <View style={s.sectionHeader}><Text style={s.sectionTitle}>4. Movimientos por Cuenta (Saldo Acumulativo)</Text></View>
                        {bbb.map((acc, i) => (
                            <View key={i} style={s.accountCard}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
                                    <View style={{ backgroundColor: acc.bankAccountType === 'CASH' ? C.primary : C.slate500, borderRadius: 3, padding: '2 5', marginRight: 6 }}>
                                        <Text style={{ fontSize: 7, color: C.white, fontFamily: 'Helvetica-Bold' }}>{acc.bankAccountType === 'CASH' ? 'CAJA' : 'BANCO'}</Text>
                                    </View>
                                    <Text style={s.accountName}>{acc.bankAccountName}</Text>
                                </View>
                                <View style={s.accountGrid}>
                                    <View style={s.accountCell}>
                                        <Text style={s.accountCellLabel}>Saldo Inicial</Text>
                                        <Text style={[s.accountCellValue, { color: C.slate700 }]}>{fmt(acc.initialBalance)}</Text>
                                    </View>
                                    <View style={s.accountCell}>
                                        <Text style={s.accountCellLabel}>Ingresos</Text>
                                        <Text style={[s.accountCellValue, { color: C.green }]}>{fmt(acc.income)}</Text>
                                    </View>
                                    <View style={s.accountCell}>
                                        <Text style={s.accountCellLabel}>Egresos</Text>
                                        <Text style={[s.accountCellValue, { color: C.red }]}>{fmt(acc.expense)}</Text>
                                    </View>
                                    <View style={s.accountCell}>
                                        <Text style={s.accountCellLabel}>Saldo Final</Text>
                                        <Text style={[s.accountCellValue, { color: acc.finalBalance < 0 ? C.red : C.blue }]}>{fmt(acc.finalBalance)}</Text>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </>
                )}

                {/* Firmas */}
                <View style={s.sigRow}>
                    <View style={s.sigBox}>
                        <View style={s.sigLine} />
                        <Text style={s.sigLabel}>Responsable de Caja</Text>
                        <Text style={s.sigName}>{closedByName || 'Administrador'}</Text>
                    </View>
                    <View style={s.sigBox}>
                        <View style={s.sigLine} />
                        <Text style={s.sigLabel}>Revisado / Aprobado</Text>
                        <Text style={s.sigName}>Gerencia / Auditoría</Text>
                    </View>
                </View>

                <Text style={s.footer} render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}  |  Sistema de Gestión Mochito`} fixed />
            </Page>

            {/* ═══════════════════════════════════════════════════════
                PÁGINA 2: Movimientos Detallados
            ═══════════════════════════════════════════════════════ */}
            {realMovs.length > 0 && (
                <Page size="A4" style={s.page}>
                    <View style={s.header}>
                        <Text style={[s.headerTitle, { fontSize: 12 }]}>CIERRE DE CAJA — MOVIMIENTOS DETALLADOS</Text>
                        <Text style={s.headerSub}>Periodo: {fmtDate(fromDate)} — {fmtDate(toDate)}</Text>
                    </View>

                    <View style={s.sectionHeader}><Text style={s.sectionTitle}>5. Detalle de Movimientos</Text></View>
                    <View style={s.table}>
                        <View style={s.tableHeader}>
                            <Text style={[s.th, { width: '13%' }]}>Fecha</Text>
                            <Text style={[s.th, { width: '32%' }]}>Concepto</Text>
                            <Text style={[s.th, { width: '15%' }]}>Método</Text>
                            <Text style={[s.th, { width: '18%' }]}>Cuenta</Text>
                            <Text style={[s.th, { width: '10%' }]}>Usuario</Text>
                            <Text style={[s.th, { width: '12%', textAlign: 'right' }]}>Monto</Text>
                        </View>
                        {realMovs.map((mov, i) => (
                            <View key={i} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                                <View style={{ width: '13%' }}>
                                    <Text style={[s.td, { fontSize: 7 }]}>{fmtDate(mov.date)}</Text>
                                    <Text style={[s.td, { fontSize: 6, color: C.slate300 }]}>{new Date(mov.date).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}</Text>
                                </View>
                                <View style={{ width: '32%' }}>
                                    <Text style={s.tdBold}>{mov.moduleLabel || mov.description || mov.source}</Text>
                                    {mov.clientName && <Text style={[s.td, { fontSize: 7 }]}>{mov.clientName}</Text>}
                                </View>
                                <Text style={[s.td, { width: '15%' }]}>{mov.paymentMethod || 'N/A'}</Text>
                                <Text style={[s.td, { width: '18%' }]}>{mov.bankAccountName}</Text>
                                <Text style={[s.td, { width: '10%', fontSize: 7 }]}>{mov.createdByName || mov.createdBy}</Text>
                                <Text style={[s.tdBold, { width: '12%', textAlign: 'right', color: mov.type === 'INCOME' ? C.green : C.red }]}>
                                    {mov.type === 'INCOME' ? '+' : '-'}{fmt(mov.amount)}
                                </Text>
                            </View>
                        ))}
                    </View>

                    <Text style={s.footer} render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}  |  Documento de Control Interno`} fixed />
                </Page>
            )}

            {/* ═══════════════════════════════════════════════════════
                PÁGINA 3: Desglose por Usuario
            ═══════════════════════════════════════════════════════ */}
            {mbu.length > 0 && (
                <Page size="A4" style={s.page}>
                    <View style={s.header}>
                        <Text style={[s.headerTitle, { fontSize: 12 }]}>CIERRE DE CAJA — DESGLOSE POR USUARIO</Text>
                        <Text style={s.headerSub}>Periodo: {fmtDate(fromDate)} — {fmtDate(toDate)}</Text>
                    </View>

                    <View style={s.sectionHeader}><Text style={s.sectionTitle}>6. Resumen por Usuario (Auditoría Interna)</Text></View>
                    <View style={s.table}>
                        <View style={s.tableHeader}>
                            <Text style={[s.th, { width: '35%' }]}>Usuario</Text>
                            <Text style={[s.th, { width: '20%', textAlign: 'right' }]}>Ingresos</Text>
                            <Text style={[s.th, { width: '20%', textAlign: 'right' }]}>Egresos</Text>
                            <Text style={[s.th, { width: '15%', textAlign: 'right' }]}>Neto</Text>
                            <Text style={[s.th, { width: '10%', textAlign: 'right' }]}>Mov.</Text>
                        </View>
                        {mbu.map((u, i) => (
                            <View key={i} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                                <Text style={[s.tdBold, { width: '35%' }]}>{u.userName}</Text>
                                <Text style={[s.tdBold, { width: '20%', textAlign: 'right', color: C.green }]}>{fmt(u.totalIncome)}</Text>
                                <Text style={[s.tdBold, { width: '20%', textAlign: 'right', color: C.red }]}>{fmt(u.totalExpense)}</Text>
                                <Text style={[s.tdBold, { width: '15%', textAlign: 'right', color: C.blue }]}>{fmt(u.totalIncome - u.totalExpense)}</Text>
                                <Text style={[s.td, { width: '10%', textAlign: 'right' }]}>{u.movementCount}</Text>
                            </View>
                        ))}
                    </View>

                    <Text style={s.footer} render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}  |  Documento de Control Interno`} fixed />
                </Page>
            )}
        </Document>
    );
}
