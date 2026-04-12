import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { formatPdfCurrency } from '@/shared/lib/formatPdfCurrency';
import type { Order } from '@/entities/order/model/types';
import { getPaidAmount, getPendingAmount } from '@/entities/order/model/model';
import type { Client } from '@/entities/client/model/types';

/** Máximo de etiquetas por hoja (evitar desbordes; ajustar si hace falta) */
const LABELS_PER_PAGE = 12;

const styles = StyleSheet.create({
    page: {
        padding: 6,
        backgroundColor: '#FFFFFF',
        flexDirection: 'column',
    },
    /** Una sola malla: 3 columnas, filas según contenido — sin reservar “mitad de hoja” */
    labelsGrid: {
        width: '100%',
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignContent: 'flex-start',
    },
    labelCell: {
        width: '33.33%',
        paddingHorizontal: 3,
        paddingBottom: 6,
        paddingTop: 2,
    },
    labelContent: {
        width: '100%',
        borderWidth: 0.5,
        borderColor: '#000',
        padding: 4,
        flexDirection: 'column',
    },
    headerMainRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 5,
    },
    logo: {
        width: 26,
        height: 20,
        objectFit: 'contain',
        marginRight: 3,
    },
    clientCol: {
        flex: 1,
        flexDirection: 'column',
        paddingRight: 3,
        minWidth: 0,
    },
    clientName: {
        fontSize: 6.5,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginBottom: 3,
    },
    clientInfoSub: {
        fontSize: 5,
        fontStyle: 'italic',
        color: '#333',
        lineHeight: 1.35,
    },
    brandCol: {
        width: '30%',
        flexDirection: 'column',
        alignItems: 'flex-end',
    },
    brandNameHeader: {
        fontSize: 7,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        textAlign: 'right',
        marginBottom: 3,
    },
    prendasRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    prendasLabel: {
        fontSize: 5,
        fontWeight: 'bold',
        marginRight: 2,
    },
    prendasBox: {
        width: 18,
        height: 12,
        borderWidth: 0.5,
        borderColor: '#000',
    },
    receiptNumberLine: {
        fontSize: 5.5,
        fontWeight: 'bold',
        marginTop: 2,
        marginBottom: 5,
        textTransform: 'uppercase',
    },
    table: {
        borderWidth: 0.5,
        borderColor: '#000',
        marginBottom: 5,
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 0.5,
        borderBottomColor: '#000',
    },
    tableHeaderCell: {
        fontSize: 4.5,
        fontWeight: 'bold',
        paddingVertical: 2,
        paddingHorizontal: 2,
        textAlign: 'center',
        borderRightWidth: 0.5,
        borderRightColor: '#000',
        backgroundColor: '#e8e8e8',
    },
    tableDataCell: {
        fontSize: 4.5,
        paddingVertical: 2,
        paddingHorizontal: 2,
        textAlign: 'center',
        borderRightWidth: 0.5,
        borderRightColor: '#000',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        flexWrap: 'nowrap',
        paddingTop: 4,
        marginTop: 2,
        borderTopWidth: 0.25,
        borderTopColor: '#ccc',
    },
    footerLabel: {
        fontSize: 4,
        fontStyle: 'italic',
        color: '#555',
        maxWidth: '32%',
    },
    footerValue: {
        fontSize: 4,
        fontWeight: 'bold',
        color: '#000',
    },
});

interface OrderLabelsProps {
    orders: Order[];
    clientsMap?: Record<string, Client>;
    user?: { name: string };
    packingNumber?: string;
}

function LabelCard({
    order,
    client,
    user,
    packingNumber,
    fullDateTime,
}: {
    order: Order;
    client?: Client;
    user?: { name: string };
    packingNumber?: string;
    fullDateTime: string;
}) {
    const paid = Number(getPaidAmount(order)) || 0;
    const pendingAmount = Number(getPendingAmount(order)) || 0;
    const effectiveTotal = Number(order.realInvoiceTotal ?? order.total) || 0;

    const receiptLabel =
        order.type === 'CAMBIO' ? order.orderNumber || order.receiptNumber : order.receiptNumber;

    return (
        <View style={styles.labelCell}>
            <View style={styles.labelContent}>
                <View style={styles.headerMainRow}>
                    <Image src="/images/mochitopng.png" style={styles.logo} />
                    <View style={styles.clientCol}>
                        <Text style={styles.clientName}>{order.clientName}</Text>
                        <Text style={styles.clientInfoSub}>
                            CED: {client?.identificationNumber || '—'} · TLF: {client?.phone1 || '—'}
                            {client?.phone2 ? ` / ${client.phone2}` : ''}
                        </Text>
                    </View>
                    <View style={styles.brandCol}>
                        <Text style={styles.brandNameHeader}>{order.brandName}</Text>
                        <View style={styles.prendasRow}>
                            <Text style={styles.prendasLabel}>Prendas:</Text>
                            <View style={styles.prendasBox} />
                        </View>
                    </View>
                </View>

                <Text style={styles.receiptNumberLine}>
                    No de recibo: {receiptLabel} · {order.type || 'NORMAL'}
                </Text>

                <View style={styles.table}>
                    <View style={styles.tableRow}>
                        <Text style={[styles.tableHeaderCell, { width: '24%' }]}>N° pedido</Text>
                        <Text style={[styles.tableHeaderCell, { width: '20%' }]}>Factura</Text>
                        <Text style={[styles.tableHeaderCell, { width: '22%' }]}>V. factura</Text>
                        <Text style={[styles.tableHeaderCell, { width: '17%' }]}>Abono</Text>
                        <Text style={[styles.tableHeaderCell, { width: '17%', borderRightWidth: 0 }]}>Saldo</Text>
                    </View>
                    <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
                        <Text style={[styles.tableDataCell, { width: '24%' }]}>
                            {order.type === 'CAMBIO'
                                ? order.sourceOrderNumber || '—'
                                : order.orderNumber || order.receiptNumber}
                        </Text>
                        <Text style={[styles.tableDataCell, { width: '20%' }]}>
                            {order.invoiceNumber || '—'}
                        </Text>
                        <Text style={[styles.tableDataCell, { width: '22%' }]}>
                            {formatPdfCurrency(effectiveTotal)}
                        </Text>
                        <Text style={[styles.tableDataCell, { width: '17%' }]}>{formatPdfCurrency(paid)}</Text>
                        <Text style={[styles.tableDataCell, { width: '17%', borderRightWidth: 0 }]}>
                            {formatPdfCurrency(pendingAmount)}
                        </Text>
                    </View>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerLabel}>
                        Revisado por: <Text style={styles.footerValue}>{user?.name || 'Admin'}</Text>
                    </Text>
                    <Text style={styles.footerLabel}>
                        Packing: <Text style={styles.footerValue}>{packingNumber || 'N/A'}</Text>
                    </Text>
                    <Text style={styles.footerLabel}>
                        FECHA: <Text style={styles.footerValue}>{fullDateTime}</Text>
                    </Text>
                </View>
            </View>
        </View>
    );
}

export const OrderLabelsDocument = ({ orders, clientsMap, user, packingNumber }: OrderLabelsProps) => {
    const pages: Order[][] = [];
    for (let i = 0; i < orders.length; i += LABELS_PER_PAGE) {
        pages.push(orders.slice(i, i + LABELS_PER_PAGE));
    }

    const currentDate = new Date().toLocaleDateString('es-EC', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
    const currentTime = new Date().toLocaleTimeString('es-EC', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });
    const fullDateTime = `${currentDate} ${currentTime}`;

    return (
        <Document>
            {pages.map((pageOrders, pageIndex) => (
                <Page key={pageIndex} size="A4" orientation="portrait" style={styles.page}>
                    <View style={styles.labelsGrid}>
                        {pageOrders.map((order) => (
                            <LabelCard
                                key={`${pageIndex}-${order.id}`}
                                order={order}
                                client={clientsMap?.[order.clientId]}
                                user={user}
                                packingNumber={packingNumber}
                                fullDateTime={fullDateTime}
                            />
                        ))}
                    </View>
                </Page>
            ))}
        </Document>
    );
};
