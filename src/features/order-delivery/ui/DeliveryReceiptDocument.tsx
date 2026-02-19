
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import type { Order } from '@/entities/order/model/types';
import type { Client } from '@/entities/client/model/types';

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
        color: '#064E3B', // Emerald 900
        textTransform: 'uppercase',
    },
    subtitle: {
        fontSize: 10,
        color: '#059669', // Emerald 600
        marginTop: 2,
    },
    infoSection: {
        marginBottom: 20,
        padding: 10,
        backgroundColor: '#F0FDF4', // Emerald 50
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
    // Column widths
    c1: { width: '10%' }, // Recibo
    c2: { width: '10%' }, // Pedido
    c3: { width: '12%' }, // Tipo Pedido
    c4: { width: '10%' }, // Doc Tipo
    c5: { width: '10%' }, // Num Doc
    c6: { width: '12%', textAlign: 'right' }, // Valor
    c7: { width: '12%', textAlign: 'right' }, // Abono Inicial
    c8: { width: '12%', textAlign: 'right' }, // Abono Entrega
    c9: { width: '12%', textAlign: 'right', borderRightWidth: 0 }, // Saldo

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
    order: Order;
    client?: Client;
    paymentInfo?: {
        amountPaidNow: number;
        method: string;
        user: string;
    };
}

export const DeliveryReceiptDocument = ({ order, client, paymentInfo }: Props) => {
    const currentDate = new Date().toLocaleDateString('es-EC');
    const logoUrl = '/images/mochitopng.png';

    // Calculations
    const total = order.total;
    // Paid before today (total paid - paid now)
    // Wait, order.paidAmount usually includes everything. 
    // If we passed paymentInfo.amountPaidNow separately, we assume order.paidAmount *includes* it if updated, 
    // or we calculate.
    // Let's assume order.paidAmount is the TOTAL PAID up to date.
    const totalPaid = order.paidAmount || 0;
    const paidNow = paymentInfo?.amountPaidNow || 0;
    const initialPaid = Math.max(0, totalPaid - paidNow);

    // Balance
    const pending = Math.max(0, total - totalPaid);

    return (
        <Document>
            <Page size="A4" orientation="landscape" style={styles.page}>
                <Image src={logoUrl} style={styles.watermark} fixed />

                {/* Header */}
                <View style={styles.headerRow}>
                    <View style={styles.logoContainer}>
                        <Image src={logoUrl} style={styles.logo} />
                    </View>
                    <View style={styles.titleContainer}>
                        <Text style={styles.title}>Comprobante de Entrega</Text>
                        <Text style={styles.subtitle}>No. {order.receiptNumber}</Text>
                        <Text style={[styles.subtitle, { color: '#374151' }]}>{currentDate}</Text>
                    </View>
                </View>

                {/* Client Info */}
                <View style={styles.infoSection}>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Empresaria (Cliente):</Text>
                        <Text style={styles.infoValue}>{order.clientName}</Text>
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

                {/* Table */}
                <View style={styles.table}>
                    <View style={[styles.tableRow, styles.tableHeader]}>
                        <View style={[styles.col, styles.c1]}><Text style={styles.headerText}>N° Recibo</Text></View>
                        <View style={[styles.col, styles.c2]}><Text style={styles.headerText}>N° Pedido</Text></View>
                        <View style={[styles.col, styles.c3]}><Text style={styles.headerText}>Tipo Pedido</Text></View>
                        <View style={[styles.col, styles.c4]}><Text style={styles.headerText}>Documento</Text></View>
                        <View style={[styles.col, styles.c5]}><Text style={styles.headerText}>N° Doc</Text></View>
                        <View style={[styles.col, styles.c6]}><Text style={styles.headerText}>Valor</Text></View>
                        <View style={[styles.col, styles.c7]}><Text style={styles.headerText}>Abono Inicial</Text></View>
                        <View style={[styles.col, styles.c8]}><Text style={styles.headerText}>Abono Entrega</Text></View>
                        <View style={[styles.col, styles.c9]}><Text style={styles.headerText}>Saldo</Text></View>
                    </View>
                    <View style={styles.tableRow}>
                        <View style={[styles.col, styles.c1]}><Text style={styles.cellText}>{order.receiptNumber}</Text></View>
                        <View style={[styles.col, styles.c2]}><Text style={styles.cellText}>{order.receiptNumber}</Text></View>
                        <View style={[styles.col, styles.c3]}><Text style={styles.cellText}>{order.type}</Text></View>
                        <View style={[styles.col, styles.c4]}><Text style={styles.cellText}>Factura</Text></View>
                        <View style={[styles.col, styles.c5]}><Text style={styles.cellText}>{order.invoiceNumber || 'S/N'}</Text></View>
                        <View style={[styles.col, styles.c6]}><Text style={[styles.cellText, { textAlign: 'right' }]}>${total.toFixed(2)}</Text></View>
                        <View style={[styles.col, styles.c7]}><Text style={[styles.cellText, { textAlign: 'right' }]}>${initialPaid.toFixed(2)}</Text></View>
                        <View style={[styles.col, styles.c8]}><Text style={[styles.cellText, { textAlign: 'right' }]}>${paidNow.toFixed(2)}</Text></View>
                        <View style={[styles.col, styles.c9]}><Text style={[styles.cellText, { textAlign: 'right', fontWeight: 'bold' }]}>${pending.toFixed(2)}</Text></View>
                    </View>
                </View>

                {/* Payment Summary */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <View style={{ width: '45%' }}>
                        <Text style={{ fontSize: 10, fontWeight: 'bold', marginBottom: 5 }}>Detalle de Pago Entrega:</Text>
                        <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderColor: '#EEE', paddingVertical: 2 }}>
                            <Text style={{ fontSize: 9, width: 100 }}>Forma de Pago:</Text>
                            <Text style={{ fontSize: 9 }}>{paymentInfo?.method || 'N/A'}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderColor: '#EEE', paddingVertical: 2 }}>
                            <Text style={{ fontSize: 9, width: 100 }}>Valor Cancelado:</Text>
                            <Text style={{ fontSize: 9 }}>${paidNow.toFixed(2)}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderColor: '#EEE', paddingVertical: 2 }}>
                            <Text style={{ fontSize: 9, width: 100 }}>Recibido por:</Text>
                            <Text style={{ fontSize: 9 }}>{paymentInfo?.user || 'Sistema'}</Text>
                        </View>
                    </View>

                    <View style={styles.summarySection}>
                        <View style={styles.summaryRow}>
                            <Text style={{ fontSize: 10 }}>Total Pedido:</Text>
                            <Text style={{ fontSize: 10, fontWeight: 'bold' }}>${total.toFixed(2)}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={{ fontSize: 10 }}>Total Pagado:</Text>
                            <Text style={{ fontSize: 10, fontWeight: 'bold' }}>${totalPaid.toFixed(2)}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={{ fontSize: 12, fontWeight: 'bold', color: pending > 0.01 ? '#DC2626' : '#059669' }}>Saldo Final:</Text>
                            <Text style={{ fontSize: 12, fontWeight: 'bold', color: pending > 0.01 ? '#DC2626' : '#059669' }}>${pending.toFixed(2)}</Text>
                        </View>
                    </View>
                </View>

                {/* Footer Signatures */}
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
                            <Text style={styles.sigText}>{order.clientName}</Text>
                            <Text style={{ fontSize: 8, color: '#9CA3AF' }}>{client?.identificationNumber}</Text>
                        </View>
                    </View>
                </View>
            </Page>
        </Document>
    );
};
