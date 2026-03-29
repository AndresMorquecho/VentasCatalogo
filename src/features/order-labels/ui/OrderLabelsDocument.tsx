import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import type { Order } from '@/entities/order/model/types';
import { getPaidAmount, getPendingAmount } from '@/entities/order/model/model';
import type { Client } from '@/entities/client/model/types';

const styles = StyleSheet.create({
    page: {
        padding: 5,
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    labelContainer: {
        width: '50%',
        height: '20%',
        padding: 2,
    },
    labelContent: {
        width: '100%',
        height: '100%',
        borderWidth: 1,
        borderColor: '#000',
        padding: 8,
        flexDirection: 'column',
    },
    upperRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    logo: {
        width: 140,
        height: 35,
        objectFit: 'contain',
    },
    brandPrendasSection: {
        alignItems: 'flex-end',
    },
    brandNameHeader: {
        fontSize: 12,
        fontWeight: 'extrabold',
        textTransform: 'uppercase',
    },
    prendasContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    prendasLabel: {
        fontSize: 8,
        fontWeight: 'bold',
        marginRight: 4,
    },
    prendasBox: {
        width: 30,
        height: 18,
        borderWidth: 1,
        borderColor: '#000',
    },
    clientSection: {
        marginBottom: 4,
    },
    clientName: {
        fontSize: 11,
        fontWeight: 'extrabold',
        textTransform: 'uppercase',
    },
    clientInfoSub: {
        fontSize: 7.5,
        fontStyle: 'italic',
        marginTop: 1,
        color: '#333',
    },
    receiptNumberLine: {
        fontSize: 9,
        fontWeight: 'bold',
        marginBottom: 6,
        textTransform: 'uppercase',
    },
    table: {
        borderWidth: 0.5,
        borderColor: '#000',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 0.5,
        borderBottomColor: '#000',
    },
    tableHeaderCell: {
        fontSize: 7.5,
        fontWeight: 'extrabold',
        padding: 3,
        textAlign: 'center',
        borderRightWidth: 0.5,
        borderRightColor: '#000',
        backgroundColor: '#f8f8f8',
    },
    tableDataCell: {
        fontSize: 7.5,
        padding: 3,
        textAlign: 'center',
        borderRightWidth: 0.5,
        borderRightColor: '#000',
    },
    footer: {
        marginTop: 'auto',
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: 4,
    },
    footerLabel: {
        fontSize: 6.5,
        fontStyle: 'italic',
        color: '#555',
    },
    footerValue: {
        fontSize: 6.5,
        fontWeight: 'bold',
        color: '#000',
    },
    bold: {
        fontWeight: 'bold',
    }
});

interface OrderLabelsProps {
    orders: Order[];
    clientsMap?: Record<string, Client>;
    user?: { name: string };
    packingNumber?: string;
}

export const OrderLabelsDocument = ({ orders, clientsMap, user, packingNumber }: OrderLabelsProps) => {
    // Labels are small, so 10 per page (2 columns x 5 rows)
    const chunkedOrders = [];
    for (let i = 0; i < orders.length; i += 10) {
        chunkedOrders.push(orders.slice(i, i + 10));
    }

    const currentDate = new Date().toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const currentTime = new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', hour12: false });
    const fullDateTime = `${currentDate} ${currentTime}`;


    return (
        <Document>
            {chunkedOrders.map((pageOrders, pageIndex) => (
                <Page key={pageIndex} size="A4" orientation="portrait" style={styles.page}>
                    {pageOrders.map((order) => {
                        const client = clientsMap?.[order.clientId];
                        const paid = Number(getPaidAmount(order)) || 0;
                        const pendingAmount = Number(getPendingAmount(order)) || 0;
                        const effectiveTotal = Number(order.realInvoiceTotal ?? order.total) || 0;
                        

                        return (
                            <View key={order.id} style={styles.labelContainer}>
                                <View style={styles.labelContent}>
                                    {/* Top: Banner + Brand Info */}
                                    <View style={styles.upperRow}>
                                        <Image src={"/images/BannerHeader.jpg"} style={styles.logo} />
                                        <View style={styles.brandPrendasSection}>
                                            <Text style={styles.brandNameHeader}>{order.brandName}</Text>
                                            <View style={styles.prendasContainer}>
                                                <Text style={styles.prendasLabel}>Prendas:</Text>
                                                <View style={styles.prendasBox} />
                                            </View>
                                        </View>
                                    </View>

                                    {/* Client info */}
                                    <View style={styles.clientSection}>
                                        <Text style={styles.clientName}>{order.clientName}</Text>
                                        <Text style={styles.clientInfoSub}>
                                            CEDULA: {client?.identificationNumber || '---'} - TLF.: {client?.phone1 || '---'}{client?.phone2 ? ` / ${client.phone2}` : ''}
                                        </Text>
                                    </View>

                                    <Text style={styles.receiptNumberLine}>
                                        No de recibo: {order.receiptNumber} {order.type || 'NORMAL'}
                                    </Text>

                                    {/* Table */}
                                    <View style={styles.table}>
                                        <View style={styles.tableRow}>
                                            <Text style={[styles.tableHeaderCell, { width: '25%' }]}>No de pedido</Text>
                                            <Text style={[styles.tableHeaderCell, { width: '20%' }]}>Factura</Text>
                                            <Text style={[styles.tableHeaderCell, { width: '20%' }]}>Valor Factura</Text>
                                            <Text style={[styles.tableHeaderCell, { width: '15%' }]}>Abono</Text>
                                            <Text style={[styles.tableHeaderCell, { width: '20%', borderRightWidth: 0 }]}>Saldo</Text>
                                        </View>
                                        <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
                                            <Text style={[styles.tableDataCell, { width: '25%' }]}>{order.orderNumber || order.receiptNumber}</Text>
                                            <Text style={[styles.tableDataCell, { width: '20%' }]}>{order.invoiceNumber || '---'}</Text>
                                            <Text style={[styles.tableDataCell, { width: '20%' }]}>{effectiveTotal.toFixed(2)}</Text>
                                            <Text style={[styles.tableDataCell, { width: '15%' }]}>{paid.toFixed(2)}</Text>
                                            <Text style={[styles.tableDataCell, { width: '20%', borderRightWidth: 0 }]}>{pendingAmount.toFixed(2)}</Text>
                                        </View>
                                    </View>

                                    {/* Footer */}
                                    <View style={styles.footer}>
                                        <Text style={styles.footerLabel}>Revisado por: <Text style={styles.footerValue}>{user?.name || 'Admin'}</Text></Text>
                                        <Text style={styles.footerLabel}>Packing: <Text style={styles.footerValue}>{packingNumber || 'N/A'}</Text></Text>
                                        <Text style={styles.footerLabel}>FECHA: <Text style={styles.footerValue}>{fullDateTime}</Text></Text>
                                    </View>
                                </View>
                            </View>
                        );
                    })}
                </Page>
            ))}
        </Document>
    );
};
