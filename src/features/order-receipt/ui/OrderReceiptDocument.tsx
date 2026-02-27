import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import type { Order } from '@/entities/order/model/types';
import type { User } from '@/entities/user/model/types';
import type { Client } from '@/entities/client/model/types';
import { getPendingAmount, getPaidAmount } from '@/entities/order/model/model';

// Register a nice font if possible, otherwise use standard fonts effectively
// Font.register({ family: 'Open Sans', src: '...' }); // Skipped for now to avoid external dependency issues

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontFamily: 'Helvetica',
        backgroundColor: '#FFFFFF',
        color: '#333333',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30,
        borderBottomWidth: 2,
        borderBottomColor: '#2563EB', // Modern blue
        paddingBottom: 20,
    },
    logoContainer: {
        width: 140, // Increased size
        height: 80,
        justifyContent: 'center',
    },
    watermark: {
        position: 'absolute',
        top: 200,
        left: 100,
        width: 400,
        height: 400,
        opacity: 0.1, // Very transparent
        zIndex: -1,
        // transform: 'rotate(-45deg)', // Optional rotation for watermark effect
    },
    logo: {
        width: '100%',
        objectFit: 'contain',
    },
    brandDetails: {
        alignItems: 'flex-end',
    },
    brandTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1E293B', // Slate 800
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    brandSubtitle: {
        fontSize: 10,
        color: '#64748B', // Slate 500
        letterSpacing: 1,
    },
    invoiceInfoContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
    },
    infoBlock: {
        width: '45%',
    },
    infoTitle: {
        fontSize: 11,
        color: '#2563EB',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    infoText: {
        fontSize: 10,
        marginBottom: 3,
        color: '#334155',
    },
    invoiceMeta: {
        alignItems: 'flex-end',
    },
    metaRow: {
        flexDirection: 'row',
        marginBottom: 4,
    },
    metaLabel: {
        fontSize: 10,
        color: '#64748B',
        width: 100,
        textAlign: 'right',
        marginRight: 10,
    },
    metaValue: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#1E293B',
        textAlign: 'right',
        minWidth: 80,
    },
    tableContainer: {
        marginTop: 10,
        marginBottom: 20,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#F1F5F9', // Light slate
        borderBottomWidth: 1,
        borderBottomColor: '#CBD5E1',
        paddingVertical: 8,
        paddingHorizontal: 4,
    },
    tableHeaderCell: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#475569',
        textAlign: 'left',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        paddingVertical: 8,
        paddingHorizontal: 4,
    },
    tableCell: {
        fontSize: 9,
        color: '#334155',
        textAlign: 'left',
    },
    // Column widths
    colType: { width: '15%' },
    colBrand: { width: '15%' },
    colQty: { width: '10%', textAlign: 'center' },
    colDate: { width: '15%' },
    colPrice: { width: '15%', textAlign: 'right' },
    colPaid: { width: '15%', textAlign: 'right' },
    colPending: { width: '15%', textAlign: 'right' },

    summarySection: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 10,
        marginBottom: 30,
    },
    summaryBlock: {
        width: 250,
        backgroundColor: '#F8FAFC',
        padding: 10,
        borderRadius: 4,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    summaryTotalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 6,
        paddingTop: 6,
        borderTopWidth: 1,
        borderTopColor: '#CBD5E1',
    },
    summaryLabel: {
        fontSize: 10,
        color: '#64748B',
    },
    summaryValue: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    totalLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#2563EB',
    },
    totalValue: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#2563EB',
    },
    paymentInfo: {
        marginTop: 20,
        marginBottom: 30,
        padding: 15,
        backgroundColor: '#F0F9FF', // Light blue background
        borderLeftWidth: 4,
        borderLeftColor: '#0EA5E9',
    },
    paymentLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#0369A1',
        marginBottom: 4,
    },
    paymentText: {
        fontSize: 9,
        color: '#0C4A6E',
    },
    footerContainer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
    },
    legalText: {
        fontSize: 8,
        color: '#94A3B8',
        textAlign: 'center',
        marginBottom: 20,
        fontStyle: 'italic',
    },
    signatureContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    signatureBlock: {
        width: '40%',
        alignItems: 'center',
    },
    signatureLine: {
        width: '100%',
        height: 1,
        backgroundColor: '#CBD5E1',
        marginBottom: 8,
    },
    signatureLabel: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#475569',
    },
    signatureWho: {
        fontSize: 8,
        color: '#94A3B8',
    },
});

interface OrderReceiptProps {
    order: Order;
    user?: User; // Optional logged user
    client?: Client; // Extended client details
}

export const OrderReceiptDocument: React.FC<OrderReceiptProps> = ({ order, user, client }) => {
    const currentDate = new Date().toLocaleString('es-EC', { dateStyle: 'long', timeStyle: 'short' });
    const logoUrl = '/images/mochitopng.png'; // Assuming public folder structure

    return (
        <Document>
            <Page size="A4" style={styles.page}>

                {/* WATERMARK */}
                <Image src={logoUrl} style={styles.watermark} fixed />

                {/* HEADER */}
                <View style={styles.headerRow}>
                    <View style={styles.logoContainer}>
                        {/* Try to load logo, fallback to text if fails (though Image handles empty src gracefully) */}
                        <Image style={styles.logo} src={logoUrl} />
                    </View>
                    <View style={styles.brandDetails}>
                        <Text style={styles.brandTitle}>Venta por Catálogo</Text>
                        <Text style={styles.brandSubtitle}>Comprobante de Pedido</Text>
                    </View>
                </View>

                {/* INFO BLOCK */}
                <View style={styles.invoiceInfoContainer}>
                    <View style={styles.infoBlock}>
                        <Text style={styles.infoTitle}>Facturar a:</Text>
                        <Text style={styles.infoText}>{order.clientName}</Text>

                        {/* Extended Client Details */}
                        <Text style={styles.infoText}>Cédula/RUC: {client?.identificationNumber || order.clientId}</Text>
                        {client?.phone1 && (
                            <Text style={styles.infoText}>Celular: {client.phone1}</Text>
                        )}
                        {client?.email && (
                            <Text style={styles.infoText}>Email: {client.email}</Text>
                        )}
                    </View>
                    <View style={[styles.infoBlock, styles.invoiceMeta]}>
                        <View style={styles.metaRow}>
                            <Text style={styles.metaLabel}>Recibo N°:</Text>
                            <Text style={styles.metaValue}>#{order.receiptNumber || '---'}</Text>
                        </View>
                        <View style={styles.metaRow}>
                            <Text style={styles.metaLabel}>Fecha Emisión:</Text>
                            <Text style={styles.metaValue}>{currentDate}</Text>
                        </View>
                        <View style={styles.metaRow}>
                            <Text style={styles.metaLabel}>Vendedor:</Text>
                            <Text style={styles.metaValue}>{user?.name || 'Administrador'}</Text>
                        </View>
                    </View>
                </View>

                {/* TABLE */}
                <View style={styles.tableContainer}>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.tableHeaderCell, styles.colType]}>Tipo</Text>
                        <Text style={[styles.tableHeaderCell, styles.colBrand]}>Catálogo</Text>
                        <Text style={[styles.tableHeaderCell, styles.colQty]}>Cant.</Text>
                        <Text style={[styles.tableHeaderCell, styles.colDate]}>Entrega Est.</Text>
                        <Text style={[styles.tableHeaderCell, styles.colPrice]}>Total</Text>
                        <Text style={[styles.tableHeaderCell, styles.colPaid]}>Abono</Text>
                        <Text style={[styles.tableHeaderCell, styles.colPending]}>Pendiente</Text>
                    </View>

                    <View style={styles.tableRow}>
                        <Text style={[styles.tableCell, styles.colType]}>{order.type}</Text>
                        <Text style={[styles.tableCell, styles.colBrand]}>{order.brandName}</Text>
                        <Text style={[styles.tableCell, styles.colQty]}>{order.items?.[0]?.quantity || 1}</Text>
                        <Text style={[styles.tableCell, styles.colDate]}>
                            {order.possibleDeliveryDate ? new Date(order.possibleDeliveryDate).toLocaleDateString() : 'N/A'}
                        </Text>
                        <Text style={[styles.tableCell, styles.colPrice]}>${Number(order.total).toFixed(2)}</Text>
                        <Text style={[styles.tableCell, styles.colPaid]}>${Number(getPaidAmount(order)).toFixed(2)}</Text>
                        <Text style={[styles.tableCell, styles.colPending]}>${Number(Math.max(0, getPendingAmount(order))).toFixed(2)}</Text>
                    </View>
                </View>

                {/* SUMMARY & TOTALS */}
                <View style={styles.summarySection}>
                    <View style={styles.summaryBlock}>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Subtotal:</Text>
                            <Text style={styles.summaryValue}>${Number(order.total).toFixed(2)}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Abono Inicial:</Text>
                            <Text style={styles.summaryValue}>- ${Number(getPaidAmount(order)).toFixed(2)}</Text>
                        </View>
                        <View style={styles.summaryTotalRow}>
                            <Text style={styles.totalLabel}>Monto Pendiente:</Text>
                            <Text style={styles.totalValue}>${Number(Math.max(0, getPendingAmount(order))).toFixed(2)}</Text>
                        </View>
                    </View>
                </View>

                {/* PAYMENT & NOTES */}
                <View style={styles.paymentInfo}>
                    <Text style={styles.paymentLabel}>Método de Pago: {order.paymentMethod}</Text>
                    {order.paymentMethod === 'TRANSFERENCIA' && (
                        <Text style={styles.paymentText}>* Por favor realizar la transferencia a la cuenta registrada. Enviar comprobante al vendedor.</Text>
                    )}
                    <Text style={[styles.paymentText, { marginTop: 5 }]}>* Nota: Todos los pedidos requieren el 50% de abono inicial.</Text>
                </View>

                {/* FOOTER */}
                <View style={styles.footerContainer}>
                    <Text style={styles.legalText}>
                        Términos y Condiciones: Pedido que no sea retirado dentro de los 10 días será desmantelado y pierde el abono.
                        Gracias por su preferencia.
                    </Text>

                    <View style={styles.signatureContainer}>
                        <View style={styles.signatureBlock}>
                            <View style={styles.signatureLine} />
                            <Text style={styles.signatureLabel}>Vendedor</Text>
                            <Text style={styles.signatureWho}>{user?.name || 'Autorizado'}</Text>
                        </View>
                        <View style={styles.signatureBlock}>
                            <View style={styles.signatureLine} />
                            <Text style={styles.signatureLabel}>Cliente</Text>
                            <Text style={styles.signatureWho}>{order.clientName}</Text>
                        </View>
                    </View>
                </View>

            </Page>
        </Document>
    );
};
