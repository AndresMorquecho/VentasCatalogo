import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import type { Order } from '@/entities/order/model/types';
import { getPaidAmount, getPendingAmount, hasClientCredit, getClientCreditAmount } from '@/entities/order/model/model';
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
        padding: 4,
    },
    labelContent: {
        width: '100%',
        height: '100%',
        borderWidth: 1,
        borderColor: '#000',
        borderRadius: 4,
        padding: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    leftSection: {
        width: '55%',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%'
    },
    rightSection: {
        width: '43%',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        borderLeftWidth: 1,
        borderLeftColor: '#eee',
        paddingLeft: 6
    },
    logo: {
        width: 60,
        height: 35,
        objectFit: 'contain',
        marginBottom: 4
    },
    headerText: {
        fontSize: 10,
        fontWeight: 'extrabold',
        marginBottom: 2
    },
    subHeader: {
        fontSize: 7,
        color: '#555',
        marginBottom: 8
    },
    infoRow: {
        flexDirection: 'row',
        marginBottom: 2,
        alignItems: 'center'
    },
    label: {
        fontSize: 8,
        fontWeight: 'bold',
        width: 35,
        color: '#444'
    },
    value: {
        fontSize: 8,
        flex: 1,
        color: '#000',
        textOverflow: 'ellipsis',
        maxLines: 1
    },
    brandBox: {
        marginTop: 4,
        backgroundColor: '#f1f5f9',
        padding: 2,
        borderRadius: 2,
        alignSelf: 'flex-start'
    },
    brandText: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#0f172a'
    },
    finBox: {
        marginTop: 4
    },
    finRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 2
    },
    finLabel: {
        fontSize: 7,
        color: '#64748b'
    },
    finValue: {
        fontSize: 8,
        fontWeight: 'bold'
    },
    totalBlock: {
        marginTop: 4,
        borderTopWidth: 1,
        borderTopColor: '#000',
        paddingTop: 2,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    totalLabel: {
        fontSize: 9,
        fontWeight: 'extrabold',
        color: '#dc2626'
    },
    totalValue: {
        fontSize: 10,
        fontWeight: 'extrabold',
        color: '#dc2626'
    },
    creditBlock: {
        marginTop: 3,
        backgroundColor: '#d1fae5',
        padding: 3,
        borderRadius: 2,
        borderWidth: 1,
        borderColor: '#10b981'
    },
    creditLabel: {
        fontSize: 6,
        color: '#065f46',
        textAlign: 'center',
        marginBottom: 1
    },
    creditValue: {
        fontSize: 8,
        fontWeight: 'bold',
        color: '#059669',
        textAlign: 'center'
    },
    footer: {
        fontSize: 6,
        color: '#94a3b8',
        textAlign: 'right',
        marginTop: 'auto'
    }
});

interface OrderLabelsProps {
    orders: Order[];
    clientsMap?: Record<string, Client>;
    user?: { name: string };
}

export const OrderLabelsDocument = ({ orders, clientsMap, user }: OrderLabelsProps) => {
    const chunkedOrders = [];
    for (let i = 0; i < orders.length; i += 10) {
        chunkedOrders.push(orders.slice(i, i + 10));
    }

    const currentDate = new Date().toLocaleDateString('es-EC');
    const logoUrl = '/images/mochitopng.png';

    return (
        <Document>
            {chunkedOrders.map((pageOrders, pageIndex) => (
                <Page key={pageIndex} size="A4" orientation="portrait" style={styles.page}>
                    {pageOrders.map((order) => {
                        const client = clientsMap?.[order.clientId];
                        const paid = Number(getPaidAmount(order)) || 0;
                        const pendingAmount = Number(getPendingAmount(order)) || 0;
                        const hasCredit = hasClientCredit(order);
                        const creditAmount = Number(getClientCreditAmount(order)) || 0;
                        const effectiveTotal = Number(order.realInvoiceTotal ?? order.total) || 0;

                        // Display pending as 0 if there's credit
                        const displayPending = hasCredit ? 0 : pendingAmount;

                        return (
                            <View key={order.id} style={styles.labelContainer}>
                                <View style={styles.labelContent}>
                                    <View style={styles.leftSection}>
                                        <View>
                                            <Image src={logoUrl} style={styles.logo} />
                                            <Text style={styles.headerText}>RECIBO #{order.receiptNumber}</Text>
                                            <Text style={styles.subHeader}>{currentDate} • {order.type}</Text>
                                        </View>

                                        <View>
                                            <View style={styles.infoRow}>
                                                <Text style={styles.label}>Cliente:</Text>
                                                <Text style={styles.value}>{order.clientName}</Text>
                                            </View>
                                            <View style={styles.infoRow}>
                                                <Text style={styles.label}>Cédula:</Text>
                                                <Text style={styles.value}>
                                                    {client?.identificationNumber || order.clientId || '-'}
                                                </Text>
                                            </View>
                                            <View style={styles.brandBox}>
                                                <Text style={styles.brandText}>{order.brandName}</Text>
                                            </View>
                                        </View>
                                    </View>

                                    <View style={styles.rightSection}>
                                        <View style={styles.finBox}>
                                            {(order.realInvoiceTotal && order.realInvoiceTotal !== order.total) ? (
                                                <View style={styles.finRow}>
                                                    <Text style={styles.finLabel}>Valor Pedido:</Text>
                                                    <Text style={styles.finValue}>${Number(order.total || 0).toFixed(2)}</Text>
                                                </View>
                                            ) : null}
                                            <View style={styles.finRow}>
                                                <Text style={styles.finLabel}>Total Factura:</Text>
                                                <Text style={styles.finValue}>${effectiveTotal.toFixed(2)}</Text>
                                            </View>
                                            <View style={styles.finRow}>
                                                <Text style={styles.finLabel}>Abonado:</Text>
                                                <Text style={styles.finValue}>${paid.toFixed(2)}</Text>
                                            </View>
                                            <View style={styles.totalBlock}>
                                                <Text style={styles.totalLabel}>SALDO:</Text>
                                                <Text style={styles.totalValue}>${displayPending.toFixed(2)}</Text>
                                            </View>

                                            {hasCredit ? (
                                                <View style={styles.creditBlock}>
                                                    <Text style={styles.creditLabel}>Saldo a Favor</Text>
                                                    <Text style={styles.creditValue}>+${creditAmount.toFixed(2)}</Text>
                                                </View>
                                            ) : null}
                                        </View>

                                        <Text style={styles.footer}>
                                            Ref: {order.id.slice(0, 6)} • Rev: {user?.name || 'Sis'}
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
