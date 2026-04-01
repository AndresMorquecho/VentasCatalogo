import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import type { Order } from '@/entities/order/model/types';
import type { User } from '@/entities/user/model/types';
import type { Client } from '@/entities/client/model/types';
import { getPaidAmount } from '@/entities/order/model/model';

const styles = StyleSheet.create({
    page: {
        padding: 30,
        fontFamily: 'Helvetica',
        backgroundColor: '#FFFFFF',
        color: '#000000',
    },
    // Top Section
    headerContainer: {
        marginBottom: 15,
        borderBottom: '1.5pt solid black',
        paddingBottom: 10,
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
        width: 140,
        height: 70,
        objectFit: 'contain',
    },
    logoText: {
        fontSize: 14,
        marginLeft: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    receiptGroup: {
        alignItems: 'flex-end',
    },
    receiptLabel: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    receiptNumber: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    
    // Info Rows
    infoRow: {
        flexDirection: 'row',
        fontSize: 11,
        marginBottom: 5,
    },
    label: {
        width: 60,
        fontWeight: 'bold',
    },
    divider: {
        borderBottom: '1.5pt solid black',
        width: '100%',
        marginVertical: 4,
    },

    // Table
    table: {
        marginTop: 5,
        border: '1pt solid black',
        borderBottom: 0,
    },
    tableHeader: {
        flexDirection: 'row',
        borderBottom: '1pt solid black',
        backgroundColor: '#f3f4f6',
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
    colVal: { width: '14%', textAlign: 'center' },
    colAbo: { width: '10%', textAlign: 'center' },
    colSal: { width: '10%', textAlign: 'center' },
    colDate: { width: '19%', borderRight: 0 },

    // Financial Summary Row
    financialRow: {
        flexDirection: 'row',
        fontSize: 11,
        fontWeight: 'bold',
        marginTop: 5,
        borderBottom: '1pt solid black',
        paddingBottom: 5,
    },
    finCol1: { width: '47%' },
    finColVal: { width: '14%', textAlign: 'right', paddingRight: 6 },
    finColAbo: { width: '10%', textAlign: 'right', paddingRight: 6 },
    finColSal: { width: '10%', textAlign: 'right', paddingRight: 6 },

    // Footer Info
    footerInfo: {
        marginTop: 10,
        fontSize: 10,
    },
    observations: {
        marginTop: 10,
        marginBottom: 20,
    },

    // Legal Notes
    legalSection: {
        marginTop: 15,
        fontSize: 10,
        lineHeight: 1.2,
    },
    noteBold: {
        fontWeight: 'bold',
        fontStyle: 'italic',
    },
    notimonchito: {
        fontWeight: 'bold',
        marginTop: 5,
    },

    // Signatures
    signatureContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'flex-end',
        marginTop: 30,
    },
    signatureBlock: {
        alignItems: 'center',
        width: 180,
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
    bank?: any;
    receiptNumber?: string;
    settings?: {
        location?: string;
        phone?: string;
        support_phone?: string;
        note?: string;
    };
}

export const OrderReceiptDocument: React.FC<OrderReceiptProps> = ({ 
    order, 
    childOrders = [], 
    user, 
    client, 
    bank, 
    receiptNumber,
    settings 
}) => {
    const allOrders = [order, ...childOrders];
    
    const totalVal = allOrders.reduce((sum, o) => sum + Number(o.total), 0);
    const totalAbo = allOrders.reduce((sum, o) => sum + Number(getPaidAmount(o)), 0);
    const totalSal = totalVal - totalAbo;

    // Obtener desglose de métodos de pago — siempre iterar sobre los pagos reales
    const paymentBreakdown: { method: string, amount: number }[] = [];
    const methodsMap = new Map<string, number>();

    allOrders.forEach(o => {
        o.payments?.forEach((p: any) => {
            if (p.financialRecords && p.financialRecords.length > 0) {
                // Usar los registros financieros que tienen el método exacto (EFECTIVO, BILLETERA_VIRTUAL, etc.)
                p.financialRecords.forEach((fr: any) => {
                    const m = fr.paymentMethod || p.method || 'OTROS';
                    // Normalizar CREDITO_CLIENTE → BILLETERA_VIRTUAL para consistencia en el recibo
                    const normalized = (m === 'CREDITO_CLIENTE' || m === 'SALDO_A_FAVOR') ? 'BILLETERA_VIRTUAL' : m;
                    if (normalized !== 'SPLIT_PAYMENT') {
                        methodsMap.set(normalized, (methodsMap.get(normalized) || 0) + Number(fr.amount));
                    }
                });
            } else if (p.method && p.method !== 'SPLIT_PAYMENT') {
                // Fallback: usar el método directo del pago
                const normalized = (p.method === 'CREDITO_CLIENTE' || p.method === 'SALDO_A_FAVOR') ? 'BILLETERA_VIRTUAL' : p.method;
                methodsMap.set(normalized, (methodsMap.get(normalized) || 0) + Number(p.amount));
            }
        });
    });

    if (methodsMap.size > 0) {
        methodsMap.forEach((amount, method) => {
            paymentBreakdown.push({ method, amount });
        });
    } else {
        // Fallback absoluto si no hay pagos vinculados
        paymentBreakdown.push({ method: order.paymentMethod, amount: totalAbo });
    }

    const formattedDate = new Date().toLocaleString('es-EC', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    }).replace(',', '');
    
    // Nueva imagen proporcionada por el usuario
    const logoUrl = '/images/BannerHeader.jpg';

    const paymentLabels: Record<string, string> = {
        'TRANSFERENCIA': 'Transferencia Bancaria',
        'EFECTIVO': 'Efectivo',
        'DEPOSITO': 'Depósito',
        'BILLETERA_VIRTUAL': 'Billetera Virtual',
        'CREDITO_CLIENTE': 'Crédito aplicado',
        'SPLIT_PAYMENT': 'Pago Combinado'
    };

    const friendlyPayment = paymentLabels[order.paymentMethod] || order.paymentMethod;

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* HEADER */}
                <View style={[styles.logoRow, { marginBottom: 20 }]}>
                    <Image style={{ width: 320, height: 80, objectFit: 'contain' }} src={logoUrl} />
                    <View style={styles.receiptGroup}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Recibo No</Text>
                        <Text style={{ fontSize: 22, fontWeight: 'bold' }}>{receiptNumber || order.receiptNumber || 'ORD-000000'}</Text>
                    </View>
                </View>

                {/* INFO SECTION */}
                <View style={{ marginBottom: 15 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <View style={{ gap: 3 }}>
                            <View style={styles.infoRow}>
                                <Text style={styles.label}>Fecha:</Text>
                                <Text>{formattedDate}</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Text style={styles.label}>Cedula:</Text>
                                <Text style={{ fontWeight: 'bold' }}>{client?.identificationNumber || order.clientId}</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Text style={styles.label}>Nombre:</Text>
                                <Text style={{ textTransform: 'uppercase', fontWeight: 'bold' }}>{order.clientName || client?.firstName}</Text>
                            </View>
                        </View>
                        <View style={{ gap: 2, alignItems: 'flex-end', paddingTop: 5 }}>
                            <Text style={{ fontSize: 10, fontWeight: 'bold' }}>
                                Teléfonos:  {settings?.phone || "2787237"}{settings?.support_phone ? ` / ${settings.support_phone}` : ""}
                            </Text>
                            <Text style={{ fontSize: 10 }}>{settings?.location || "Quito - Ecuador"}</Text>
                        </View>
                    </View>
                    <View style={{ borderBottom: '1pt solid black', marginTop: 10, width: '100%' }} />
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
                                <Text style={[styles.tableCell, styles.colNo]}>{o.orderNumber || idx + 1}</Text>
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
                    
                    {/* FINANCIAL SUMMARY ROW */}
                    <View style={{ flexDirection: 'row', fontSize: 10, fontWeight: 'bold', backgroundColor: '#fcfcfc', borderBottom: '1pt solid black' }}>
                        <View style={[styles.tableCell, { width: '47%', textAlign: 'left', paddingLeft: 6, alignItems: 'flex-start', borderRight: '1pt solid black' }]}>
                             <Text>Forma de pago: {friendlyPayment}</Text>
                             {/* Se eliminó el desglose de aquí para moverlo arriba de observaciones */}
                             {(order.paymentMethod === 'TRANSFERENCIA' || order.paymentMethod === 'DEPOSITO') && bank && (
                                <Text style={{ fontSize: 8, marginTop: 1 }}>Banco: {bank.name} - {bank.accountNumber || ''}</Text>
                             )}
                             {(order.paymentMethod === 'TRANSFERENCIA' || order.paymentMethod === 'DEPOSITO') && bank && (
                                <Text style={{ fontSize: 8, marginTop: 1 }}>Banco: {bank.name} - {bank.accountNumber || ''}</Text>
                             )}
                        </View>
                        <Text style={[styles.tableCell, styles.colVal, { borderRight: '1pt solid black' }]}>{totalVal.toFixed(2)}</Text>
                        <Text style={[styles.tableCell, styles.colAbo, { borderRight: '1pt solid black' }]}>{totalAbo.toFixed(2)}</Text>
                        <Text style={[styles.tableCell, styles.colSal, { borderRight: '1pt solid black' }]}>{totalSal.toFixed(2)}</Text>
                        <Text style={[styles.tableCell, styles.colDate]} />
                    </View>
                </View>

                {/* FOOTER INFO */}
                <View style={styles.footerInfo}>
                    <View style={{ flexDirection: 'row', marginBottom: 5 }}>
                        <Text style={{ width: '47%' }}>No de documento: {order.receiptNumber || ""}</Text>
                        <Text>Teléfono de contacto: {client?.phone1 || (order as any).clientPhone || ""}</Text>
                    </View>
                    
                    {/* DESGLOSE DE ABONOS */}
                    {paymentBreakdown.length > 0 && (
                        <View style={{ marginTop: 5, marginBottom: 10 }}>
                            <Text style={{ fontSize: 10, fontWeight: 'bold', borderBottom: '0.5pt solid #eee', paddingBottom: 2, marginBottom: 3 }}>Desglose de Pago:</Text>
                            {paymentBreakdown.map((pb, idx) => (
                                <Text key={idx} style={{ fontSize: 10, marginLeft: 5, marginBottom: 2 }}>
                                    • Abono {paymentLabels[pb.method] || pb.method}: <Text style={{ fontWeight: 'bold' }}>${pb.amount.toFixed(2)}</Text>
                                </Text>
                            ))}
                        </View>
                    )}

                    <View style={styles.observations}>
                        <Text style={{ fontWeight: 'bold' }}>Observaciones:</Text>
                        <Text style={{ marginTop: 2, fontSize: 9 }}>{order.notes || ""}</Text>
                    </View>
                </View>

                {/* LEGAL NOTES */}
                <View style={styles.legalSection}>
                    <Text style={styles.noteBold}>Nota: Todos los pedidos serán ingresados con el 50%</Text>
                    <Text style={styles.noteBold}>caso contrario no se realizará.</Text>
                    <Text style={styles.noteBold}>Pedido que no sea retirado dentro de los 10 días será</Text>
                    <Text style={styles.noteBold}>desmantelado y pierde el abono</Text>
                    <Text style={styles.notimonchito}>NOTIMONCHITO:</Text>
                    <Text style={{ fontSize: 9, marginTop: 2 }}>{settings?.note || ""}</Text>
                </View>

                {/* SIGNATURES */}
                <View style={[styles.signatureContainer, { marginTop: 40 }]}>
                    <View style={styles.signatureBlock}>
                        <Text style={styles.signatureName}>{user?.username?.toUpperCase() || order.createdByName?.toUpperCase() || "ADMIN"}</Text>
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
