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
        padding: 6,
        flexDirection: 'column',
    },
    // Header row
    headerRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 2,
    },
    logo: {
        width: 35,
        height: 35,
        objectFit: 'contain',
        marginRight: 6
    },
    headerInfo: {
        flex: 1,
        flexDirection: 'column',
    },
    clientName: {
        fontSize: 10,
        fontWeight: 'extrabold',
        textTransform: 'uppercase',
    },
    clientDetails: {
        fontSize: 8,
        marginTop: 2,
        color: '#1e293b',
        fontWeight: 'bold',
    },
    // Middle row
    middleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: 1,
    },
    salesChannel: {
        fontSize: 7,
        fontWeight: 'bold',
        width: '25%',
    },
    brandName: {
        fontSize: 16,
        fontWeight: 'extrabold',
        textAlign: 'center',
        flex: 1,
        textTransform: 'uppercase',
    },
    prendasWrapper: {
        width: '20%',
        flexDirection: 'column',
        alignItems: 'center',
    },
    prendasLabel: {
        fontSize: 7,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    prendasBox: {
        width: 35,
        height: 20,
        borderWidth: 1.5,
        borderColor: '#000',
        marginTop: 2,
    },
    // Removiendo prendasValue para dejarlo vacío para llenado manual si se desea
    // o simplemente para seguir el formato idéntico.
    // Receipt row
    receiptRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 2,
    },
    receiptLabel: {
        fontSize: 9,
        fontWeight: 'bold',
        marginRight: 4,
    },
    receiptValue: {
        fontSize: 9,
        fontFamily: 'Courier', // Using a mono-like font for numbers if possible
    },
    // Data Table
    tableHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 4,
        paddingBottom: 1,
    },
    tableHeaderItem: {
        fontSize: 8,
        fontWeight: 'bold',
        color: '#475569',
        borderBottomWidth: 0.5,
        borderBottomColor: '#cbd5e1',
        paddingBottom: 2,
    },
    tableValueRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    tableValueItem: {
        fontSize: 8,
    },
    // Footer
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 'auto',
        borderTopWidth: 0.5,
        borderTopColor: '#555',
        paddingTop: 2,
    },
    footerItem: {
        fontSize: 6.5,
        color: '#222',
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
    const logoUrl = '/images/mochitopng.png';

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
                                    {/* Header: Logo + Name + ID/Phone */}
                                    <View style={styles.headerRow}>
                                        <Image src={logoUrl} style={styles.logo} />
                                        <View style={styles.headerInfo}>
                                            <Text style={styles.clientName}>{order.clientName}</Text>
                                            <Text style={styles.clientDetails}>
                                                {client?.identificationNumber || '---'}     {client?.phone1 || ''} {client?.phone2 ? `/ ${client.phone2}` : ''}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Middle: Channel | Brand | Prendas */}
                                    <View style={styles.middleRow}>
                                        <Text style={styles.salesChannel}>{order.salesChannel || 'OFICINA'}</Text>
                                        <Text style={styles.brandName}>{order.brandName}</Text>
                                        <View style={styles.prendasWrapper}>
                                            <Text style={styles.prendasLabel}>Prendas:</Text>
                                            <View style={styles.prendasBox} />
                                        </View>
                                    </View>

                                    {/* Receipt Number Row */}
                                    <View style={styles.receiptRow}>
                                        <Text style={styles.receiptLabel}>No de recibo:</Text>
                                        <Text style={styles.receiptValue}>{order.receiptNumber} {order.type || 'NORMAL'}</Text>
                                    </View>

                                    {/* Data Table Headers */}
                                    <View style={styles.tableHeaderRow}>
                                        <Text style={[styles.tableHeaderItem, { width: '20%' }]}>No de pedido:</Text>
                                        <Text style={[styles.tableHeaderItem, { width: '20%' }]}>Factura:</Text>
                                        <Text style={[styles.tableHeaderItem, { width: '20%', textAlign: 'right' }]}>Valor factura:</Text>
                                        <Text style={[styles.tableHeaderItem, { width: '20%', textAlign: 'right' }]}>Abono:</Text>
                                        <Text style={[styles.tableHeaderItem, { width: '20%', textAlign: 'right' }]}>Saldo:</Text>
                                    </View>

                                    {/* Data Table Values */}
                                    <View style={styles.tableValueRow}>
                                        <Text style={[styles.tableValueItem, { width: '20%' }]}>{order.orderNumber || order.receiptNumber}</Text>
                                        <Text style={[styles.tableValueItem, { width: '20%' }]}>{order.invoiceNumber || '---'}</Text>
                                        <Text style={[styles.tableValueItem, { width: '20%', textAlign: 'right' }]}>{effectiveTotal.toFixed(2)}</Text>
                                        <Text style={[styles.tableValueItem, { width: '20%', textAlign: 'right' }]}>{paid.toFixed(2)}</Text>
                                        <Text style={[styles.tableValueItem, { width: '20%', textAlign: 'right' }]}>{pendingAmount.toFixed(2)}</Text>
                                    </View>

                                    {/* Footer */}
                                    <View style={styles.footerRow}>
                                        <Text style={styles.footerItem}>
                                            <Text style={styles.bold}>Revisado por:</Text> {user?.name || 'Sis'}
                                        </Text>
                                        <Text style={styles.footerItem}>
                                            <Text style={styles.bold}>Packing:</Text> {packingNumber || 'N/A'}
                                        </Text>
                                        <Text style={styles.footerItem}>
                                            <Text style={styles.bold}>Fecha:</Text> {fullDateTime}
                                        </Text>
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
