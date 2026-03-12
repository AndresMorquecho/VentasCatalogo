import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import type { Order } from '@/entities/order/model/types';
import type { User } from '@/entities/user/model/types';
import type { Client } from '@/entities/client/model/types';
import { getPaidAmount } from '@/entities/order/model/model';

// Register a nice font if possible, otherwise use standard fonts effectively
// Font.register({ family: 'Open Sans', src: '...' }); // Skipped for now to avoid external dependency issues

const styles = StyleSheet.create({
    page: {
        padding: 30,
        fontFamily: 'Helvetica',
        backgroundColor: '#FFFFFF',
        color: '#000000',
    },
    // Top Section
    headerContainer: {
        marginBottom: 10,
    },
    logoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    logoGroup: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logo: {
        width: 60,
        height: 40,
        objectFit: 'contain',
    },
    logoText: {
        fontSize: 8,
        marginLeft: 5,
        textTransform: 'uppercase',
    },
    receiptGroup: {
        alignItems: 'flex-end',
    },
    receiptLabel: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    receiptNumber: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    
    // Info Rows
    infoRow: {
        flexDirection: 'row',
        fontSize: 10,
        marginBottom: 4,
    },
    empresariaRow: {
        flexDirection: 'row',
        fontSize: 10,
        alignItems: 'center',
        marginBottom: 2,
    },
    label: {
        width: 60,
    },
    divider: {
        borderBottom: '1.5pt solid black',
        width: '100%',
        marginVertical: 4,
    },

    // Table
    table: {
        marginTop: 10,
        border: '1pt solid black',
        borderBottom: 0,
    },
    tableHeader: {
        flexDirection: 'row',
        borderBottom: '1pt solid black',
        backgroundColor: '#FFFFFF',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottom: '1pt solid black',
    },
    tableHeaderCell: {
        fontSize: 10,
        fontWeight: 'bold',
        padding: 4,
        borderRight: '1pt solid black',
        textAlign: 'center',
    },
    tableCell: {
        fontSize: 9,
        padding: 3,
        borderRight: '1pt solid black',
        textAlign: 'center',
    },
    
    // Column Widths
    colNo: { width: '13%' },
    colType: { width: '15%' },
    colCat: { width: '19%' },
    colVal: { width: '14%', textAlign: 'right', paddingRight: 6 },
    colAbo: { width: '10%', textAlign: 'right', paddingRight: 6 },
    colSal: { width: '10%', textAlign: 'right', paddingRight: 6 },
    colDate: { width: '19%', borderRight: 0 },

    // Financial Summary Row
    financialRow: {
        flexDirection: 'row',
        fontSize: 10,
        fontWeight: 'bold',
        marginTop: 5,
    },
    finCol1: { width: '47%' }, // Up to Valor pedido
    finColVal: { width: '14%', textAlign: 'right', paddingRight: 6 },
    finColAbo: { width: '10%', textAlign: 'right', paddingRight: 6 },
    finColSal: { width: '10%', textAlign: 'right', paddingRight: 6 },

    // Footer Info
    footerInfo: {
        marginTop: 5,
        fontSize: 10,
    },
    observations: {
        marginTop: 10,
        marginBottom: 30,
    },

    // Legal Notes
    legalSection: {
        marginTop: 20,
        fontSize: 10,
        lineHeight: 1.2,
    },
    noteBold: {
        fontWeight: 'bold',
        fontStyle: 'italic',
    },
    notimonchito: {
        fontWeight: 'bold',
        marginTop: 10,
    },

    // Signatures
    signatureContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'flex-end',
        marginTop: 20,
    },
    signatureBlock: {
        alignItems: 'center',
        width: 200,
    },
    signatureLine: {
        width: '100%',
        borderBottom: '1pt solid black',
        marginBottom: 5,
    },
    signatureLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        fontStyle: 'italic',
    },
    signatureName: {
        fontSize: 10,
        marginBottom: 2,
    }
});

interface OrderReceiptProps {
    order: Order;
    childOrders?: Order[];
    user?: User;
    client?: Client;
    receiptNumber?: string; // Optional override for the general receipt number
}

export const OrderReceiptDocument: React.FC<OrderReceiptProps> = ({ order, childOrders = [], user, client, receiptNumber }) => {
    const allOrders = [order, ...childOrders];
    
    const totalVal = allOrders.reduce((sum, o) => sum + Number(o.total), 0);
    const totalAbo = allOrders.reduce((sum, o) => sum + Number(getPaidAmount(o)), 0);
    const totalSal = totalVal - totalAbo;

    const formattedDate = new Date().toLocaleString('es-EC', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    }).replace(',', '');
    
    const logoUrl = '/images/mochitopng.png';

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* HEADER */}
                <View style={styles.headerContainer}>
                    <View style={styles.logoRow}>
                        <View style={styles.logoGroup}>
                            <Image style={styles.logo} src={logoUrl} />
                            <Text style={styles.logoText}>VENTA POR CATÁLOGO</Text>
                        </View>
                        <View style={styles.receiptGroup}>
                            <Text style={styles.receiptLabel}>RECIBO No</Text>
                            <Text style={styles.receiptNumber}>{receiptNumber || order.receiptNumber || 'ORD-000000'}</Text>
                        </View>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Fecha:</Text>
                        <Text>{formattedDate}</Text>
                    </View>

                    <View style={styles.empresariaRow}>
                        <Text style={styles.label}>Empresaria:</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                            <Text style={{ fontSize: 10 }}>{client?.identificationNumber || order.clientId}</Text>
                            <Text style={{ fontWeight: 'bold', textTransform: 'uppercase', marginLeft: 20, fontSize: 10 }}>
                                {order.clientName || client?.firstName}
                            </Text>
                        </View>
                        <Text style={{ fontSize: 10 }}>Teléfonos:  2787237--</Text>
                    </View>
                    <View style={styles.divider} />
                </View>

                {/* TABLE */}
                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.tableHeaderCell, styles.colNo]}>No pedido</Text>
                        <Text style={[styles.tableHeaderCell, styles.colType]}>Tipo pedido</Text>
                        <Text style={[styles.tableHeaderCell, styles.colCat]}>Catálogo</Text>
                        <Text style={[styles.tableHeaderCell, styles.colVal]}>Valor pedido</Text>
                        <Text style={[styles.tableHeaderCell, styles.colAbo]}>Abono</Text>
                        <Text style={[styles.tableHeaderCell, styles.colSal]}>Saldo</Text>
                        <Text style={[styles.tableHeaderCell, styles.colDate]}>Posible fecha de entrega</Text>
                    </View>

                    {allOrders.map((o, idx) => {
                        const paid = getPaidAmount(o);
                        const pending = Number(o.total) - paid;
                        return (
                            <View key={idx} style={styles.tableRow}>
                                <Text style={[styles.tableCell, styles.colNo]}>{o.orderNumber || idx+1}</Text>
                                <Text style={[styles.tableCell, styles.colType]}>{o.type}</Text>
                                <Text style={[styles.tableCell, styles.colCat]}>{o.brandName}</Text>
                                <Text style={[styles.tableCell, styles.colVal]}>{Number(o.total).toFixed(2)}</Text>
                                <Text style={[styles.tableCell, styles.colAbo]}>{paid.toFixed(2)}</Text>
                                <Text style={[styles.tableCell, styles.colSal]}>{pending.toFixed(2)}</Text>
                                <Text style={[styles.tableCell, styles.colDate]}>
                                    {o.possibleDeliveryDate ? new Date(o.possibleDeliveryDate).toLocaleDateString('es-EC') : 'N/A'}
                                </Text>
                            </View>
                        );
                    })}
                </View>

                {/* FINANCIAL SUMMARY */}
                <View style={styles.financialRow}>
                    <View style={styles.finCol1}>
                        <Text>Forma de pago: {order.paymentMethod}</Text>
                    </View>
                    <Text style={styles.finColVal}>{totalVal.toFixed(2)}</Text>
                    <Text style={styles.finColAbo}>{totalAbo.toFixed(2)}</Text>
                    <Text style={styles.finColSal}>{totalSal.toFixed(2)}</Text>
                </View>

                {/* FOOTER INFO */}
                <View style={styles.footerInfo}>
                    <View style={{ flexDirection: 'row', marginBottom: 5 }}>
                        <Text style={{ width: '47%' }}>No de documento: {order.receiptNumber || ""}</Text>
                        <Text>Teléfono de contacto: {client?.phone1 || ""}</Text>
                    </View>
                    <View style={styles.observations}>
                        <Text>Observaciones:</Text>
                        <Text style={{ marginTop: 2 }}>{order.notes || ""}</Text>
                    </View>
                </View>

                {/* LEGAL NOTES */}
                <View style={styles.legalSection}>
                    <Text style={styles.noteBold}>Nota: Todos los pedidos serán ingresados con el 50%</Text>
                    <Text style={styles.noteBold}>caso contrario no se realizará.</Text>
                    <Text style={styles.noteBold}>Pedido que no sea retirado dentro de los 10 días será</Text>
                    <Text style={styles.noteBold}>desmantelado y pierde el abono</Text>
                    <Text style={styles.notimonchito}>NOTIMONCHITO:</Text>
                </View>

                {/* SIGNATURES */}
                <View style={styles.signatureContainer}>
                    <View style={styles.signatureBlock}>
                        <Text style={styles.signatureName}>{user?.name?.toUpperCase() || ""}</Text>
                        <View style={styles.signatureLine} />
                        <Text style={styles.signatureLabel}>Vendedor</Text>
                    </View>
                    <View style={styles.signatureBlock}>
                        <View style={{ height: 15 }} />
                        <View style={styles.signatureLine} />
                        <Text style={styles.signatureLabel}>Empresario/a</Text>
                    </View>
                </View>
            </Page>
        </Document>
    );
};
