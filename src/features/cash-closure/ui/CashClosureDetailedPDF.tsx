import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import type { CashClosureDetailedReport } from '@/entities/cash-closure/model/detailed-types';

const styles = StyleSheet.create({
    page: {
        padding: 30,
        fontFamily: 'Helvetica',
        fontSize: 10,
        backgroundColor: '#FFFFFF',
    },
    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        borderBottomWidth: 2,
        borderBottomColor: '#059669',
        paddingBottom: 10,
    },
    logo: {
        width: 80,
        height: 40,
        objectFit: 'contain',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#064E3B',
        textAlign: 'right',
    },
    headerSubtitle: {
        fontSize: 10,
        color: '#059669',
        textAlign: 'right',
        marginTop: 2,
    },
    // Info Section
    infoSection: {
        backgroundColor: '#F0FDF4',
        padding: 10,
        borderRadius: 4,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#BBF7D0',
    },
    infoRow: {
        flexDirection: 'row',
        marginBottom: 3,
    },
    infoLabel: {
        fontSize: 9,
        fontWeight: 'bold',
        width: 100,
        color: '#065F46',
    },
    infoValue: {
        fontSize: 9,
        color: '#1F2937',
    },
    // Section Title
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#1F2937',
        marginTop: 15,
        marginBottom: 8,
        paddingBottom: 4,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    // Summary Cards
    summaryGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    summaryCard: {
        width: '23%',
        padding: 8,
        borderRadius: 4,
        borderWidth: 1,
    },
    summaryLabel: {
        fontSize: 8,
        marginBottom: 4,
    },
    summaryValue: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    // Breakdown Items
    breakdownItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 6,
        marginBottom: 4,
        backgroundColor: '#F9FAFB',
        borderRadius: 3,
    },
    breakdownLabel: {
        fontSize: 9,
        color: '#374151',
    },
    breakdownValue: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    breakdownPercent: {
        fontSize: 7,
        color: '#6B7280',
        marginLeft: 5,
    },
    // Table
    table: {
        marginTop: 10,
        marginBottom: 15,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#F3F4F6',
        padding: 6,
        borderBottomWidth: 1,
        borderBottomColor: '#D1D5DB',
    },
    tableRow: {
        flexDirection: 'row',
        padding: 5,
        borderBottomWidth: 0.5,
        borderBottomColor: '#E5E7EB',
    },
    tableCell: {
        fontSize: 8,
        color: '#374151',
    },
    tableCellHeader: {
        fontSize: 8,
        fontWeight: 'bold',
        color: '#111827',
    },
    // Signatures
    signatures: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 30,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    signatureBlock: {
        width: '45%',
    },
    signatureLine: {
        borderTopWidth: 1,
        borderTopColor: '#9CA3AF',
        marginBottom: 5,
        paddingTop: 5,
    },
    signatureLabel: {
        fontSize: 8,
        color: '#6B7280',
        marginBottom: 2,
    },
    signatureValue: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    // Footer
    footer: {
        position: 'absolute',
        bottom: 20,
        left: 30,
        right: 30,
        textAlign: 'center',
        fontSize: 7,
        color: '#9CA3AF',
    },
});

interface Props {
    report: CashClosureDetailedReport;
}

export function CashClosureDetailedPDF({ report }: Props) {
    const {
        fromDate,
        toDate,
        closedBy,
        closedByName,
        closedAt,
        totalIncome,
        totalExpense,
        netTotal,
        movementCount,
        incomeBySource,
        incomeByMethod,
        balanceByBank,
        movementsByUser,
        movements,
    } = report;

    const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;
    const formatPercent = (amount: number, total: number) =>
        total > 0 ? `(${((amount / total) * 100).toFixed(1)}%)` : '(0%)';
    const formatDate = (date: string) => new Date(date).toLocaleDateString('es-EC');
    const formatDateTime = (date: string) => new Date(date).toLocaleString('es-EC', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const logoUrl = '/images/mochitopng.png';

    return (
        <Document>
            {/* Page 1: Summary and Breakdowns */}
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <Image src={logoUrl} style={styles.logo} />
                    <View>
                        <Text style={styles.headerTitle}>CIERRE DE CAJA DETALLADO</Text>
                        <Text style={styles.headerSubtitle}>
                            Período: {formatDate(fromDate)} - {formatDate(toDate)}
                        </Text>
                    </View>
                </View>

                {/* Info Section */}
                <View style={styles.infoSection}>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Cerrado por:</Text>
                        <Text style={styles.infoValue}>{closedByName || closedBy}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Fecha de cierre:</Text>
                        <Text style={styles.infoValue}>{formatDateTime(closedAt)}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Total movimientos:</Text>
                        <Text style={styles.infoValue}>{movementCount}</Text>
                    </View>
                </View>

                {/* Summary Cards */}
                <Text style={styles.sectionTitle}>RESUMEN EJECUTIVO</Text>
                <View style={styles.summaryGrid}>
                    <View style={[styles.summaryCard, { backgroundColor: '#D1FAE5', borderColor: '#10B981' }]}>
                        <Text style={[styles.summaryLabel, { color: '#065F46' }]}>Total Ingresos</Text>
                        <Text style={[styles.summaryValue, { color: '#047857' }]}>{formatCurrency(totalIncome)}</Text>
                    </View>
                    <View style={[styles.summaryCard, { backgroundColor: '#FEE2E2', borderColor: '#EF4444' }]}>
                        <Text style={[styles.summaryLabel, { color: '#7F1D1D' }]}>Total Egresos</Text>
                        <Text style={[styles.summaryValue, { color: '#DC2626' }]}>{formatCurrency(totalExpense)}</Text>
                    </View>
                    <View style={[styles.summaryCard, { backgroundColor: '#DBEAFE', borderColor: '#3B82F6' }]}>
                        <Text style={[styles.summaryLabel, { color: '#1E3A8A' }]}>Balance Neto</Text>
                        <Text style={[styles.summaryValue, { color: netTotal >= 0 ? '#2563EB' : '#DC2626' }]}>
                            {formatCurrency(netTotal)}
                        </Text>
                    </View>
                    <View style={[styles.summaryCard, { backgroundColor: '#F1F5F9', borderColor: '#94A3B8' }]}>
                        <Text style={[styles.summaryLabel, { color: '#475569' }]}>Movimientos</Text>
                        <Text style={[styles.summaryValue, { color: '#1E293B' }]}>{movementCount}</Text>
                    </View>
                </View>

                {/* Income by Source */}
                <Text style={styles.sectionTitle}>DESGLOSE POR ORIGEN</Text>
                <View style={styles.breakdownItem}>
                    <Text style={styles.breakdownLabel}>Abonos Iniciales (Pedidos)</Text>
                    <View style={{ flexDirection: 'row' }}>
                        <Text style={styles.breakdownValue}>{formatCurrency(incomeBySource.orderPayments)}</Text>
                        <Text style={styles.breakdownPercent}>{formatPercent(incomeBySource.orderPayments, totalIncome)}</Text>
                    </View>
                </View>
                <View style={styles.breakdownItem}>
                    <Text style={styles.breakdownLabel}>Abonos Posteriores</Text>
                    <View style={{ flexDirection: 'row' }}>
                        <Text style={styles.breakdownValue}>{formatCurrency(incomeBySource.additionalPayments)}</Text>
                        <Text style={styles.breakdownPercent}>{formatPercent(incomeBySource.additionalPayments, totalIncome)}</Text>
                    </View>
                </View>
                <View style={styles.breakdownItem}>
                    <Text style={styles.breakdownLabel}>Ajustes</Text>
                    <View style={{ flexDirection: 'row' }}>
                        <Text style={styles.breakdownValue}>{formatCurrency(incomeBySource.adjustments)}</Text>
                        <Text style={styles.breakdownPercent}>{formatPercent(incomeBySource.adjustments, totalIncome)}</Text>
                    </View>
                </View>
                <View style={styles.breakdownItem}>
                    <Text style={styles.breakdownLabel}>Movimientos Manuales</Text>
                    <View style={{ flexDirection: 'row' }}>
                        <Text style={styles.breakdownValue}>{formatCurrency(incomeBySource.manual)}</Text>
                        <Text style={styles.breakdownPercent}>{formatPercent(incomeBySource.manual, totalIncome)}</Text>
                    </View>
                </View>

                {/* Income by Method */}
                <Text style={styles.sectionTitle}>DESGLOSE POR MÉTODO DE PAGO</Text>
                <View style={styles.breakdownItem}>
                    <Text style={styles.breakdownLabel}>Efectivo</Text>
                    <View style={{ flexDirection: 'row' }}>
                        <Text style={styles.breakdownValue}>{formatCurrency(incomeByMethod.EFECTIVO)}</Text>
                        <Text style={styles.breakdownPercent}>{formatPercent(incomeByMethod.EFECTIVO, totalIncome)}</Text>
                    </View>
                </View>
                <View style={styles.breakdownItem}>
                    <Text style={styles.breakdownLabel}>Transferencia</Text>
                    <View style={{ flexDirection: 'row' }}>
                        <Text style={styles.breakdownValue}>{formatCurrency(incomeByMethod.TRANSFERENCIA)}</Text>
                        <Text style={styles.breakdownPercent}>{formatPercent(incomeByMethod.TRANSFERENCIA, totalIncome)}</Text>
                    </View>
                </View>
                <View style={styles.breakdownItem}>
                    <Text style={styles.breakdownLabel}>Depósito</Text>
                    <View style={{ flexDirection: 'row' }}>
                        <Text style={styles.breakdownValue}>{formatCurrency(incomeByMethod.DEPOSITO)}</Text>
                        <Text style={styles.breakdownPercent}>{formatPercent(incomeByMethod.DEPOSITO, totalIncome)}</Text>
                    </View>
                </View>
                <View style={styles.breakdownItem}>
                    <Text style={styles.breakdownLabel}>Cheque</Text>
                    <View style={{ flexDirection: 'row' }}>
                        <Text style={styles.breakdownValue}>{formatCurrency(incomeByMethod.CHEQUE)}</Text>
                        <Text style={styles.breakdownPercent}>{formatPercent(incomeByMethod.CHEQUE, totalIncome)}</Text>
                    </View>
                </View>

                {/* Footer */}
                <Text style={styles.footer}>
                    Página 1 de 2 - Generado el {formatDateTime(closedAt)}
                </Text>
            </Page>

            {/* Page 2: Tables and Details */}
            <Page size="A4" style={styles.page}>
                {/* Balance by Bank */}
                <Text style={styles.sectionTitle}>DESGLOSE POR CUENTA BANCARIA</Text>
                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.tableCellHeader, { width: '70%' }]}>Cuenta</Text>
                        <Text style={[styles.tableCellHeader, { width: '30%', textAlign: 'right' }]}>Balance</Text>
                    </View>
                    {balanceByBank.map((item, index) => (
                        <View key={index} style={styles.tableRow}>
                            <Text style={[styles.tableCell, { width: '70%' }]}>{item.bankAccountName}</Text>
                            <Text style={[styles.tableCell, { width: '30%', textAlign: 'right', fontWeight: 'bold' }]}>
                                {formatCurrency(item.balance)}
                            </Text>
                        </View>
                    ))}
                </View>

                {/* Movements by User */}
                <Text style={styles.sectionTitle}>DESGLOSE POR USUARIO</Text>
                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.tableCellHeader, { width: '40%' }]}>Usuario</Text>
                        <Text style={[styles.tableCellHeader, { width: '20%', textAlign: 'right' }]}>Ingresos</Text>
                        <Text style={[styles.tableCellHeader, { width: '20%', textAlign: 'right' }]}>Egresos</Text>
                        <Text style={[styles.tableCellHeader, { width: '20%', textAlign: 'right' }]}>Movimientos</Text>
                    </View>
                    {movementsByUser.map((user, index) => (
                        <View key={index} style={styles.tableRow}>
                            <Text style={[styles.tableCell, { width: '40%' }]}>{user.userName}</Text>
                            <Text style={[styles.tableCell, { width: '20%', textAlign: 'right' }]}>
                                {formatCurrency(user.totalIncome)}
                            </Text>
                            <Text style={[styles.tableCell, { width: '20%', textAlign: 'right' }]}>
                                {formatCurrency(user.totalExpense)}
                            </Text>
                            <Text style={[styles.tableCell, { width: '20%', textAlign: 'right' }]}>
                                {user.movementCount}
                            </Text>
                        </View>
                    ))}
                </View>

                {/* Signatures */}
                <View style={styles.signatures}>
                    <View style={styles.signatureBlock}>
                        <View style={styles.signatureLine} />
                        <Text style={styles.signatureLabel}>Cerrado por:</Text>
                        <Text style={styles.signatureValue}>{closedByName || closedBy}</Text>
                        <Text style={styles.signatureLabel}>Fecha: {formatDateTime(closedAt)}</Text>
                    </View>
                    <View style={styles.signatureBlock}>
                        <View style={styles.signatureLine} />
                        <Text style={styles.signatureLabel}>Revisado por:</Text>
                        <Text style={styles.signatureValue}>_______________________</Text>
                        <Text style={styles.signatureLabel}>Fecha: _______________________</Text>
                    </View>
                </View>

                {/* Footer */}
                <Text style={styles.footer}>
                    Página 2 de 2 - Generado el {formatDateTime(closedAt)}
                </Text>
            </Page>

            {/* Page 3+: Detailed Movements (if many movements, split into multiple pages) */}
            {movements.length > 0 && (
                <Page size="A4" orientation="landscape" style={styles.page}>
                    <Text style={styles.sectionTitle}>DETALLE COMPLETO DE MOVIMIENTOS</Text>
                    <View style={styles.table}>
                        <View style={styles.tableHeader}>
                            <Text style={[styles.tableCellHeader, { width: '10%' }]}>Fecha/Hora</Text>
                            <Text style={[styles.tableCellHeader, { width: '6%' }]}>Tipo</Text>
                            <Text style={[styles.tableCellHeader, { width: '10%' }]}>Origen</Text>
                            <Text style={[styles.tableCellHeader, { width: '15%' }]}>Cliente</Text>
                            <Text style={[styles.tableCellHeader, { width: '10%' }]}>Método</Text>
                            <Text style={[styles.tableCellHeader, { width: '15%' }]}>Cuenta</Text>
                            <Text style={[styles.tableCellHeader, { width: '10%', textAlign: 'right' }]}>Monto</Text>
                            <Text style={[styles.tableCellHeader, { width: '12%' }]}>Usuario</Text>
                            <Text style={[styles.tableCellHeader, { width: '12%' }]}>Descripción</Text>
                        </View>
                        {movements.slice(0, 30).map((mov, index) => (
                            <View key={index} style={styles.tableRow}>
                                <Text style={[styles.tableCell, { width: '10%', fontSize: 7 }]}>
                                    {new Date(mov.date).toLocaleString('es-EC', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </Text>
                                <Text style={[styles.tableCell, { width: '6%', fontSize: 7 }]}>
                                    {mov.type === 'INCOME' ? 'ING' : 'EGR'}
                                </Text>
                                <Text style={[styles.tableCell, { width: '10%', fontSize: 7 }]}>{mov.source}</Text>
                                <Text style={[styles.tableCell, { width: '15%', fontSize: 7 }]}>{mov.clientName || '-'}</Text>
                                <Text style={[styles.tableCell, { width: '10%', fontSize: 7 }]}>{mov.paymentMethod || '-'}</Text>
                                <Text style={[styles.tableCell, { width: '15%', fontSize: 7 }]}>{mov.bankAccountName}</Text>
                                <Text style={[styles.tableCell, { width: '10%', textAlign: 'right', fontSize: 7, fontWeight: 'bold' }]}>
                                    {formatCurrency(mov.amount)}
                                </Text>
                                <Text style={[styles.tableCell, { width: '12%', fontSize: 7 }]}>
                                    {mov.createdByName || mov.createdBy}
                                </Text>
                                <Text style={[styles.tableCell, { width: '12%', fontSize: 6 }]}>
                                    {mov.description?.substring(0, 20) || '-'}
                                </Text>
                            </View>
                        ))}
                    </View>

                    {movements.length > 30 && (
                        <Text style={{ fontSize: 8, color: '#6B7280', marginTop: 10, textAlign: 'center' }}>
                            Mostrando primeros 30 movimientos de {movements.length} totales
                        </Text>
                    )}

                    <Text style={styles.footer}>
                        Página 3 - Detalle de Movimientos - Generado el {formatDateTime(closedAt)}
                    </Text>
                </Page>
            )}
        </Document>
    );
}
