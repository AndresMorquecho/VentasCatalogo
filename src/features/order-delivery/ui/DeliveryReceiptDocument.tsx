import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import type { Order } from '@/entities/order/model/types';
import type { Client } from '@/entities/client/model/types';
import {
    getPendingAmount,
    getPaidAmount
} from '@/entities/order/model/model';

const styles = StyleSheet.create({
    page: {
        paddingTop: 15,
        paddingBottom: 15,
        paddingLeft: 30,
        paddingRight: 30,
        fontFamily: 'Helvetica',
        backgroundColor: '#FFFFFF',
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    logoContainer: {
        width: 180,
    },
    logo: {
        width: '100%',
        objectFit: 'contain',
    },
    titleSection: {
        alignItems: 'flex-end',
    },
    mainTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#000',
        letterSpacing: -0.5,
    },
    receiptNo: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 2,
    },
    headerSubtext: {
        fontSize: 11,
        marginTop: 4,
        fontWeight: 'bold',
    },
    infoContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    leftInfo: {
        flexDirection: 'column',
        gap: 2,
    },
    rightInfo: {
        alignItems: 'flex-end',
        justifyContent: 'flex-end',
    },
    textRow: {
        flexDirection: 'row',
        gap: 5,
        fontSize: 12,
    },
    bold: {
        fontWeight: 'bold',
    },
    separator: {
        borderBottomWidth: 1,
        borderBottomColor: '#666',
        marginBottom: 15,
        width: '100%',
    },
    table: {
        borderWidth: 1,
        borderColor: '#000',
        marginBottom: 10,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#000',
        minHeight: 25,
        alignItems: 'center',
    },
    tableRow: {
        flexDirection: 'row',
        minHeight: 20,
        alignItems: 'center',
        borderBottomWidth: 0.5,
        borderBottomColor: '#EEE',
    },
    col: {
        padding: 2,
        borderRightWidth: 1,
        borderRightColor: '#000',
        height: '100%',
        justifyContent: 'center',
    },
    headerCell: {
        fontSize: 7.5,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#000',
    },
    cellText: {
        fontSize: 8,
        textAlign: 'center',
        color: '#000',
    },
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
        paddingHorizontal: 2,
    },
    footerLabel: {
        fontSize: 10,
    },
    footerMain: {
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    signatures: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 35,
    },
    sigBlock: {
        width: '42%',
        alignItems: 'center',
    },
    sigLine: {
        width: '100%',
        height: 1.5,
        backgroundColor: '#D1D5DB',
        marginBottom: 4,
    },
    sigLabel: {
        fontSize: 7,
        fontWeight: 'bold',
        color: '#666',
    },
    sigName: {
        fontSize: 6.5,
        color: '#888',
    },
    sigSubLabel: {
        fontSize: 6,
        color: '#999',
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
    deliveryId?: string;
    settings?: {
        location?: string;
        phone?: string;
        support_phone?: string;
        note?: string;
    };
}

export const DeliveryReceiptDocument = ({ order, orders, client, paymentInfo, deliveryId, settings }: Props) => {
    const activeOrders = orders || (order ? [order] : []);
    const logoUrl = '/images/BannerHeader.jpg';
    const currentTime = new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const currentDate = new Date().toLocaleDateString('es-EC');

    // Filter out duplicates for display if needed
    const displayOrders = activeOrders;

    const firstOrder = activeOrders[0];

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header Section */}
                <View style={[styles.headerContainer, { alignItems: 'center', marginBottom: 20 }]}>
                    <View style={{ width: 200, height: 60 }}>
                        <Image src={logoUrl} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </View>
                    <View style={styles.titleSection}>
                        <Text style={styles.mainTitle}>Comprobante de entrega</Text>
                        <Text style={styles.receiptNo}>No. {deliveryId || firstOrder?.receiptNumber}</Text>
                    </View>
                </View>

                {/* Sub-Header / Info Section */}
                <View style={styles.infoContainer}>
                    <View style={styles.leftInfo}>
                        <View style={styles.textRow}>
                            <Text style={styles.bold}>fecha de entrega:</Text>
                            <Text>{currentDate}   {currentTime}</Text>
                        </View>
                        <View style={styles.textRow}>
                            <Text style={styles.bold}>Cedula:</Text>
                            <Text>{client?.identificationNumber || (firstOrder as any)?.clientIdentification || 'N/A'}</Text>
                        </View>
                        <View style={styles.textRow}>
                            <Text style={styles.bold}>Nombre:</Text>
                            <Text style={{ textTransform: 'uppercase' }}>{firstOrder?.clientName}</Text>
                        </View>
                    </View>
                    <View style={styles.rightInfo}>
                        <Text style={styles.headerSubtext}>
                            Teléfonos: {settings?.phone || "2787237"}{settings?.support_phone ? ` / ${settings.support_phone}` : ""}
                        </Text>
                        <Text style={styles.headerSubtext}>{settings?.location || "Quito - Ecuador"}</Text>
                    </View>
                </View>

                <View style={styles.separator} />

                {/* Table Section */}
                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <View style={[styles.col, { width: '14%' }]}><Text style={styles.headerCell}>No recibo</Text></View>
                        <View style={[styles.col, { width: '8%' }]}><Text style={styles.headerCell}>Catálogo</Text></View>
                        <View style={[styles.col, { width: '12%' }]}><Text style={styles.headerCell}>No de pedido</Text></View>
                        <View style={[styles.col, { width: '10%' }]}><Text style={styles.headerCell}>Tipo de pedido</Text></View>
                        <View style={[styles.col, { width: '10%' }]}><Text style={styles.headerCell}>Tipo doc.</Text></View>
                        <View style={[styles.col, { width: '10%' }]}><Text style={styles.headerCell}>No doc.</Text></View>
                        <View style={[styles.col, { width: '9%' }]}><Text style={styles.headerCell}>V. Pedido</Text></View>
                        <View style={[styles.col, { width: '9%' }]}><Text style={styles.headerCell}>V factura</Text></View>
                        <View style={[styles.col, { width: '9%' }]}><Text style={styles.headerCell}>Abono</Text></View>
                        <View style={[styles.col, { width: '9%', borderRightWidth: 0 }]}><Text style={styles.headerCell}>Saldo</Text></View>
                    </View>

                    {displayOrders.map((o, index) => {
                        const paidAmount = getPaidAmount(o);
                        const pendingTotal = getPendingAmount(o);
                        const realInvTotal = Number(o.realInvoiceTotal || 0);

                        return (
                            <View key={o.id || index} style={[styles.tableRow, index === displayOrders.length - 1 ? { borderBottomWidth: 0 } : {}]}>
                                <View style={[styles.col, { width: '14%' }]}><Text style={styles.cellText}>{o.receiptNumber}</Text></View>
                                <View style={[styles.col, { width: '8%' }]}><Text style={styles.cellText}>{o.brandName || (o as any).brand?.name}</Text></View>
                                <View style={[styles.col, { width: '12%' }]}><Text style={styles.cellText}>{o.orderNumber || 'S/N'}</Text></View>
                                <View style={[styles.col, { width: '10%' }]}><Text style={styles.cellText}>{o.type || 'NORMAL'}</Text></View>
                                <View style={[styles.col, { width: '10%' }]}><Text style={styles.cellText}>{o.invoiceNumber ? 'FACTURA' : 'PEND.'}</Text></View>
                                <View style={[styles.col, { width: '10%' }]}><Text style={styles.cellText}>{o.invoiceNumber || 'S/N'}</Text></View>
                                <View style={[styles.col, { width: '9%' }]}><Text style={styles.cellText}>{Number(o.total || 0).toFixed(2)}</Text></View>
                                <View style={[styles.col, { width: '9%' }]}><Text style={styles.cellText}>{Number(realInvTotal).toFixed(2)}</Text></View>
                                <View style={[styles.col, { width: '9%' }]}><Text style={styles.cellText}>{Number(paidAmount).toFixed(2)}</Text></View>
                                <View style={[styles.col, { width: '9%', borderRightWidth: 0 }]}><Text style={styles.cellText}>{Number(pendingTotal).toFixed(2)}</Text></View>
                            </View>
                        );
                    })}
                </View>

                {/* Footer Section */}
                <View style={styles.footerRow}>
                    <Text style={styles.footerLabel}>Pedidos entregados: <Text style={styles.bold}>{displayOrders.length}</Text></Text>
                    <Text style={styles.footerLabel}>forma de pago: <Text style={styles.bold}>{paymentInfo?.method || 'N/A'}</Text></Text>
                    <Text style={styles.footerMain}>VALOR CANCELADO: {Number(paymentInfo?.amountPaidNow || 0).toFixed(2)}</Text>
                </View>

                {/* Signatures */}
                <View style={styles.signatures}>
                    <View style={styles.sigBlock}>
                        <View style={styles.sigLine} />
                        <Text style={styles.sigLabel}>Entregado Por</Text>
                        <Text style={styles.sigName}>{paymentInfo?.user || 'admin'}</Text>
                    </View>
                    <View style={styles.sigBlock}>
                        <View style={styles.sigLine} />
                        <Text style={styles.sigLabel}>Recibido Conforme (Empresaria)</Text>
                        <Text style={styles.sigName}>{firstOrder?.clientName}</Text>
                        <Text style={styles.sigSubLabel}>{client?.identificationNumber}</Text>
                    </View>
                </View>

            </Page>
        </Document>
    );
};
