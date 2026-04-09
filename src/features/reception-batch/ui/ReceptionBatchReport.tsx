import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import type { Order } from '@/entities/order/model/types';

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontFamily: 'Helvetica',
        backgroundColor: '#FFFFFF',
    },
    logoSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logo: {
        width: 280,
        height: 80,
        objectFit: 'contain',
    },
    titleSection: {
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        textTransform: 'none',
        color: '#000',
    },
    subtitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 2,
        color: '#000',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        borderBottom: '1pt solid #000',
        paddingBottom: 10,
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
        padding: 5,
        borderRight: '0.5pt solid #000',
        textAlign: 'center',
    },
    tableCellLast: {
        borderRight: 0,
    },
    tableCellRight: {
        textAlign: 'center',
    },
    // Column widths
    colReceipt: { width: '12%', textAlign: 'center' },
    colClient: { width: '25%', textAlign: 'center' },
    colBrand: { width: '10%', textAlign: 'center' },
    colOrderNo: { width: '12%', textAlign: 'center' },
    colDocType: { width: '10%', textAlign: 'center' },
    colInvNo: { width: '11%', textAlign: 'center' },
    colAbono: { width: '10%', textAlign: 'center' },
    colTotal: { width: '10%', textAlign: 'center', borderRight: 0 },

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

export const ReceptionBatchReport: React.FC<Props> = ({ orders, packingNumber, packingTotal, userName }) => {
    const formattedDate = new Date().toLocaleString('es-EC', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false
    });

    const getBatchAbono = (o: Order) => {
        const cashAbono = Number((o as any).abonoRecepcion || 0);
        const payments = o.payments || [];
        
        // Sumar pagos hechos en ESTA recepción (Efectivo Packing + Crédito Distributivo)
        const distributiveAbono = payments
            .filter(p => 
                p.method === 'CREDITO_CLIENTE' || 
                p.description === 'Abono en recepción de bodega (Packing)'
            )
            .reduce((sum, p) => sum + Number(p.amount), 0);
            
        return distributiveAbono > 0 ? distributiveAbono : cashAbono;
    };

    const totalAbonos = orders.reduce((sum, o) => {
        return sum + getBatchAbono(o);
    }, 0);

    const totalInvoices = orders.reduce((sum, o) => sum + Number(o.realInvoiceTotal || o.total || 0), 0);

    return (
        <Document>
            <Page size="A4" orientation="landscape" style={styles.page}>
                <View style={styles.headerRow}>
                    <View style={styles.logoSection}>
                        <Image style={styles.logo} src="/images/BannerHeader.jpg" />
                    </View>
                    <View style={styles.titleSection}>
                        <Text style={styles.title}>Packing No</Text>
                        <Text style={styles.subtitle}>{packingNumber || 'N/A'}</Text>
                    </View>
                </View>

                <View style={styles.metaData}>
                    <View style={styles.metaRow}>
                        <Text style={styles.metaLabel}>FECHA DE PACK-:</Text>
                        <Text style={styles.metaValue}>{formattedDate}</Text>
                    </View>
                    <View style={styles.metaRow}>
                        <Text style={styles.metaLabel}>INGRESADO POR:</Text>
                        <Text style={styles.metaValue}>{userName?.toUpperCase() || 'ADMIN'}</Text>
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
                            <Text style={[styles.tableCell, styles.colReceipt]}>{o.type === 'CAMBIO' ? o.orderNumber : o.receiptNumber}</Text>
                            <Text style={[styles.tableCell, styles.colClient]}>{o.clientName}</Text>
                            <Text style={[styles.tableCell, styles.colBrand]}>{o.brandName}</Text>
                            <Text style={[styles.tableCell, styles.colOrderNo]}>{o.type === 'CAMBIO' ? (o.sourceOrderNumber || '---') : (o.orderNumber || '---')}</Text>
                            <Text style={[styles.tableCell, styles.colDocType]}>{o.documentType || 'FACTURA'}</Text>
                            <Text style={[styles.tableCell, styles.colInvNo]}>{o.invoiceNumber || '-'}</Text>
                            <Text style={[styles.tableCell, styles.colAbono]}>
                                {getBatchAbono(o).toFixed(2)}
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
