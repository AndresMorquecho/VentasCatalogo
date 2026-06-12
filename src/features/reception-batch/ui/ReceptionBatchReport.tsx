import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import { formatPdfCurrency } from '@/shared/lib/formatPdfCurrency';
import type { Order } from '@/entities/order/model/types';
import { getPaidAmount, getPendingAmount, getEffectiveTotal, hasClientCredit, getClientCreditAmount } from '@/entities/order/model/model';

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
    colReceipt: { width: '10%', textAlign: 'center' },
    colClient: { width: '22%', textAlign: 'center' },
    colBrand: { width: '8%', textAlign: 'center' },
    colOrderNo: { width: '10%', textAlign: 'center' },
    colDocType: { width: '8%', textAlign: 'center' },
    colInvNo: { width: '10%', textAlign: 'center' },
    colAbono: { width: '8%', textAlign: 'center' },
    colTotal: { width: '12%', textAlign: 'center' },
    colSaldo: { width: '12%', textAlign: 'center', borderRight: 0 },

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

    const totalAbonos = orders.reduce((sum, o) => sum + getPaidAmount(o), 0);
    const totalInvoices = orders.reduce((sum, o) => sum + getEffectiveTotal(o), 0);
    const totalPending = orders.reduce((sum, o) => sum + getPendingAmount(o), 0);

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
                        <Text style={styles.metaValue}>{formatPdfCurrency(packingTotal)}</Text>
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
                        <Text style={[styles.tableCell, styles.colTotal]}>Valor factura</Text>
                        <Text style={[styles.tableCell, styles.colSaldo, styles.tableCellLast]}>Saldo</Text>
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
                                {formatPdfCurrency(getPaidAmount(o))}
                            </Text>
                            <Text style={[styles.tableCell, styles.colTotal]}>
                                {formatPdfCurrency(getEffectiveTotal(o))}
                            </Text>
                            <Text style={[
                                styles.tableCell, 
                                styles.colSaldo, 
                                styles.tableCellLast, 
                                hasClientCredit(o) ? { color: '#059669', fontWeight: 'bold' } : {}
                            ]}>
                                {hasClientCredit(o) 
                                    ? `Favor: ${formatPdfCurrency(getClientCreditAmount(o))}` 
                                    : formatPdfCurrency(getPendingAmount(o))}
                            </Text>
                        </View>
                    ))}
                </View>

                <View style={styles.footer}>
                    <View style={{ flex: 1, justifyContent: 'flex-end' }}>
                       <Text style={{ fontSize: 9, color: '#64748b' }}>Cantidad de pedidos: {orders.length}</Text>
                    </View>
                    <View style={{ flexDirection: 'column', alignItems: 'flex-end', backgroundColor: '#f8fafc', padding: 10, borderRadius: 5, border: '1pt solid #e2e8f0' }}>
                        <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#0f172a' }}>TOTAL VALOR FACTURAS: {formatPdfCurrency(totalInvoices)}</Text>
                        <Text style={{ fontSize: 10, marginTop: 4, color: '#059669', fontWeight: 'bold' }}>TOTAL ABONOS RECIBIDOS: {formatPdfCurrency(totalAbonos)}</Text>
                        <View style={{ height: 1, backgroundColor: '#cbd5e1', width: 150, marginVertical: 4 }} />
                        <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#b45309' }}>SALDO PENDIENTE TOTAL: {formatPdfCurrency(totalPending)}</Text>
                    </View>
                </View>
            </Page>
        </Document>
    );
};
