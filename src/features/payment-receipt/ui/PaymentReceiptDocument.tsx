
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import type { Order } from '@/entities/order/model/types';
import type { Client } from '@/entities/client/model/types';

const styles = StyleSheet.create({
    page: {
        padding: 0, // Remove padding to allow full-width banner
        fontFamily: 'Helvetica',
        backgroundColor: '#FFFFFF',
    },
    contentPadding: {
        padding: 30,
    },
    headerWrapper: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    logo: {
        width: 150,
        height: 60,
        objectFit: 'contain',
    },
    clientCardHeader: {
        marginTop: 10,
        marginBottom: 10,
    },
    headerRow: {
        flexDirection: 'row',
        gap: 5,
        marginBottom: 2,
    },
    boldLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#000',
    },
    headerText: {
        fontSize: 10,
        color: '#000',
    },
    mainTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#000',
        textAlign: 'right',
    },
    rightContact: {
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    metaSection: {
        marginBottom: 15,
    },
    metaRow: {
        flexDirection: 'row',
        gap: 5,
        marginBottom: 2,
    },
    separator: {
        borderBottomWidth: 1,
        borderBottomColor: '#000',
        marginBottom: 10,
    },
    table: {
        width: '100%',
        marginTop: 10,
        borderTopWidth: 1,
        borderLeftWidth: 1,
        borderColor: '#000',
    },
    tableRow: {
        flexDirection: 'row',
        alignItems: 'stretch',
    },
    tableCol: {
        borderRightWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#000',
        padding: 4,
        flexDirection: 'column',
        justifyContent: 'center',
    },
    tableHeaderCell: {
        fontSize: 8,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    tableCell: {
        fontSize: 8,
        textAlign: 'center',
    },
    colNum: { width: '7%' },
    colDateTime: { width: '13%' },
    colMethod: { width: '10%' },
    colRef: { width: '10%' },
    colUser: { width: '10%' },
    colObs: { width: '20%' },
    colMonto: { width: '10%' },
    colAbono: { width: '10%' },
    colSaldo: { width: '10%' },
    summarySection: {
        marginTop: 20,
        alignItems: 'flex-end',
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        width: '40%',
        marginBottom: 4,
    },
    summaryLabel: {
        fontSize: 9,
        fontWeight: 'bold',
        textAlign: 'right',
        flex: 1,
        paddingRight: 10,
    },
    summaryValue: {
        fontSize: 9,
        textAlign: 'right',
        width: 60,
    },
    balanceRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        width: '40%',
        marginTop: 5,
        borderTopWidth: 1,
        borderTopColor: '#000',
        paddingTop: 8,
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 30,
        right: 30,
        borderTopWidth: 0.5,
        borderTopColor: '#e2e8f0',
        paddingTop: 10,
        textAlign: 'center',
    },
    footerText: {
        fontSize: 7,
        color: '#94a3b8',
    }
});

interface Props {
    order: Order;
    payments: any[];
    userName: string;
    client?: Client;
}

const METHOD_LABELS: Record<string, string> = {
    EFECTIVO: 'Efectivo',
    TRANSFERENCIA: 'Transf.',
    DEPOSITO: 'Depósito',
    CHEQUE: 'Cheque',
    BILLETERA_VIRTUAL: 'Virtual',
    CREDITO_CLIENTE: 'Crédito',
    SPLIT_PAYMENT: 'Split',
};

function formatMethod(method: string): string {
    return METHOD_LABELS[method] || method;
}

function buildExpandedPayments(payments: any[]): any[] {
    const sorted = [...payments].sort((a, b) =>
        new Date(a.date || a.createdAt).getTime() - new Date(b.date || b.createdAt).getTime()
    );

    const rows: any[] = [];

    sorted.forEach((p) => {
        if (p.method === 'SPLIT_PAYMENT' && p.financialRecords && p.financialRecords.length > 0) {
            p.financialRecords.forEach((fr: any) => {
                rows.push({
                    receiptNumber: p.receiptNumber,
                    date: p.date || p.createdAt,
                    method: fr.paymentMethod,
                    bank: fr.bankAccountName || '-',
                    reference: fr.referenceNumber || p.reference || '-',
                    user: fr.createdBy || p.createdByName || '-',
                    notes: fr.notes || p.description || p.notes || '-',
                    amount: fr.amount,
                });
            });
        } else {
            rows.push({
                receiptNumber: p.receiptNumber,
                date: p.date || p.createdAt,
                method: p.method,
                bank: p.bankAccountName || '-',
                reference: p.reference || '-',
                user: p.createdByName || p.createdBy || '-',
                notes: p.description || p.notes || '-',
                amount: p.amount,
            });
        }
    });

    return rows;
}

export const PaymentReceiptDocument = ({ order, payments, userName, client }: Props) => {
    const totalEstimate = order.realInvoiceTotal || order.total || 0;
    const rows = buildExpandedPayments(payments || []);

    // Header image
    const bannerUrl = '/images/BannerHeader.jpg';

    const totalPaid = rows.reduce((acc, p) => acc + p.amount, 0);
    const finalBalance = totalEstimate - totalPaid;

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.contentPadding}>
                    {/* Header: Logo & Report Title */}
                    <View style={styles.headerWrapper}>
                        <View>
                            <Image src={bannerUrl} style={styles.logo} />
                            <View style={styles.clientCardHeader}>
                                <View style={styles.headerRow}>
                                    <Text style={styles.boldLabel}>Cedula:</Text>
                                    <Text style={styles.headerText}>{client?.identificationNumber || '---'}</Text>
                                </View>
                                <View style={styles.headerRow}>
                                    <Text style={styles.boldLabel}>Nombre:</Text>
                                    <Text style={styles.headerText}>{order.clientName}</Text>
                                </View>
                            </View>
                        </View>
                        <View style={styles.rightContact}>
                            <Text style={styles.mainTitle}>ESTADO DE CUENTA</Text>
                            <View style={{ marginTop: 10 }}>
                                <Text style={styles.headerText}>Teléfonos: {client?.phone1 || '---'}</Text>
                                <Text style={styles.headerText}>{client?.city || 'Quito'} - {client?.country || 'Ecuador'}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.separator} />

                    {/* Meta Data Section */}
                    <View style={styles.metaSection}>
                        <View style={styles.metaRow}>
                            <Text style={styles.boldLabel}>Marca:</Text>
                            <Text style={styles.headerText}>{order.brandName || '---'}</Text>
                        </View>
                        <View style={styles.metaRow}>
                            <Text style={styles.boldLabel}>Nro. Orden:</Text>
                            <Text style={styles.headerText}>{order.orderNumber || '---'}</Text>
                        </View>
                        <View style={styles.metaRow}>
                            <Text style={styles.boldLabel}>Nro. Pedido:</Text>
                            <Text style={styles.headerText}>{order.receiptNumber || '---'}</Text>
                        </View>
                    </View>

                    {/* Statement Table */}
                    <View style={styles.table}>
                        <View style={styles.tableRow}>
                            <View style={[styles.tableCol, styles.colNum]}><Text style={styles.tableHeaderCell}>N° Abono</Text></View>
                            <View style={[styles.tableCol, styles.colDateTime]}><Text style={styles.tableHeaderCell}>Fecha Hora</Text></View>
                            <View style={[styles.tableCol, styles.colMethod]}><Text style={styles.tableHeaderCell}>Método</Text></View>
                            <View style={[styles.tableCol, styles.colRef]}><Text style={styles.tableHeaderCell}>Ref.</Text></View>
                            <View style={[styles.tableCol, styles.colUser]}><Text style={styles.tableHeaderCell}>Reg. Por</Text></View>
                            <View style={[styles.tableCol, styles.colObs]}><Text style={styles.tableHeaderCell}>Obs.</Text></View>
                            <View style={[styles.tableCol, styles.colMonto]}><Text style={styles.tableHeaderCell}>Monto</Text></View>
                            <View style={[styles.tableCol, styles.colAbono]}><Text style={styles.tableHeaderCell}>Abono</Text></View>
                            <View style={[styles.tableCol, styles.colSaldo]}><Text style={styles.tableHeaderCell}>Saldo</Text></View>
                        </View>

                        {/* Initial Debt Row */}
                        {(() => {
                            let currentSaldo = totalEstimate;
                            return (
                                <View style={styles.tableRow}>
                                    <View style={[styles.tableCol, styles.colNum]}><Text style={styles.tableCell}>-</Text></View>
                                    <View style={[styles.tableCol, styles.colDateTime]}>
                                        <Text style={styles.tableCell}>{new Date(order.createdAt).toLocaleString('es-EC', {
                                            year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
                                        })}</Text>
                                    </View>
                                    <View style={[styles.tableCol, styles.colMethod]}><Text style={styles.tableCell}>-</Text></View>
                                    <View style={[styles.tableCol, styles.colRef]}><Text style={styles.tableCell}>-</Text></View>
                                    <View style={[styles.tableCol, styles.colUser]}><Text style={styles.tableCell}>Sistema</Text></View>
                                    <View style={[styles.tableCol, styles.colObs]}><Text style={[styles.tableCell, { fontWeight: 'bold' }]}>Deuda Inicial</Text></View>
                                    <View style={[styles.tableCol, styles.colMonto]}><Text style={styles.tableCell}>{currentSaldo.toFixed(2)}</Text></View>
                                    <View style={[styles.tableCol, styles.colAbono]}><Text style={styles.tableCell}>-</Text></View>
                                    <View style={[styles.tableCol, styles.colSaldo]}><Text style={[styles.tableCell, { fontWeight: 'bold' }]}>{currentSaldo.toFixed(2)}</Text></View>
                                </View>
                            )
                        })()}

                        {/* Payment Rows */}
                        {(() => {
                            let currentSaldo = totalEstimate;
                            return rows.map((p, idx) => {
                                currentSaldo -= p.amount;
                                return (
                                    <View key={idx} style={styles.tableRow}>
                                        <View style={[styles.tableCol, styles.colNum]}><Text style={styles.tableCell}>{`AB${String(idx + 1).padStart(3, '0')}`}</Text></View>
                                        <View style={[styles.tableCol, styles.colDateTime]}>
                                            <Text style={styles.tableCell}>{new Date(p.date).toLocaleString('es-EC', {
                                                year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
                                            })}</Text>
                                        </View>
                                        <View style={[styles.tableCol, styles.colMethod]}><Text style={styles.tableCell}>{formatMethod(p.method)}</Text></View>
                                        <View style={[styles.tableCol, styles.colRef]}><Text style={styles.tableCell}>{p.bank || p.reference || '-'}</Text></View>
                                        <View style={[styles.tableCol, styles.colUser]}><Text style={styles.tableCell}>{p.user || '-'}</Text></View>
                                        <View style={[styles.tableCol, styles.colObs]}><Text style={styles.tableCell}>{p.notes?.replace(' (fila 1)', '') || '-'}</Text></View>
                                        <View style={[styles.tableCol, styles.colMonto]}><Text style={styles.tableCell}>-</Text></View>
                                        <View style={[styles.tableCol, styles.colAbono]}><Text style={styles.tableCell}>{p.amount.toFixed(2)}</Text></View>
                                        <View style={[styles.tableCol, styles.colSaldo]}><Text style={[styles.tableCell, { fontWeight: 'bold' }]}>{currentSaldo.toFixed(2)}</Text></View>
                                    </View>
                                );
                            });
                        })()}
                    </View>

                    {/* Summary Footer */}
                    <View style={styles.summarySection}>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Total Deuda:</Text>
                            <Text style={styles.summaryValue}>{totalEstimate.toFixed(2)}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Total Abonado:</Text>
                            <Text style={styles.summaryValue}>{totalPaid.toFixed(2)}</Text>
                        </View>
                        <View style={styles.balanceRow}>
                            <Text style={styles.summaryLabel}>Saldo Pendiente:</Text>
                            <Text style={[styles.summaryValue, { fontWeight: 'bold' }]}>{finalBalance.toFixed(2)}</Text>
                        </View>
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        Estado de cuenta de uso interno. Generado por {userName} el {new Date().toLocaleString()}.
                    </Text>
                    <Text style={[styles.footerText, { marginTop: 2 }]}>
                        Este documento no representa un comprobante legal de pago ante entes reguladores.
                    </Text>
                </View>
            </Page>
        </Document>
    );
};


