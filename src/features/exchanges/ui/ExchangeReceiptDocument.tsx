import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import { formatPdfCurrency } from '@/shared/lib/formatPdfCurrency';
import type { Order } from '@/entities/order/model/types';
import type { User } from '@/entities/user/model/types';
import type { Client } from '@/entities/client/model/types';
import { getPaidAmount } from '@/entities/order/model/model';

const styles = StyleSheet.create({
    page: {
        padding: 25,
        fontFamily: 'Helvetica',
        backgroundColor: '#FFFFFF',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
        alignItems: 'center',
    },
    logo: {
        width: 250,
        height: 60,
        objectFit: 'contain',
    },
    headerRight: {
        alignItems: 'flex-end',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    headerNumber: {
        fontSize: 22,
        fontWeight: 'bold',
        marginTop: 4,
    },
    registryLine: {
        fontSize: 10,
        fontWeight: 'bold',
        marginTop: 6,
        color: '#333',
    },
    consecutiveLabel: {
        fontSize: 9,
        fontWeight: 'bold',
        marginTop: 2,
        color: '#555',
        textTransform: 'uppercase',
    },
    clientInfoSection: {
        marginBottom: 10,
    },
    clientInfoRow: {
        flexDirection: 'row',
        marginBottom: 3,
        fontSize: 12,
    },
    infoLabel: {
        fontWeight: 'bold',
        width: 120,
    },
    infoValue: {
        fontWeight: 'normal',
    },
    table: {
        marginTop: 10,
        borderStyle: 'solid',
        borderWidth: 1.5,
        borderColor: '#000',
    },
    tableHeader: {
        flexDirection: 'row',
        borderBottomWidth: 1.5,
        borderColor: '#000',
        minHeight: 25,
        alignItems: 'center',
        backgroundColor: '#ffffff',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderColor: '#000',
        minHeight: 22,
        alignItems: 'center',
    },
    tableHeaderCell: {
        fontSize: 8,
        fontWeight: 'bold',
        textAlign: 'center',
        padding: 2,
        borderRightWidth: 1,
        borderColor: '#000',
        height: '100%',
        justifyContent: 'center',
        display: 'flex',
    },
    tableCell: {
        fontSize: 8,
        textAlign: 'center',
        padding: 2,
        borderRightWidth: 1,
        borderColor: '#000',
        height: '100%',
        justifyContent: 'center',
        display: 'flex',
    },
    colBrand: { width: '10%' },
    colManual: { width: '9%' },
    colQty: { width: '5%' },
    colDescV: { width: '22%' },
    colDescC: { width: '20%' },
    colQtyR: { width: '5%' },
    colVal: { width: '8%' },
    colAbo: { width: '7%' },
    colSal: { width: '7%' },
    colEnt: { width: '7%', borderRightWidth: 0 },
    summaryLine: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 8,
        marginTop: 12,
        fontSize: 11,
        paddingHorizontal: 10,
    },
    signatureSection: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 50,
    },
    signatureBlock: {
        alignItems: 'center',
        width: '40%',
    },
    signatureLine: {
        width: '100%',
        borderTopWidth: 0.5,
        borderColor: '#000',
        marginBottom: 4,
    },
    signatureText: {
        fontSize: 9,
        color: '#000',
        textAlign: 'center',
    }
});

interface ExchangeReceiptProps {
    orders: Order[];
    user?: User;
    client?: Client;
    /** Consecutivo del cambio (CAM-AAAA-NNNN), mismo que en operación */
    exchangeConsecutive?: string;
    /** Referencia de recibo de venta (ej. PED), si aplica y no es CAM */
    salesReceiptReference?: string;
    formattedDate: string;
    notes?: string;
}

export const ExchangeReceiptDocument: React.FC<ExchangeReceiptProps> = ({
    orders,
    user,
    client,
    exchangeConsecutive: exchangeConsecutiveProp,
    salesReceiptReference,
    formattedDate,
    notes,
}) => {
    const totalAbo = orders.reduce((sum, o) => sum + Number(getPaidAmount(o)), 0);
    const totalValor = orders.reduce(
        (sum, o) => sum + Number(o.realInvoiceTotal ?? o.total ?? 0),
        0
    );
    const logoUrl = '/images/BannerHeader.jpg';

    const exchangeConsecutive =
        exchangeConsecutiveProp ||
        orders
            .map((o) => o.orderNumber)
            .find((n) => n && /^CAM-/i.test(String(n).trim())) ||
        orders
            .map((o) => o.receiptNumber)
            .find((n) => n && /^CAM-/i.test(String(n).trim())) ||
        undefined;

    return (
        <Document>
            <Page size="A4" orientation="landscape" style={styles.page}>
                <View style={styles.headerRow}>
                    <Image style={styles.logo} src={logoUrl} />
                    <View style={styles.headerRight}>
                        <Text style={styles.headerTitle}>RECIBO DE CAMBIO</Text>
                        {exchangeConsecutive ? (
                            <>
                                <Text style={styles.consecutiveLabel}>N° consecutivo cambio</Text>
                                <Text style={styles.headerNumber}>{exchangeConsecutive}</Text>
                            </>
                        ) : null}
                        {salesReceiptReference ? (
                            <Text style={styles.registryLine}>Ref. recibo venta: {salesReceiptReference}</Text>
                        ) : null}
                    </View>
                </View>

                <View style={styles.clientInfoSection}>
                    <View style={styles.clientInfoRow}>
                        <Text style={styles.infoLabel}>Cedula:</Text>
                        <Text style={styles.infoValue}>{client?.identificationNumber || '—'}</Text>
                    </View>
                    <View style={styles.clientInfoRow}>
                        <Text style={styles.infoLabel}>Nombre:</Text>
                        <Text style={styles.infoValue}>{(orders[0]?.clientName || client?.firstName || '').toUpperCase()}</Text>
                    </View>
                    <View style={styles.clientInfoRow}>
                        <Text style={styles.infoLabel}>fecha de entrega:</Text>
                        <Text style={styles.infoValue}>{formattedDate}</Text>
                    </View>
                </View>

                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.tableHeaderCell, styles.colBrand]}>Cátalogo</Text>
                        <Text style={[styles.tableHeaderCell, styles.colManual]}>N° de cambio</Text>
                        <Text style={[styles.tableHeaderCell, styles.colQty]}>cant</Text>
                        <Text style={[styles.tableHeaderCell, styles.colDescV]}>DESCRIPCIÓN DE CAMBIO</Text>
                        <Text style={[styles.tableHeaderCell, styles.colDescC]}>CAMBIO POR</Text>
                        <Text style={[styles.tableHeaderCell, styles.colQtyR]}>cant</Text>
                        <Text style={[styles.tableHeaderCell, styles.colVal]}>Valor</Text>
                        <Text style={[styles.tableHeaderCell, styles.colAbo]}>Abono</Text>
                        <Text style={[styles.tableHeaderCell, styles.colSal]}>Saldo</Text>
                        <Text style={[styles.tableHeaderCell, styles.colEnt]}>P. entrega</Text>
                    </View>

                    {orders.map((o, idx) => {
                        const paid = getPaidAmount(o);
                        const totalVal = Number(o.realInvoiceTotal ?? o.total ?? 0);
                        const pending = Math.max(0, totalVal - paid);
                        return (
                            <View key={idx} style={styles.tableRow}>
                                <Text style={[styles.tableCell, styles.colBrand]}>{o.brandName?.toUpperCase()}</Text>
                                <Text style={[styles.tableCell, styles.colManual]}>{o.sourceOrderNumber || '—'}</Text>
                                <Text style={[styles.tableCell, styles.colQty]}>{o.sourceQuantity || 1}</Text>
                                <Text style={[styles.tableCell, styles.colDescV]}>{o.sourceDescription || 'N/A'}</Text>
                                <Text style={[styles.tableCell, styles.colDescC]}>{o.description || 'N/A'}</Text>
                                <Text style={[styles.tableCell, styles.colQtyR]}>{o.items?.[0]?.quantity || 1}</Text>
                                <Text style={[styles.tableCell, styles.colVal]}>{formatPdfCurrency(totalVal)}</Text>
                                <Text style={[styles.tableCell, styles.colAbo]}>{formatPdfCurrency(paid)}</Text>
                                <Text style={[styles.tableCell, styles.colSal]}>{formatPdfCurrency(pending)}</Text>
                                <Text style={[styles.tableCell, styles.colEnt]}>
                                    {o.possibleDeliveryDate
                                        ? new Date(o.possibleDeliveryDate).toLocaleDateString('es-EC')
                                        : 'N/A'}
                                </Text>
                            </View>
                        );
                    })}
                </View>

                <View style={styles.summaryLine}>
                    <Text style={{ fontWeight: 'bold' }}>N° DE CAMBIOS: {orders.length}</Text>
                    <Text style={{ fontWeight: 'bold' }}>Forma de pago: {orders[0]?.paymentMethod || 'EFECTIVO'}</Text>
                    <Text style={{ fontSize: 10, fontWeight: 'bold' }}>
                        Total valor: {formatPdfCurrency(totalValor)}
                    </Text>
                    <Text style={{ fontSize: 13, fontWeight: 'bold' }}>
                        Total abonado: {formatPdfCurrency(totalAbo)}
                    </Text>
                </View>

                {notes && (
                    <View style={{ marginTop: 15, paddingHorizontal: 10 }}>
                        <Text style={{ fontSize: 10, fontWeight: 'bold', marginBottom: 2 }}>Notas adicionales:</Text>
                        <Text style={{ fontSize: 9, color: '#333' }}>{notes}</Text>
                    </View>
                )}

                <View style={styles.signatureSection}>
                    <View style={styles.signatureBlock}>
                        <View style={styles.signatureLine} />
                        <Text style={styles.signatureText}>Recibido por</Text>
                        <Text style={[styles.signatureText, { fontWeight: 'bold' }]}>{user?.username || 'admin'}</Text>
                    </View>
                    <View style={styles.signatureBlock}>
                        <View style={styles.signatureLine} />
                        <Text style={styles.signatureText}>Nombre de la consultora</Text>
                        <Text style={[styles.signatureText, { fontWeight: 'bold' }]}>{orders[0]?.clientName?.toUpperCase()}</Text>
                        <Text style={styles.signatureText}>{client?.identificationNumber}</Text>
                    </View>
                </View>
            </Page>
        </Document>
    );
};
