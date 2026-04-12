import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import type { Order } from '@/entities/order/model/types';
import type { User } from '@/entities/user/model/types';
import type { Client } from '@/entities/client/model/types';

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
        alignItems: 'flex-start',
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
    /** N° de guía que escribe el usuario (destacado) */
    headerMainGuide: {
        fontSize: 22,
        fontWeight: 'bold',
        marginTop: 6,
        textAlign: 'right',
    },
    /** Secuencial interno Guia-AAAA-NNN (pequeño) */
    guideSeqSmall: {
        fontSize: 9,
        fontWeight: 'bold',
        marginTop: 4,
        color: '#555',
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
    colBrand: { width: '22%' },
    colManual: { width: '14%' },
    colQty: { width: '8%' },
    colDescV: { width: '28%' },
    colDescC: { width: '23%' },
    colQtyR: { width: '5%', borderRightWidth: 0 },
    summaryLine: {
        flexDirection: 'row',
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
    },
});

interface ExchangeShipmentProps {
    orders: Order[];
    user?: User;
    client?: Client;
    /** N° guía transporte / paquetería (texto que ingresa el usuario) */
    trackingGuide: string;
    /** Secuencial interno PDF: Guia-AAAA-NNN */
    guideSequential?: string;
    formattedDate: string;
    notes?: string;
}

export const ExchangeShipmentDocument: React.FC<ExchangeShipmentProps> = ({
    orders,
    user,
    client,
    trackingGuide,
    guideSequential,
    formattedDate,
    notes,
}) => {
    const logoUrl = '/images/BannerHeader.jpg';
    const displayGuide = trackingGuide?.trim() || '—';

    return (
        <Document>
            <Page size="A4" orientation="landscape" style={styles.page}>
                <View style={styles.headerRow}>
                    <Image style={styles.logo} src={logoUrl} />
                    <View style={styles.headerRight}>
                        <Text style={styles.headerTitle}>GUÍA DE ENVÍO</Text>
                        {guideSequential ? <Text style={styles.guideSeqSmall}>{guideSequential}</Text> : null}
                        <Text style={styles.headerMainGuide}>N° de guía: {displayGuide}</Text>
                    </View>
                </View>

                <View style={styles.clientInfoSection}>
                    <View style={styles.clientInfoRow}>
                        <Text style={styles.infoLabel}>Cedula:</Text>
                        <Text style={styles.infoValue}>{client?.identificationNumber || '—'}</Text>
                    </View>
                    <View style={styles.clientInfoRow}>
                        <Text style={styles.infoLabel}>Cátalogo:</Text>
                        <Text style={styles.infoValue}>{(orders[0]?.brandName || '').toUpperCase()}</Text>
                    </View>
                    <View style={styles.clientInfoRow}>
                        <Text style={styles.infoLabel}>Fecha de Envío:</Text>
                        <Text style={styles.infoValue}>{formattedDate}</Text>
                    </View>
                </View>

                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.tableHeaderCell, styles.colBrand]}>Empresaria</Text>
                        <Text style={[styles.tableHeaderCell, styles.colManual]}>N° de cambio</Text>
                        <Text style={[styles.tableHeaderCell, styles.colQty]}>cant</Text>
                        <Text style={[styles.tableHeaderCell, styles.colDescV]}>descripcion (se va)</Text>
                        <Text style={[styles.tableHeaderCell, styles.colDescC]}>descripcion (viene)</Text>
                        <Text style={[styles.tableHeaderCell, styles.colQtyR]}>cant</Text>
                    </View>

                    {orders.map((o, idx) => (
                        <View key={idx} style={styles.tableRow}>
                            <Text style={[styles.tableCell, styles.colBrand]}>
                                {(o.clientName || client?.firstName || '').toUpperCase()}
                            </Text>
                            <Text style={[styles.tableCell, styles.colManual]}>{o.sourceOrderNumber || '—'}</Text>
                            <Text style={[styles.tableCell, styles.colQty]}>{o.sourceQuantity || 1}</Text>
                            <Text style={[styles.tableCell, styles.colDescV]}>{o.sourceDescription || 'N/A'}</Text>
                            <Text style={[styles.tableCell, styles.colDescC]}>{o.description || 'N/A'}</Text>
                            <Text style={[styles.tableCell, styles.colQtyR]}>{o.items?.[0]?.quantity || 1}</Text>
                        </View>
                    ))}
                </View>

                <View style={styles.summaryLine}>
                    <Text style={{ fontWeight: 'bold' }}>TOTAL ITEMS EN GUÍA: {orders.length}</Text>
                </View>

                {notes ? (
                    <View style={{ marginTop: 15, paddingHorizontal: 10 }}>
                        <Text style={{ fontSize: 10, fontWeight: 'bold', marginBottom: 2 }}>
                            Notas adicionales del envío:
                        </Text>
                        <Text style={{ fontSize: 9, color: '#333' }}>{notes}</Text>
                    </View>
                ) : null}

                <View style={styles.signatureSection}>
                    <View style={styles.signatureBlock}>
                        <View style={styles.signatureLine} />
                        <Text style={styles.signatureText}>Enviado Por</Text>
                        <Text style={[styles.signatureText, { fontWeight: 'bold' }]}>{user?.username || 'admin'}</Text>
                    </View>
                </View>
            </Page>
        </Document>
    );
};
