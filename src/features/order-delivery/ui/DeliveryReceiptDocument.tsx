import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import type { Order } from '@/entities/order/model/types';
import type { Client } from '@/entities/client/model/types';
import {
    getPendingAmount,
    getPaidAmount,
    getEffectiveTotal
} from '@/entities/order/model/model';

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
        marginBottom: 20,
        borderBottomWidth: 2,
        borderBottomColor: '#059669',
        paddingBottom: 10,
    },
    logoContainer: {
        width: 120,
        height: 50,
        justifyContent: 'center',
    },
    logo: {
        width: '100%',
        objectFit: 'contain',
    },
    titleContainer: {
        alignItems: 'flex-end',
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#064E3B',
        textTransform: 'uppercase',
    },
    subtitle: {
        fontSize: 10,
        color: '#059669',
        marginTop: 2,
    },
    infoSection: {
        marginBottom: 20,
        padding: 10,
        backgroundColor: '#F0FDF4',
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#BBF7D0',
    },
    infoRow: {
        flexDirection: 'row',
        marginBottom: 4,
    },
    infoLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        width: 120,
        color: '#065F46',
    },
    infoValue: {
        fontSize: 10,
        color: '#1F2937',
    },
    table: {
        display: "flex",
        width: "auto",
        borderStyle: "solid",
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginBottom: 20,
    },
    tableRow: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        minHeight: 24,
        alignItems: 'center',
    },
    tableHeader: {
        backgroundColor: '#F3F4F6',
    },
    col: {
        padding: 4,
        borderRightWidth: 1,
        borderRightColor: '#E5E7EB',
    },
    cellText: {
        fontSize: 8,
        color: '#374151',
    },
    headerText: {
        fontSize: 8,
        fontWeight: 'bold',
        color: '#111827',
        textAlign: 'center',
    },
    c1: { width: '12%' },
    c2: { width: '12%' },
    c3: { width: '12%' },
    c4: { width: '12%' },
    c5: { width: '12%' },
    c6: { width: '12%', textAlign: 'right' },
    c7: { width: '12%', textAlign: 'right' },
    c8: { width: '12%', textAlign: 'right' },
    c9: { width: '12%', textAlign: 'right', borderRightWidth: 0 },
    summarySection: {
        alignItems: 'flex-end',
        marginTop: 10,
        marginBottom: 30,
    },
    summaryRow: {
        flexDirection: 'row',
        width: 250,
        justifyContent: 'space-between',
        marginBottom: 4,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        paddingBottom: 2,
    },
    creditAlert: {
        marginTop: 10,
        padding: 10,
        backgroundColor: '#D1FAE5',
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#10B981',
    },
    creditText: {
        fontSize: 10,
        color: '#065F46',
        textAlign: 'center',
        fontWeight: 'bold',
    },
    footer: {
        position: 'absolute',
        bottom: 40,
        left: 40,
        right: 40,
    },
    signatures: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 40,
    },
    sigBlock: {
        width: '40%',
        alignItems: 'center',
    },
    sigLine: {
        width: '100%',
        height: 1,
        backgroundColor: '#9CA3AF',
        marginBottom: 5,
    },
    sigText: {
        fontSize: 9,
        color: '#4B5563',
    }
});

interface Props {
    order?: Order;
    orders?: Order[];
    client?: Client;
    paymentInfo?: {
        amountPaidNow: number;
        method: string;
        user: string;
        currentCreditAmount?: number;
        hasCurrentCredit?: boolean;
    };
}

export const DeliveryReceiptDocument = ({ order, orders, client, paymentInfo }: Props) => {
    const activeOrders = orders || (order ? [order] : []);
    const logoUrl = '/images/mochitopng.png';
    const currentDate = new Date().toLocaleDateString('es-EC');

    // Totals across all orders
    const summary = activeOrders.reduce((acc, o) => {
        acc.estimatedTotal += Number(o.total) || 0;
        acc.realTotal += Number(getEffectiveTotal(o)) || 0;
        acc.totalPaid += Number(getPaidAmount(o)) || 0;
        acc.pendingTotal += Number(getPendingAmount(o)) || 0;
        return acc;
    }, { estimatedTotal: 0, realTotal: 0, totalPaid: 0, pendingTotal: 0 });

    const firstOrder = activeOrders[0];
    const hasCredit = paymentInfo?.hasCurrentCredit || false;
    const creditAmount = Number(paymentInfo?.currentCreditAmount) || 0;

    return (
        <Document>
            <Page size="A4" orientation="landscape" style={styles.page}>
                <Image src={logoUrl} style={styles.watermark} fixed />
                
                {/* Header Section */}
                <View style={styles.headerRow}>
                    <View style={styles.logoContainer}>
                        <Image src={logoUrl} style={styles.logo} />
                    </View>
                    <View style={styles.titleContainer}>
                        <Text style={styles.title}>Comprobante de Entrega</Text>
                        <Text style={styles.subtitle}>No. {firstOrder?.receiptNumber}</Text>
                        <Text style={[styles.subtitle, { color: '#374151' }]}>{currentDate}</Text>
                    </View>
                </View>

                {/* Info Section */}
                <View style={styles.infoSection}>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Empresaria (Cliente):</Text>
                        <Text style={styles.infoValue}>{firstOrder?.clientName}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Cédula / RUC:</Text>
                        <Text style={styles.infoValue}>{client?.identificationNumber || 'N/A'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Celular:</Text>
                        <Text style={styles.infoValue}>{client?.phone1 || 'N/A'}</Text>
                    </View>
                </View>

                {/* Multi-Order Table */}
                <View style={styles.table}>
                    <View style={[styles.tableRow, styles.tableHeader]}>
                        <View style={[styles.col, { width: '10%' }]}><Text style={styles.headerText}>N° Pedido</Text></View>
                        <View style={[styles.col, { width: '12%' }]}><Text style={styles.headerText}>Marca/Catálogo</Text></View>
                        <View style={[styles.col, { width: '10%' }]}><Text style={styles.headerText}>N° Factura</Text></View>
                        <View style={[styles.col, { width: '10%' }]}><Text style={styles.headerText}>Tipo</Text></View>
                        <View style={[styles.col, { width: '10%' }]}><Text style={styles.headerText}>Forma Pago</Text></View>
                        <View style={[styles.col, { width: '8%' }]}><Text style={styles.headerText}>Documento</Text></View>
                        <View style={[styles.col, { width: '10%' }]}><Text style={styles.headerText}>V. Pedido</Text></View>
                        <View style={[styles.col, { width: '10%' }]}><Text style={styles.headerText}>V. Factura</Text></View>
                        <View style={[styles.col, { width: '10%' }]}><Text style={styles.headerText}>Abonado</Text></View>
                        <View style={[styles.col, { width: '10%', borderRightWidth: 0 }]}><Text style={styles.headerText}>Saldo</Text></View>
                    </View>

                    {activeOrders.map((o, index) => {
                        const estTot = Number(o.total) || 0;
                        const realTot = Number(getEffectiveTotal(o)) || 0;
                        const totalPaid = Number(getPaidAmount(o)) || 0;
                        const pending = Number(getPendingAmount(o)) || 0;

                        return (
                            <View key={o.id || index} style={styles.tableRow}>
                                <View style={[styles.col, { width: '10%' }]}><Text style={styles.cellText}>{o.orderNumber || 'S/N'}</Text></View>
                                <View style={[styles.col, { width: '12%' }]}><Text style={styles.cellText}>{o.brandName || 'S/M'}</Text></View>
                                <View style={[styles.col, { width: '10%' }]}><Text style={styles.cellText}>{o.invoiceNumber || 'S/N'}</Text></View>
                                <View style={[styles.col, { width: '10%' }]}><Text style={styles.cellText}>{o.type}</Text></View>
                                <View style={[styles.col, { width: '10%' }]}><Text style={styles.cellText}>{paymentInfo?.method || 'N/A'}</Text></View>
                                <View style={[styles.col, { width: '8%' }]}><Text style={styles.cellText}>Factura</Text></View>
                                <View style={[styles.col, { width: '10%', textAlign: 'right' }]}><Text style={styles.cellText}>${estTot.toFixed(2)}</Text></View>
                                <View style={[styles.col, { width: '10%', textAlign: 'right' }]}><Text style={styles.cellText}>${realTot.toFixed(2)}</Text></View>
                                <View style={[styles.col, { width: '10%', textAlign: 'right' }]}><Text style={styles.cellText}>${totalPaid.toFixed(2)}</Text></View>
                                <View style={[styles.col, { width: '10%', textAlign: 'right', borderRightWidth: 0 }]}><Text style={[styles.cellText, { fontWeight: 'bold' }]}>${pending.toFixed(2)}</Text></View>
                            </View>
                        );
                    })}
                </View>

                {/* Footer and Summary */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <View style={{ width: '45%' }}>
                        <Text style={{ fontSize: 10, fontWeight: 'bold', marginBottom: 5 }}>Detalle de Pago Entrega:</Text>
                        <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderColor: '#EEE', paddingVertical: 2 }}>
                            <Text style={{ fontSize: 9, width: 100 }}>Forma de Pago:</Text>
                            <Text style={{ fontSize: 9 }}>{paymentInfo?.method || 'N/A'}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderColor: '#EEE', paddingVertical: 2 }}>
                            <Text style={{ fontSize: 9, width: 100 }}>Total Cancelado Hoy:</Text>
                            <Text style={{ fontSize: 9 }}>${Number(paymentInfo?.amountPaidNow || 0).toFixed(2)}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderColor: '#EEE', paddingVertical: 2 }}>
                            <Text style={{ fontSize: 9, width: 100 }}>Recibido por:</Text>
                            <Text style={{ fontSize: 9 }}>{paymentInfo?.user || 'Sistema'}</Text>
                        </View>
                    </View>

                    <View style={styles.summarySection}>
                        <View style={styles.summaryRow}>
                            <Text style={{ fontSize: 10 }}>Total Valor Pedido:</Text>
                            <Text style={{ fontSize: 10, fontWeight: 'bold' }}>${summary.estimatedTotal.toFixed(2)}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={{ fontSize: 10 }}>Total Valor Factura:</Text>
                            <Text style={{ fontSize: 10, fontWeight: 'bold' }}>${summary.realTotal.toFixed(2)}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={{ fontSize: 10 }}>Total Acumulado Pagado:</Text>
                            <Text style={{ fontSize: 10, fontWeight: 'bold' }}>${summary.totalPaid.toFixed(2)}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={{ fontSize: 12, fontWeight: 'bold', color: summary.pendingTotal > 0.01 ? '#DC2626' : '#059669' }}>Saldo Final Pendiente:</Text>
                            <Text style={{ fontSize: 12, fontWeight: 'bold', color: summary.pendingTotal > 0.01 ? '#DC2626' : '#059669' }}>${summary.pendingTotal.toFixed(2)}</Text>
                        </View>

                        {hasCredit && (
                            <View style={styles.creditAlert}>
                                <Text style={styles.creditText}>
                                    Saldo a Favor del Cliente: ${creditAmount.toFixed(2)}
                                </Text>
                                <Text style={{ fontSize: 8, color: '#065F46', textAlign: 'center', marginTop: 2 }}>
                                    (Disponible para pago total o parcial en futuros pedidos)
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Signatures */}
                <View style={styles.footer}>
                    <Text style={{ fontSize: 8, fontStyle: 'italic', marginBottom: 20, textAlign: 'center', color: '#6B7280' }}>
                        Declaro haber recibido los productos a entera satisfacción y acepto el saldo pendiente si lo hubiere.
                    </Text>
                    <View style={styles.signatures}>
                        <View style={styles.sigBlock}>
                            <View style={styles.sigLine} />
                            <Text style={[styles.sigText, { fontWeight: 'bold' }]}>Entregado Por</Text>
                            <Text style={styles.sigText}>{paymentInfo?.user || 'Vendedor'}</Text>
                        </View>
                        <View style={styles.sigBlock}>
                            <View style={styles.sigLine} />
                            <Text style={[styles.sigText, { fontWeight: 'bold' }]}>Recibido Conforme (Empresaria)</Text>
                            <Text style={styles.sigText}>{firstOrder?.clientName || 'N/A'}</Text>
                            <Text style={{ fontSize: 8, color: '#9CA3AF' }}>{client?.identificationNumber}</Text>
                        </View>
                    </View>
                </View>
            </Page>
        </Document>
    );
};
