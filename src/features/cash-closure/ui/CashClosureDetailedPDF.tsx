import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import type { CashClosureDetailedReport } from '@/entities/cash-closure/model/detailed-types';

const styles = StyleSheet.create({
    page: {
        padding: 30,
        fontFamily: 'Helvetica',
        fontSize: 9,
        backgroundColor: '#FFFFFF',
    },
    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 25,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        paddingBottom: 15,
    },
    logo: {
        width: 100,
        height: 50,
        objectFit: 'contain',
    },
    headerInfo: {
        textAlign: 'right',
    },
    headerTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1E293B',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 8,
        color: '#64748B',
    },
    // Main Stats Bar
    statsBar: {
        flexDirection: 'row',
        backgroundColor: '#F8FAFC',
        borderRadius: 8,
        padding: 15,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statDivider: {
        width: 1,
        height: '100%',
        backgroundColor: '#E2E8F0',
    },
    statLabel: {
        fontSize: 7,
        color: '#64748B',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    statValue: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#0F172A',
    },
    // Info Grid
    infoGrid: {
        flexDirection: 'row',
        gap: 20,
        marginBottom: 20,
    },
    infoBlock: {
        flex: 1,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 4,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    infoLabel: {
        fontSize: 8,
        color: '#64748B',
    },
    infoValue: {
        fontSize: 8,
        fontWeight: 'medium',
        color: '#334155',
    },
    // Section Header
    sectionHeader: {
        backgroundColor: '#F1F5F9',
        padding: 6,
        paddingLeft: 10,
        borderRadius: 4,
        marginTop: 15,
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#334155',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    // Table Simple
    table: {
        width: '100%',
    },
    tableHeader: {
        flexDirection: 'row',
        borderBottomWidth: 1.5,
        borderBottomColor: '#334155',
        paddingVertical: 5,
        paddingHorizontal: 2,
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        paddingVertical: 5,
        paddingHorizontal: 2,
        alignItems: 'center',
    },
    tableCell: {
        fontSize: 8,
        color: '#475569',
    },
    tableCellBold: {
        fontSize: 8,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    tableHeaderText: {
        fontSize: 8,
        fontWeight: 'bold',
        color: '#1E293B',
        textTransform: 'uppercase',
    },
    // Signature
    signatureContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 50,
    },
    signatureBox: {
        width: 180,
        alignItems: 'center',
    },
    signatureLine: {
        width: '100%',
        borderTopWidth: 1,
        borderTopColor: '#CBD5E1',
        marginBottom: 6,
    },
    signatureLabel: {
        fontSize: 8,
        color: '#64748B',
    },
    signatureName: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#1E293B',
        marginTop: 2,
    },
    // Footer
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 30,
        right: 30,
        textAlign: 'center',
        fontSize: 7,
        color: '#94A3B8',
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        paddingTop: 10,
    },
});

interface Props {
    report: CashClosureDetailedReport;
}

export function CashClosureDetailedPDF({ report }: Props) {
    const {
        fromDate,
        toDate,
        closedByName,
        closedAt,
        totalIncome,
        movementCount,
        incomeBySource,
        incomeByMethod,
        balanceByBank,
        movements,
        expectedAmount,
        actualAmount,
        difference,
        notes
    } = report;

    const formatCurrency = (amount: number) => `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const formatDateTime = (date: string) => new Date(date).toLocaleString('es-EC', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    const formatDate = (date: string) => new Date(date).toLocaleDateString('es-EC', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });

    const logoUrl = '/images/mochitopng.png';

    // Group movements to avoid layout shifts or too many pages if many movements
    // Actually the request was for harmony and vertical orientation

    return (
        <Document title={`Cierre de Caja - ${formatDate(closedAt)}`}>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <Image src={logoUrl} style={styles.logo} />
                    <View style={styles.headerInfo}>
                        <Text style={styles.headerTitle}>REPORTE DE CIERRE DE CAJA</Text>
                        <Text style={styles.headerSubtitle}>Generado el: {formatDateTime(closedAt)}</Text>
                    </View>
                </View>

                {/* Main Stats Bar */}
                <View style={styles.statsBar}>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Total Recaudado</Text>
                        <Text style={styles.statValue}>{formatCurrency(totalIncome)}</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Movimientos</Text>
                        <Text style={styles.statValue}>{movementCount}</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Periodo</Text>
                        <Text style={[styles.statValue, { fontSize: 8 }]}>{formatDate(fromDate)} - {formatDate(toDate)}</Text>
                    </View>
                </View>

                {/* Audit Info and Breakdown Side by Side */}
                <View style={styles.infoGrid}>
                    <View style={styles.infoBlock}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Datos del Cierre</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Responsable:</Text>
                            <Text style={styles.infoValue}>{closedByName || 'Sistema'}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Desde:</Text>
                            <Text style={styles.infoValue}>{formatDateTime(fromDate)}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Hasta:</Text>
                            <Text style={styles.infoValue}>{formatDateTime(toDate)}</Text>
                        </View>
                    </View>

                    <View style={styles.infoBlock}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Resumen por Origen</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Ingresos por Ventas/Pedidos:</Text>
                            <Text style={styles.infoValue}>{formatCurrency(incomeBySource.orderPayments + incomeBySource.additionalPayments)}</Text>
                        </View>
                        {incomeBySource.manual > 0 && (
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Mov. Manuales:</Text>
                                <Text style={styles.infoValue}>{formatCurrency(incomeBySource.manual)}</Text>
                            </View>
                        )}
                        {incomeBySource.adjustments > 0 && (
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Ajustes:</Text>
                                <Text style={styles.infoValue}>{formatCurrency(incomeBySource.adjustments)}</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Additional Quadre Box if we have physical diff data */}
                {expectedAmount !== undefined && actualAmount !== undefined && (
                    <View style={[styles.statsBar, { backgroundColor: difference && difference !== 0 ? '#FEF2F2' : '#F0FDF4', borderColor: difference && difference !== 0 ? '#FECACA' : '#BBF7D0' }]}>
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Efectivo Sistema (Esperado)</Text>
                            <Text style={styles.statValue}>{formatCurrency(expectedAmount)}</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Efectivo Contado (Real)</Text>
                            <Text style={styles.statValue}>{formatCurrency(actualAmount)}</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={[styles.statLabel, { color: difference && difference !== 0 ? '#EF4444' : '#16A34A' }]}>Estado del Cuadre</Text>
                            <Text style={[styles.statValue, { color: difference && difference !== 0 ? '#EF4444' : '#16A34A', fontSize: difference && difference !== 0 ? 10 : 12 }]}>
                                {difference === undefined || Math.abs(difference) < 0.01 ? 'CUADRÓ EXACTO' : (difference < 0 ? `FALTANTE: ${formatCurrency(Math.abs(difference))}` : `SOBRANTE: ${formatCurrency(difference)}`)}
                            </Text>
                        </View>
                    </View>
                )}

                {/* Observaciones */}
                {notes && notes.trim().length > 0 && (
                    <View style={[styles.infoGrid, { marginBottom: 15 }]}>
                        <View style={[styles.infoBlock, { backgroundColor: '#F8FAFC', padding: 10, borderRadius: 4 }]}>
                            <Text style={[styles.infoLabel, { marginBottom: 4, fontWeight: 'bold' }]}>Justificación / Observaciones:</Text>
                            <Text style={styles.infoValue}>{notes}</Text>
                        </View>
                    </View>
                )}

                {/* Methods Breakdown */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Distribución por Métodos de Pago</Text>
                </View>
                <View style={[styles.table, { marginBottom: 20 }]}>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.tableHeaderText, { width: '40%' }]}>Método</Text>
                        <Text style={[styles.tableHeaderText, { width: '30%', textAlign: 'right' }]}>Monto</Text>
                        <Text style={[styles.tableHeaderText, { width: '30%', textAlign: 'right' }]}>Participación</Text>
                    </View>
                    {Object.entries(incomeByMethod)
                        .filter(([_, value]) => value > 0)
                        .map(([method, value], i) => (
                            <View key={i} style={styles.tableRow}>
                                <Text style={[styles.tableCell, { width: '40%' }]}>{method}</Text>
                                <Text style={[styles.tableCellBold, { width: '30%', textAlign: 'right' }]}>{formatCurrency(value)}</Text>
                                <Text style={[styles.tableCell, { width: '30%', textAlign: 'right' }]}>{((value / (totalIncome || 1)) * 100).toFixed(1)}%</Text>
                            </View>
                        ))}
                </View>

                {/* Bank Accounts Breakdown */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Saldos en Cuentas y Cajas</Text>
                </View>
                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.tableHeaderText, { width: '70%' }]}>Cuenta / Caja</Text>
                        <Text style={[styles.tableHeaderText, { width: '30%', textAlign: 'right' }]}>Monto Final</Text>
                    </View>
                    {balanceByBank.filter(b => b.balance !== 0).map((bank, i) => (
                        <View key={i} style={styles.tableRow}>
                            <Text style={[styles.tableCell, { width: '70%' }]}>{bank.bankAccountName}</Text>
                            <Text style={[styles.tableCellBold, { width: '30%', textAlign: 'right' }]}>{formatCurrency(bank.balance)}</Text>
                        </View>
                    ))}
                </View>

                {/* Signatures at the bottom of first page */}
                <View style={styles.signatureContainer}>
                    <View style={styles.signatureBox}>
                        <View style={styles.signatureLine} />
                        <Text style={styles.signatureLabel}>Responsable de Caja</Text>
                        <Text style={styles.signatureName}>{closedByName || 'Administrador'}</Text>
                    </View>
                    <View style={styles.signatureBox}>
                        <View style={styles.signatureLine} />
                        <Text style={styles.signatureLabel}>Revisado / Aprobado</Text>
                        <Text style={styles.signatureName}>Gerencia / Auditoría</Text>
                    </View>
                </View>

                {/* Page Numbering */}
                <Text style={styles.footer} render={({ pageNumber, totalPages }) => (
                    `Página ${pageNumber} de ${totalPages} | Sistema de Gestión Mochito`
                )} fixed />
            </Page>

            {/* Detailed Movements Page (Always Vertical) */}
            {movements.length > 0 && (
                <Page size="A4" style={styles.page}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Anexo: Detalle de Movimientos</Text>
                    </View>
                    <View style={styles.table}>
                        <View style={styles.tableHeader}>
                            <Text style={[styles.tableHeaderText, { width: '15%' }]}>Fecha</Text>
                            <Text style={[styles.tableHeaderText, { width: '30%' }]}>Concepto / Cliente</Text>
                            <Text style={[styles.tableHeaderText, { width: '20%' }]}>Método / Banco</Text>
                            <Text style={[styles.tableHeaderText, { width: '20%', textAlign: 'right' }]}>Monto</Text>
                            <Text style={[styles.tableHeaderText, { width: '15%', textAlign: 'right' }]}>Ref.</Text>
                        </View>
                        {movements.map((mov, i) => (
                            <View key={i} style={styles.tableRow}>
                                <View style={{ width: '15%' }}>
                                    <Text style={[styles.tableCell, { fontSize: 7 }]}>{formatDate(mov.date)}</Text>
                                    <Text style={[styles.tableCell, { fontSize: 6, color: '#94A3B8' }]}>
                                        {new Date(mov.date).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
                                    </Text>
                                </View>
                                <View style={{ width: '30%' }}>
                                    <Text style={styles.tableCellBold}>{mov.clientName || 'Mov. Manual'}</Text>
                                    <Text style={[styles.tableCell, { fontSize: 6 }]}>{mov.description || mov.source}</Text>
                                </View>
                                <View style={{ width: '20%' }}>
                                    <Text style={styles.tableCell}>{mov.paymentMethod || 'N/A'}</Text>
                                    <Text style={[styles.tableCell, { fontSize: 6, color: '#94A3B8' }]}>{mov.bankAccountName}</Text>
                                </View>
                                <Text style={[styles.tableCellBold, { width: '20%', textAlign: 'right' }]}>
                                    {formatCurrency(mov.amount)}
                                </Text>
                                <Text style={[styles.tableCell, { width: '15%', textAlign: 'right', fontSize: 7 }]}>
                                    {mov.id.substring(0, 6)}
                                </Text>
                            </View>
                        ))}
                    </View>

                    <Text style={styles.footer} render={({ pageNumber, totalPages }) => (
                        `Página ${pageNumber} de ${totalPages} | Documento de Control Interno`
                    )} fixed />
                </Page>
            )}
        </Document>
    );
}
