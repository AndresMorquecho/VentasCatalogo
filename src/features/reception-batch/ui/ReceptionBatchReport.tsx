import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import type { Order } from '@/entities/order/model/types';

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontFamily: 'Helvetica',
        backgroundColor: '#FFFFFF',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    logoSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logo: {
        width: 50,
        height: 40,
        objectFit: 'contain',
    },
    logoText: {
        fontSize: 10,
        marginLeft: 5,
        fontWeight: 'bold',
        color: '#333',
    },
    titleSection: {
        alignItems: 'center',
        flex: 1,
    },
    title: {
        fontSize: 14,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    packingBox: {
        border: '1pt solid #000',
        padding: 5,
        width: 120,
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
    },
    packingBoxLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    packingBoxValue: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    metaData: {
        marginBottom: 15,
    },
    metaRow: {
        flexDirection: 'row',
        marginBottom: 3,
        fontSize: 10,
    },
    metaLabel: {
        width: 100,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    metaValue: {
        fontWeight: 'normal',
    },
    table: {
        marginTop: 10,
        border: '0.5pt solid #000',
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#f0f0f0',
        borderBottom: '0.5pt solid #000',
        fontWeight: 'bold',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottom: '0.5pt solid #000',
    },
    tableCell: {
        fontSize: 8,
        padding: 4,
        borderRight: '0.5pt solid #000',
        textAlign: 'left',
    },
    tableCellLast: {
        borderRight: 0,
    },
    tableCellRight: {
        textAlign: 'right',
    },
    // Column widths
    colReceipt: { width: '12%' },
    colClient: { width: '25%' },
    colBrand: { width: '10%' },
    colOrderNo: { width: '12%' },
    colDocType: { width: '10%' },
    colInvNo: { width: '11%' },
    colAbono: { width: '10%', textAlign: 'right' },
    colTotal: { width: '10%', textAlign: 'right', borderRight: 0 },

    footer: {
        marginTop: 15,
        flexDirection: 'row',
        justifyContent: 'space-between',
        fontSize: 10,
        fontWeight: 'bold',
    },
});

interface Props {
    orders: Order[];
    packingNumber: string;
    packingTotal: number;
    userName: string;
    batchId?: string;
}

export const ReceptionBatchReport: React.FC<Props> = ({ orders, packingNumber, packingTotal, userName, batchId }) => {
    const formattedDate = new Date().toLocaleString('es-EC', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false
    });

    const totalAbonos = orders.reduce((sum, o) => {
        // En la respuesta de la API, el pago recién creado suele estar en o.payments
        // O podríamos usar el valor enviado originalmente si lo tenemos
        const recentPayment = (o as any).abonoRecepcion || 0;
        return sum + Number(recentPayment);
    }, 0);

    const totalInvoices = orders.reduce((sum, o) => sum + Number(o.realInvoiceTotal || o.total || 0), 0);

    return (
        <Document>
            <Page size="A4" orientation="landscape" style={styles.page}>
                <View style={styles.headerRow}>
                    <View style={styles.logoSection}>
                        <Image style={styles.logo} src="/images/mochitopng.png" />
                        <Text style={styles.logoText}>VENTA POR CATÁLOGO</Text>
                    </View>
                    <View style={styles.titleSection}>
                        <Text style={styles.title}>INGRESO DE PACKING No {batchId || packingNumber || 'N/A'}</Text>
                    </View>
                    <View style={styles.packingBox}>
                        <Text style={styles.packingBoxLabel}>PACKING No</Text>
                        <Text style={styles.packingBoxValue}>{packingNumber}</Text>
                    </View>
                </View>

                <View style={styles.metaData}>
                    <View style={styles.metaRow}>
                        <Text style={styles.metaLabel}>FECHA DE PACKING:</Text>
                        <Text style={styles.metaValue}>{formattedDate}</Text>
                    </View>
                    <View style={styles.metaRow}>
                        <Text style={styles.metaLabel}>INGRESADO POR:</Text>
                        <Text style={styles.metaValue}>{userName.toUpperCase()}</Text>
                    </View>
                    <View style={styles.metaRow}>
                        <Text style={styles.metaLabel}>VALOR PACKING:</Text>
                        <Text style={styles.metaValue}>{Number(packingTotal).toFixed(2)}</Text>
                    </View>
                </View>

                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.tableCell, styles.colReceipt]}>No recibo</Text>
                        <Text style={[styles.tableCell, styles.colClient]}>Empresaria</Text>
                        <Text style={[styles.tableCell, styles.colBrand]}>Catálogo</Text>
                        <Text style={[styles.tableCell, styles.colOrderNo]}>No de pedido</Text>
                        <Text style={[styles.tableCell, styles.colDocType]}>Tipo documento</Text>
                        <Text style={[styles.tableCell, styles.colInvNo]}>No documento</Text>
                        <Text style={[styles.tableCell, styles.colAbono]}>Abono</Text>
                        <Text style={[styles.tableCell, styles.colTotal, styles.tableCellLast]}>Valor factura</Text>
                    </View>

                    {orders.map((o, i) => (
                        <View key={o.id || i} style={styles.tableRow}>
                            <Text style={[styles.tableCell, styles.colReceipt]}>{o.receiptNumber}</Text>
                            <Text style={[styles.tableCell, styles.colClient]}>{o.clientName}</Text>
                            <Text style={[styles.tableCell, styles.colBrand]}>{o.brandName}</Text>
                            <Text style={[styles.tableCell, styles.colOrderNo]}>{o.orderNumber}</Text>
                            <Text style={[styles.tableCell, styles.colDocType]}>{o.documentType || 'FACTURA'}</Text>
                            <Text style={[styles.tableCell, styles.colInvNo]}>{o.invoiceNumber || '-'}</Text>
                            <Text style={[styles.tableCell, styles.colAbono]}>
                                {Number((o as any).abonoRecepcion || 0).toFixed(2)}
                            </Text>
                            <Text style={[styles.tableCell, styles.colTotal, styles.tableCellLast]}>
                                {Number(o.realInvoiceTotal || o.total || 0).toFixed(2)}
                            </Text>
                        </View>
                    ))}
                </View>

                <View style={styles.footer}>
                    <Text>Cantidad de pedidos: {orders.length}</Text>
                    <View style={{ flexDirection: 'column', alignItems: 'flex-end' }}>
                        <Text>VALOR TOTAL PACKING: ${totalInvoices.toFixed(2)}</Text>
                        <Text style={{ fontSize: 8, marginTop: 2 }}>Total Abonos: ${totalAbonos.toFixed(2)}</Text>
                    </View>
                </View>
            </Page>
        </Document>
    );
};
