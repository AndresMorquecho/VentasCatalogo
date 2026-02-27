
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import type { Order } from '@/entities/order/model/types';

// Create styles matching OrderReceiptDocument
const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontFamily: 'Helvetica',
        backgroundColor: '#FFFFFF',
        color: '#333333',
    },
    watermark: {
        position: 'absolute',
        top: 200,
        left: 100,
        width: 400,
        height: 400,
        opacity: 0.1,
        zIndex: -1,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30,
        borderBottomWidth: 2,
        borderBottomColor: '#059669', // Emerald green for Payments
        paddingBottom: 20,
    },
    logoContainer: {
        width: 140,
        height: 60,
        justifyContent: 'center',
    },
    logo: {
        width: '100%',
        objectFit: 'contain',
    },
    brandDetails: {
        alignItems: 'flex-end',
    },
    brandTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1E293B',
        textTransform: 'uppercase',
    },
    brandSubtitle: {
        fontSize: 10,
        color: '#64748B',
        letterSpacing: 1,
        marginTop: 2,
    },
    section: {
        marginBottom: 20,
    },
    row: {
        flexDirection: 'row',
        marginBottom: 5,
    },
    label: {
        width: 100,
        fontSize: 10,
        fontWeight: 'bold',
        color: '#475569',
    },
    value: {
        fontSize: 10,
        color: '#1E293B',
    },
    table: {
        display: "flex",
        width: "auto",
        borderStyle: "solid",
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginTop: 10,
        marginBottom: 20,
    },
    tableRow: {
        margin: "auto",
        flexDirection: "row",
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        minHeight: 24,
        alignItems: 'center',
    },
    tableHeaderRow: {
        backgroundColor: '#F1F5F9',
        borderBottomWidth: 2,
        borderBottomColor: '#CBD5E1',
    },
    tableCol: {
        borderRightWidth: 1,
        borderRightColor: '#E2E8F0',
        padding: 5,
    },
    tableCell: {
        fontSize: 9,
        color: '#334155',
    },
    tableHeaderCell: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#475569',
    },
    // Column widths
    colDate: { width: '20%' },
    colMethod: { width: '25%' },
    colRef: { width: '30%' },
    colAmount: { width: '25%', textAlign: 'right', borderRightWidth: 0 },

    totalSection: {
        marginTop: 10,
        borderTopWidth: 1,
        borderColor: '#E2E8F0',
        paddingTop: 10,
        alignItems: 'flex-end',
    },
    totalRow: {
        flexDirection: 'row',
        marginBottom: 5,
        width: 200,
        justifyContent: 'space-between',
    },
    totalLabel: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#64748B',
    },
    totalValue: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#1E293B',
        textAlign: 'right',
    },
    footerContainer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        borderTopWidth: 1,
        borderColor: '#CBD5E1',
        paddingTop: 10,
    },
    footerText: {
        fontSize: 8,
        color: '#94A3B8',
        textAlign: 'center',
    }
});

interface Props {
    order: Order;
    payments: any[];
    userName: string;
}

export const PaymentReceiptDocument = ({ order, payments, userName }: Props) => {
    const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);
    const pending = (order.realInvoiceTotal || order.total) - totalPaid;
    const logoUrl = '/images/mochitopng.png';

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* WATERMARK */}
                <Image src={logoUrl} style={styles.watermark} fixed />

                {/* HEADER */}
                <View style={styles.headerRow}>
                    <View style={styles.logoContainer}>
                        <Image style={styles.logo} src={logoUrl} />
                    </View>
                    <View style={styles.brandDetails}>
                        <Text style={styles.brandTitle}>{order.brandName || 'TIENDA'}</Text>
                        <Text style={styles.brandSubtitle}>ESTADO DE CUENTA</Text>
                        <Text style={{ fontSize: 9, color: '#64748B', marginTop: 4 }}>
                            Fecha: {new Date().toLocaleDateString()}
                        </Text>
                    </View>
                </View>

                {/* Info Cliente */}
                <View style={styles.section}>
                    <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#059669', marginBottom: 8, textTransform: 'uppercase' }}>
                        Información del Pedido
                    </Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>Cliente:</Text>
                        <Text style={styles.value}>{order.clientName}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Nro. Pedido:</Text>
                        <Text style={styles.value}>#{order.receiptNumber}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Fecha Creación:</Text>
                        <Text style={styles.value}>{new Date(order.createdAt).toLocaleDateString()}</Text>
                    </View>
                </View>

                {/* Tabla Pagos */}
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#059669', marginBottom: 5, textTransform: 'uppercase' }}>
                    Historial de Abonos
                </Text>

                <View style={styles.table}>
                    <View style={[styles.tableRow, styles.tableHeaderRow]}>
                        <View style={[styles.tableCol, styles.colDate]}><Text style={styles.tableHeaderCell}>Fecha</Text></View>
                        <View style={[styles.tableCol, styles.colMethod]}><Text style={styles.tableHeaderCell}>Método</Text></View>
                        <View style={[styles.tableCol, styles.colRef]}><Text style={styles.tableHeaderCell}>Referencia</Text></View>
                        <View style={[styles.tableCol, styles.colAmount]}><Text style={styles.tableHeaderCell}>Monto</Text></View>
                    </View>
                    {payments.length > 0 ? (
                        payments.map((p, i) => (
                            <View style={styles.tableRow} key={i}>
                                <View style={[styles.tableCol, styles.colDate]}><Text style={styles.tableCell}>{new Date(p.date).toLocaleDateString()}</Text></View>
                                <View style={[styles.tableCol, styles.colMethod]}><Text style={styles.tableCell}>{p.method}</Text></View>
                                <View style={[styles.tableCol, styles.colRef]}><Text style={styles.tableCell}>{p.reference || '-'}</Text></View>
                                <View style={[styles.tableCol, styles.colAmount]}><Text style={[styles.tableCell, { fontWeight: 'bold' }]}>${p.amount.toFixed(2)}</Text></View>
                            </View>
                        ))
                    ) : (
                        <View style={[styles.tableRow, { justifyContent: 'center', padding: 10 }]}>
                            <Text style={{ fontSize: 10, color: '#94A3B8', fontStyle: 'italic' }}>No hay abonos registrados</Text>
                        </View>
                    )}
                </View>

                {/* Totales */}
                <View style={styles.totalSection}>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Total Factura:</Text>
                        <Text style={styles.totalValue}>${(order.realInvoiceTotal || order.total).toFixed(2)}</Text>
                    </View>
                    <View style={styles.totalRow}>
                        <Text style={[styles.totalLabel, { color: '#059669' }]}>Total Abonado:</Text>
                        <Text style={[styles.totalValue, { color: '#059669' }]}>${totalPaid.toFixed(2)}</Text>
                    </View>
                    <View style={[styles.totalRow, { marginTop: 5, paddingTop: 5, borderTopWidth: 1, borderColor: '#CBD5E1' }]}>
                        <Text style={[styles.totalLabel, { fontSize: 14, color: '#1E293B' }]}>Saldo Pendiente:</Text>
                        <Text style={[styles.totalValue, { fontSize: 14, color: pending > 0.01 ? '#DC2626' : '#059669' }]}>
                            ${Math.max(0, pending).toFixed(2)}
                        </Text>
                    </View>
                </View>

                {/* Notes */}
                {pending > 0.01 && (
                    <View style={{ marginTop: 20, padding: 10, backgroundColor: '#FEF2F2', borderRadius: 4 }}>
                        <Text style={{ fontSize: 9, color: '#B91C1C', fontWeight: 'bold' }}>
                            Nota: Su pedido presenta un saldo pendiente. Por favor regularizar antes de la entrega.
                        </Text>
                    </View>
                )}

                {/* Footer */}
                <View style={styles.footerContainer}>
                    <Text style={styles.footerText}>
                        Generado el {new Date().toLocaleString()} | Vendedor: {userName}
                    </Text>
                </View>
            </Page>
        </Document>
    );
};
