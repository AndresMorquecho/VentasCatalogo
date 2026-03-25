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
const fmtDate = (d: string) => {
    const dateObj = new Date(d);
    if (dateObj.getFullYear() <= 1970) return "Inicio de Registros";
    return dateObj.toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

interface Props { report: CashClosureDetailedReport; }

export function CashClosureDetailedPDF({ report }: Props) {
    const { fromDate, toDate, closedByName, closedAt, totalIncome, totalExpense,
        incomeByMethod, balanceByBank, movementsByUser,
        movements, expectedAmount, actualAmount, difference, notes } = report;

    const movs = movements || [];

    // Filter out internal movements (those don't affect physical cash drawer)
    const realMovs = movs.filter(m => (m.type !== 'INTERNAL' && (m as any).movementType !== 'INTERNAL'));

    // Improved grouping logic with fallback to ensure Page 1 is never empty if there's data
    const matchedIds = new Set<string>();

    const rawGroups = [
        { 
            title: '1. ABONOS INICIALES (ÓRDENES)', 
            badge: 'INICIAL',
            filter: (m: any) => !m.isCreditApplication && m.description?.toUpperCase().includes('ABONO') && !m.description?.toUpperCase().includes('ENTREGA') && !m.description?.toUpperCase().includes('LOTE')
        },
        { 
            title: '2. COBROS EN ENTREGA / LOTES', 
            badge: 'ENTREGA',
            filter: (m: any) => !m.isCreditApplication && (m.description?.toUpperCase().includes('ENTREGA') || m.description?.toUpperCase().includes('LOTE'))
        },
        { 
            title: '3. ABONOS POSTERIORES', 
            badge: 'ABONO',
            filter: (m: any) => !m.isCreditApplication && m.source === 'ORDER_PAYMENT' && !m.description?.toUpperCase().includes('ABONO') && !m.description?.toUpperCase().includes('ENTREGA')
        },
        { 
            title: '4. VENTAS DE CATÁLOGO', 
            badge: 'VENTA',
            filter: (m: any) => !m.isCreditApplication && (m.source === 'CATALOG_SALE' || m.description?.toUpperCase().includes('VENTA'))
        },
        { 
            title: '5. RECARGAS Y AJUSTES - DINERO FÍSICO', 
            badge: 'RECARGA',
            filter: (m: any) => !m.isCreditApplication && (m.source === 'ADJUSTMENT' || m.source === 'MANUAL' || m.description?.toUpperCase().includes('RECARGA'))
        },
        { 
            title: '6. USO DE BILLETERA VIRTUAL (SALDOS)', 
            badge: 'BILLETERA',
            filter: (m: any) => m.isCreditApplication
        },
    ];

    const sections = rawGroups.map(g => {
        const groupMovements = realMovs.filter(m => {
            if (matchedIds.has(m.id)) return false;
            if (g.filter(m)) {
                matchedIds.add(m.id);
                return true;
            }
            return false;
        });
        return { ...g, groupMovements };
    });

    // Catch-all section for any orphan records to avoid empty page 1
    const orphans = realMovs.filter(m => !matchedIds.has(m.id));
    if (orphans.length > 0) {
        sections.push({
            title: 'OTROS MOVIMIENTOS GENERALES',
            badge: 'GENERAL',
            groupMovements: orphans
        } as any);
    }

    return (
        <Document title={`Cierre de Caja - ${fmtDate(closedAt)}`}>

            {/* PÁGINA 1: RESUMEN Y SEGMENTACIÓN TIPO TABLA (Estilo imagen) */}
            <Page size="A4" style={s.page}>
                {/* Header Estilo Imagen */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <Image src="/images/mochitopng.png" style={{ width: 60, height: 60, objectFit: 'contain' }} />
                        <View>
                            <Text style={{ fontSize: 7, color: C.slate700 }}>VENTA POR CATÁLOGO</Text>
                        </View>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ fontSize: 18, fontFamily: 'Helvetica-Bold', color: C.slate900 }}>CIERRE DE CAJA</Text>
                    </View>
                </View>

                {/* Info Cierre */}
                <View style={{ marginBottom: 15 }}>
                    <View style={{ flexDirection: 'row', marginBottom: 3 }}>
                        <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', width: 90 }}>Fecha de cierre:</Text>
                        <Text style={{ fontSize: 9 }}>{fmtDate(closedAt)}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', marginBottom: 3 }}>
                        <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', width: 90 }}>Responsable:</Text>
                        <Text style={{ fontSize: 9, textTransform: 'uppercase' }}>{closedByName || 'Administrador'}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', marginBottom: 3 }}>
                        <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', width: 90 }}>Periodo:</Text>
                        <Text style={{ fontSize: 9 }}>{fmtDate(fromDate)} - {fmtDate(toDate)}</Text>
                    </View>
                </View>

                {/* ITERAR POR GRUPOS ESTILO TABLA (Como la imagen) */}
                {sections.map((section, idx) => {
                    const groupMovements = section.groupMovements;
                    if (groupMovements.length === 0) return null;

                    return (
                        <View key={idx} style={{ marginBottom: 20 }}>
                            {/* Título del Grupo */}
                            <View style={{ borderBottomWidth: 1, borderTopWidth: 1, borderColor: '#333', paddingVertical: 2, marginBottom: 2 }}>
                                <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#000' }}>{section.title}</Text>
                            </View>

                            {/* Encabezado de la Tabla */}
                            <View style={{ flexDirection: 'row', borderBottomWidth: 1.5, borderBottomColor: '#000', paddingVertical: 2 }}>
                                <Text style={{ width: '15%', fontSize: 8, fontFamily: 'Helvetica-Bold' }}>No recibo</Text>
                                <Text style={{ width: '15%', fontSize: 8, fontFamily: 'Helvetica-Bold' }}>Hora</Text>
                                <Text style={{ width: '12%', fontSize: 8, fontFamily: 'Helvetica-Bold' }}>Tipo</Text>
                                <Text style={{ width: '18%', fontSize: 8, fontFamily: 'Helvetica-Bold' }}>Monto</Text>
                                <Text style={{ width: '40%', fontSize: 8, fontFamily: 'Helvetica-Bold' }}>Cliente</Text>
                            </View>

                            {/* Filas */}
                            {groupMovements.map((m: any, mIdx: number) => {
                                const isIncome = m.movementType === 'INCOME';
                                const color = isIncome ? '#059669' : '#DC2626';

                                return (
                                    <View key={mIdx} style={{ flexDirection: 'row', paddingVertical: 3, borderBottomWidth: 0.5, borderBottomColor: '#EEE', alignItems: 'center' }}>
                                        <Text style={{ width: '15%', fontSize: 8 }}>{(m.id || '').substring((m.id || '').length - 6).toUpperCase()}</Text>
                                        <Text style={{ width: '15%', fontSize: 8 }}>{new Date(m.date).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}</Text>
                                        <Text style={{ width: '12%', fontSize: 8 }}>{section.badge}</Text>
                                        <View style={{ width: '18%', flexDirection: 'row', alignItems: 'center' }}>
                                            <Text style={{ fontSize: 7, marginRight: 2, color }}>{isIncome ? '↑' : '↓'}</Text>
                                            <Text style={{ width: '100%', fontSize: 8, fontFamily: 'Helvetica-Bold', color }}>{fmt(m.amount)}</Text>
                                        </View>
                                        <View style={{ width: '40%', flexDirection: 'row', alignItems: 'center' }}>
                                            <Text style={{ fontSize: 8, textTransform: 'uppercase' }}>{m.clientName || 'N/A'}</Text>
                                            {m.isCreditApplication && (
                                                <Text style={{ fontSize: 6, color: '#3B82F6', marginLeft: 4, fontFamily: 'Helvetica-Bold' }}>[BV]</Text>
                                            )}
                                        </View>
                                    </View>
                                );
                            })}

                            {/* Contador al final */}
                            <View style={{ paddingVertical: 4 }}>
                                <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', textAlign: 'center' }}>{groupMovements.length}</Text>
                            </View>
                        </View>
                    );
                })}

                {/* RESUMEN FINAL DE LA PÁGINA 1 */}
                <View style={{ marginTop: 10, borderTopWidth: 2, paddingTop: 5 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 20 }}>
                        <Text style={{ fontSize: 9 }}>Total Ingresos Reales: <Text style={{ fontFamily: 'Helvetica-Bold' }}>{fmt(totalIncome)}</Text></Text>
                        <Text style={{ fontSize: 9 }}>Total Egresos: <Text style={{ fontFamily: 'Helvetica-Bold' }}>{fmt(totalExpense)}</Text></Text>
                        <Text style={{ fontSize: 10 }}>NETO: <Text style={{ fontFamily: 'Helvetica-Bold', color: C.primary }}>{fmt(totalIncome - totalExpense)}</Text></Text>
                    </View>
                </View>

                {notes && (
                    <View style={{ marginTop: 20, padding: 8, backgroundColor: '#F8F8F8', borderRadius: 4 }}>
                        <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', marginBottom: 2 }}>NOTAS:</Text>
                        <Text style={{ fontSize: 8 }}>{notes}</Text>
                    </View>
                )}

                <Text style={s.footer} render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages} | Mochito`} fixed />
            </Page>

            {/* PÁGINA 2: DISTRIBUCIÓN POR MÉTODO Y CUENTAS */}
            <Page size="A4" style={s.page}>
                <View style={[s.sectionHeader, { marginTop: 0 }]}><Text style={s.sectionTitle}>Distribución y Saldos</Text></View>
                
                {/* Cuadre de efectivo (solo si es reporte oficial) */}
                {expectedAmount !== undefined && (
                    <View style={[s.cuadreBox, { backgroundColor: Math.abs(difference || 0) > 0.01 ? '#FEF2F2' : '#F0FDF4', borderColor: Math.abs(difference || 0) > 0.01 ? '#FECACA' : '#BBF7D0', marginBottom: 20 }]}>
                         <View style={{ flex: 1, alignItems: 'center' }}>
                            <Text style={s.summaryLabel}>Efectivo Sistema</Text>
                            <Text style={[s.summaryValue, { fontSize: 11 }]}>{fmt(expectedAmount)}</Text>
                        </View>
                        <View style={{ flex: 1, alignItems: 'center' }}>
                            <Text style={s.summaryLabel}>Efectivo Contado</Text>
                            <Text style={[s.summaryValue, { fontSize: 11 }]}>{fmt(actualAmount || 0)}</Text>
                        </View>
                        <View style={{ flex: 1, alignItems: 'center' }}>
                            <Text style={s.summaryLabel}>Diferencia</Text>
                            <Text style={[s.summaryValue, { fontSize: 11, color: Math.abs(difference || 0) > 0.01 ? C.red : C.green }]}>{fmt(difference || 0)}</Text>
                        </View>
                    </View>
                )}

                <View style={{ flexDirection: 'row', gap: 15 }}>
                    {/* Tabla por Método */}
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', marginBottom: 5 }}>INGRESOS POR MÉTODO</Text>
                        <View style={s.table}>
                            {Object.entries(incomeByMethod).filter(([, v]) => v > 0).map(([method, value], i) => (
                                <View key={i} style={s.tableRow}>
                                    <Text style={{ width: '60%', fontSize: 8 }}>{method}</Text>
                                    <Text style={{ width: '40%', fontSize: 8, fontFamily: 'Helvetica-Bold', textAlign: 'right' }}>{fmt(value)}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Cuentas */}
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', marginBottom: 5 }}>ESTADO DE CUENTAS</Text>
                        {balanceByBank.map((acc, i) => (
                            <View key={i} style={{ marginBottom: 4, paddingBottom: 4, borderBottomWidth: 0.5, borderBottomColor: '#EEE' }}>
                                <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold' }}>{acc.bankAccountName}</Text>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <Text style={{ fontSize: 7, color: '#666' }}>Saldo Final:</Text>
                                    <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold' }}>{fmt(acc.finalBalance)}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Reporte por Usuarios */}
                <View style={{ marginTop: 20 }}>
                    <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', marginBottom: 5 }}>DESGLOSE POR USUARIO</Text>
                    <View style={s.table}>
                        <View style={s.tableHeader}>
                            <Text style={{ width: '50%', fontSize: 8, fontFamily: 'Helvetica-Bold' }}>Usuario</Text>
                            <Text style={{ width: '25%', fontSize: 8, fontFamily: 'Helvetica-Bold', textAlign: 'right' }}>Ingresos</Text>
                            <Text style={{ width: '25%', fontSize: 8, fontFamily: 'Helvetica-Bold', textAlign: 'right' }}>Egresos</Text>
                        </View>
                        {movementsByUser.map((u, i) => (
                            <View key={i} style={s.tableRow}>
                                <Text style={{ width: '50%', fontSize: 8 }}>{u.userName}</Text>
                                <Text style={{ width: '25%', fontSize: 8, textAlign: 'right', color: C.green }}>{fmt(u.totalIncome)}</Text>
                                <Text style={{ width: '25%', fontSize: 8, textAlign: 'right', color: C.red }}>{fmt(u.totalExpense)}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Firmas */}
                <View style={s.sigRow}>
                    <View style={s.sigBox}>
                        <View style={s.sigLine} />
                        <Text style={s.sigLabel}>Firma Responsable</Text>
                        <Text style={s.sigName}>{closedByName || 'Administrador'}</Text>
                    </View>
                    <View style={s.sigBox}>
                        <View style={s.sigLine} />
                        <Text style={s.sigLabel}>Firma Recibido</Text>
                        <Text style={s.sigName}>Gerencia General</Text>
                    </View>
                </View>

                <Text style={s.footer} render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages} | Mochito`} fixed />
            </Page>
        </Document>
    );
}
