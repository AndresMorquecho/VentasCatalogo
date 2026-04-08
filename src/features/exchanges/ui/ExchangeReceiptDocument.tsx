import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
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
    // Header
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
        alignItems: 'center',
    },
    logo: {
        width: 300,
        height: 80,
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
    // Client Info
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
    // Table (Box Style)
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
        minHeight: 35,
        alignItems: 'center',
        backgroundColor: '#ffffff',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderColor: '#000',
        minHeight: 40,
        alignItems: 'center',
    },
    tableHeaderCell: {
        fontSize: 10,
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
        fontSize: 9,
        textAlign: 'center',
        padding: 4,
        borderRightWidth: 1,
        borderColor: '#000',
        height: '100%',
        justifyContent: 'center',
        display: 'flex',
    },
    // Column Widths (Landscape - 10 col)
    colBrand: { width: '10%' },
    colManual: { width: '10%' },
    colQty: { width: '5%' },
    colDescV: { width: '18%' },
    colDescC: { width: '18%' },
    colQtyR: { width: '5%' },
    colVal: { width: '9%' },
    colAbo: { width: '8%' },
    colSal: { width: '8%' },
    colEnt: { width: '9%', borderRightWidth: 0 },

    // Summary Line
    summaryLine: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 12,
        fontSize: 11,
        paddingHorizontal: 10,
    },
    // Signatures
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
    receiptNumber: string;
    formattedDate: string;
    notes?: string;
}

export const ExchangeReceiptDocument: React.FC<ExchangeReceiptProps> = ({ 
    orders, 
    user, 
    client, 
    receiptNumber,
    formattedDate,
    notes
}) => {
    const totalAbo = orders.reduce((sum, o) => sum + Number(getPaidAmount(o)), 0);
    const logoUrl = '/images/BannerHeader.jpg';

    return (
        <Document>
            <Page size="A4" orientation="landscape" style={styles.page}>
                {/* HEADER */}
                <View style={styles.headerRow}>
                    <Image style={styles.logo} src={logoUrl} />
                    <View style={styles.headerRight}>
                        <Text style={styles.headerTitle}>NO. DE CAMBIO</Text>
                        <Text style={styles.headerNumber}>{receiptNumber}</Text>
                    </View>
                </View>

                {/* CLIENT INFO */}
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

                {/* TABLE */}
                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.tableHeaderCell, styles.colBrand]}>Cátalogo</Text>
                        <Text style={[styles.tableHeaderCell, styles.colManual]}>N° de cambio</Text>
                        <Text style={[styles.tableHeaderCell, styles.colQty]}>cant</Text>
                        <Text style={[styles.tableHeaderCell, styles.colDescV]}>descripcion (se va)</Text>
                        <Text style={[styles.tableHeaderCell, styles.colDescC]}>descripcion (viene)</Text>
                        <Text style={[styles.tableHeaderCell, styles.colQtyR]}>cant</Text>
                        <Text style={[styles.tableHeaderCell, styles.colVal]}>valor</Text>
                        <Text style={[styles.tableHeaderCell, styles.colAbo]}>abono</Text>
                        <Text style={[styles.tableHeaderCell, styles.colSal]}>saldo</Text>
                        <Text style={[styles.tableHeaderCell, styles.colEnt]}>P. Entrega</Text>
                    </View>

                    {orders.map((o, idx) => {
                        const paid = getPaidAmount(o);
                        const pending = Number(o.total) - paid;
                        return (
                            <View key={idx} style={styles.tableRow}>
                                <Text style={[styles.tableCell, styles.colBrand]}>{o.brandName?.toUpperCase()}</Text>
                                <Text style={[styles.tableCell, styles.colManual]}>{o.sourceOrderNumber || '—'}</Text>
                                <Text style={[styles.tableCell, styles.colQty]}>{o.sourceQuantity || 1}</Text>
                                <Text style={[styles.tableCell, styles.colDescV]}>{o.sourceDescription || 'N/A'}</Text>
                                <Text style={[styles.tableCell, styles.colDescC]}>{o.description || 'N/A'}</Text>
                                <Text style={[styles.tableCell, styles.colQtyR]}>{o.items?.[0]?.quantity || 1}</Text>
                                <Text style={[styles.tableCell, styles.colVal]}>{Number(o.total).toFixed(0)}</Text>
                                <Text style={[styles.tableCell, styles.colAbo]}>{paid.toFixed(0)}</Text>
                                <Text style={[styles.tableCell, styles.colSal]}>{pending.toFixed(0)}</Text>
                                <Text style={[styles.tableCell, styles.colEnt]}>
                                    {o.possibleDeliveryDate ? new Date(o.possibleDeliveryDate).toLocaleDateString('es-EC') : 'N/A'}
                                </Text>
                            </View>
                        );
                    })}
                </View>

                {/* SUMMARY LINE */}
                <View style={styles.summaryLine}>
                    <Text style={{ fontWeight: 'bold' }}>N° DE CAMBIOS: {orders.length}</Text>
                    <Text style={{ fontWeight: 'bold' }}>Forma de pago: {orders[0]?.paymentMethod || 'EFECTIVO'}</Text>
                    <Text style={{ fontSize: 13, fontWeight: 'bold' }}>VALOR CANCELADO: {totalAbo.toFixed(2)}</Text>
                </View>

                {/* ADDITIONAL NOTES */}
                {notes && (
                    <View style={{ marginTop: 15, paddingHorizontal: 10 }}>
                        <Text style={{ fontSize: 10, fontWeight: 'bold', marginBottom: 2 }}>Notas adicionales de la guía:</Text>
                        <Text style={{ fontSize: 9, color: '#333' }}>{notes}</Text>
                    </View>
                )}

                {/* SIGNATURES */}
                <View style={styles.signatureSection}>
                    <View style={styles.signatureBlock}>
                        <View style={styles.signatureLine} />
                        <Text style={styles.signatureText}>Entregado Por</Text>
                        <Text style={[styles.signatureText, { fontWeight: 'bold' }]}>{user?.username || 'admin'}</Text>
                    </View>
                    <View style={styles.signatureBlock}>
                        <View style={styles.signatureLine} />
                        <Text style={styles.signatureText}>Recibido Conforme (Empresaria)</Text>
                        <Text style={[styles.signatureText, { fontWeight: 'bold' }]}>{orders[0]?.clientName?.toUpperCase()}</Text>
                        <Text style={styles.signatureText}>{client?.identificationNumber}</Text>
                    </View>
                </View>
            </Page>
        </Document>
    );
};
