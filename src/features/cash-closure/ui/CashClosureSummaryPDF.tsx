import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { formatPdfCurrency } from '@/shared/lib/formatPdfCurrency';
import type { CashClosureDetailedReport } from '@/entities/cash-closure/model/detailed-types';

const COLORS = {
    black: '#000000',
    white: '#FFFFFF',
    text: '#000000',
    green: '#15803d',
    red: '#b91c1c',
    lightGray: '#F5F5F5',
    mediumGray: '#E5E7EB',
};

const s = StyleSheet.create({
    page: {
        paddingVertical: 40,
        paddingHorizontal: 40,
        fontFamily: 'Helvetica',
        fontSize: 9,
        color: COLORS.text,
        backgroundColor: COLORS.white,
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    logo: {
        width: 180,
        height: 60,
        objectFit: 'contain',
    },
    mainTitle: {
        fontSize: 18,
        fontFamily: 'Helvetica-Bold',
        letterSpacing: 1,
    },
    subtitle: {
        fontSize: 10,
        fontFamily: 'Helvetica',
        color: '#666',
        marginTop: 2,
    },
    infoBold: {
        fontSize: 10,
        fontFamily: 'Helvetica-Bold',
        marginBottom: 4,
    },
    infoText: {
        fontSize: 9,
        fontFamily: 'Helvetica',
        marginBottom: 2,
    },
    sectionTitle: {
        fontSize: 11,
        fontFamily: 'Helvetica-Bold',
        textTransform: 'uppercase',
        marginBottom: 8,
        borderBottomWidth: 1.5,
        borderBottomColor: COLORS.black,
        paddingBottom: 4,
    },
    card: {
        borderWidth: 1,
        borderColor: COLORS.mediumGray,
        borderRadius: 3,
        padding: 10,
        marginBottom: 12,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 4,
        borderBottomWidth: 0.5,
        borderBottomColor: '#EEE',
    },
    rowLabel: {
        fontSize: 9,
        color: '#444',
    },
    rowValue: {
        fontSize: 9,
        fontFamily: 'Helvetica-Bold',
    },
    bigValue: {
        fontSize: 14,
        fontFamily: 'Helvetica-Bold',
    },
    divider: {
        borderBottomWidth: 1,
        borderBottomColor: COLORS.mediumGray,
        marginVertical: 12,
    },
    signatureContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 80,
        marginTop: 40,
    },
    signatureBox: {
        width: 160,
        alignItems: 'center',
    },
    signatureLine: {
        width: '100%',
        borderTopWidth: 1,
        borderTopColor: COLORS.black,
        marginBottom: 4,
    },
    signatureName: {
        fontSize: 9,
        fontFamily: 'Helvetica-Bold',
        textTransform: 'uppercase',
    },
    signatureRole: {
        fontSize: 8,
        fontStyle: 'italic',
        color: '#444',
    },
    footer: {
        position: 'absolute',
        bottom: 20,
        left: 0,
        right: 0,
        textAlign: 'center',
        fontSize: 7,
        color: '#666',
    },
});

const fmtDateOnly = (d: string | Date | undefined) => {
    if (!d) return "---";
    const dateObj = typeof d === 'string' ? new Date(d) : d;
    if (isNaN(dateObj.getTime())) return "---";
    return dateObj.toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const fmtTimeOnly = (d: string | Date | undefined) => {
    if (!d) return "---";
    const dateObj = typeof d === 'string' ? new Date(d) : d;
    if (isNaN(dateObj.getTime())) return "---";
    return dateObj.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
};

const fmtFullDateTime = (d: string | Date | undefined) => {
    if (!d) return "---";
    return `${fmtDateOnly(d)} ${fmtTimeOnly(d)}`;
};

interface Props {
    report: CashClosureDetailedReport;
}

export function CashClosureSummaryPDF({ report }: Props) {
    const {
        fromDate,
        toDate,
        closedByName,
        boxUserName,
        generatedBy,
        summaryTables,
        actualAmount = 0,
    } = report;

    const wallet = summaryTables?.wallet || [];
    const bancos = summaryTables?.bancos || [];
    const abonos = summaryTables?.abonos || [];
    const entregas = summaryTables?.entregas || [];
    const catalog = summaryTables?.catalog || [];

    // Calculate section totals from full data
    const walletTotal = wallet.length > 0 ? wallet[wallet.length - 1].balance : 0;
    const bancosTotal = bancos.length > 0 ? bancos[bancos.length - 1].balance : 0;
    const abonosTotal = abonos.length > 0 ? abonos[abonos.length - 1].balance : 0;
    const entregasTotal = entregas.length > 0 ? entregas[entregas.length - 1].balance : 0;
    const catalogTotal = catalog.length > 0 ? catalog[catalog.length - 1].balance : 0;

    // Account summaries
    const cashAccounts = report.totalDetails?.accounts.filter(a => a.type === 'CASH') || [];
    const bankAccounts = report.totalDetails?.accounts.filter(a => a.type !== 'CASH') || [];
    const totalCash = cashAccounts.reduce((s, a) => s + (a.balance || 0), 0);
    const totalBanks = bankAccounts.reduce((s, a) => s + (a.balance || 0), 0);

    return (
        <Document title={`Resumen Cierre de Caja - ${fmtDateOnly(new Date())}`}>
            <Page size="A4" style={s.page}>
                {/* Header */}
                <View style={s.headerContainer}>
                    <Image src="/images/BannerHeader.jpg" style={s.logo} />
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={s.mainTitle}>RESUMEN EJECUTIVO</Text>
                        <Text style={s.subtitle}>Cierre de Caja</Text>
                    </View>
                </View>

                {/* Report Info */}
                <View style={{ marginBottom: 20 }}>
                    <Text style={s.infoBold}>
                        RANGO: {fmtFullDateTime(fromDate)}  AL  {fmtFullDateTime(toDate)}
                    </Text>
                    <Text style={s.infoBold}>
                        CAJA DE: {(boxUserName || closedByName || 'ADMINISTRADOR').toUpperCase()}
                    </Text>
                    {generatedBy && (
                        <Text style={[s.infoText, { color: '#666' }]}>
                            Generado por: {generatedBy.toUpperCase()}
                        </Text>
                    )}
                </View>

                {/* ── Section 1: Resumen por Secciones ── */}
                <Text style={s.sectionTitle}>Resumen por Secciones</Text>
                <View style={s.card}>
                    <View style={s.row}>
                        <Text style={s.rowLabel}>Wallet Informativa</Text>
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            <Text style={[s.rowValue, { color: '#666', fontSize: 8 }]}>{wallet.length} mov.</Text>
                            <Text style={s.rowValue}>{formatPdfCurrency(walletTotal)}</Text>
                        </View>
                    </View>
                    <View style={s.row}>
                        <Text style={s.rowLabel}>Bancos / Movimientos Globales</Text>
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            <Text style={[s.rowValue, { color: '#666', fontSize: 8 }]}>{bancos.length} mov.</Text>
                            <Text style={s.rowValue}>{formatPdfCurrency(bancosTotal)}</Text>
                        </View>
                    </View>
                    <View style={s.row}>
                        <Text style={s.rowLabel}>Ventas - Catálogo</Text>
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            <Text style={[s.rowValue, { color: '#666', fontSize: 8 }]}>{catalog.length} mov.</Text>
                            <Text style={s.rowValue}>{formatPdfCurrency(catalogTotal)}</Text>
                        </View>
                    </View>
                    <View style={s.row}>
                        <Text style={s.rowLabel}>Abonos</Text>
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            <Text style={[s.rowValue, { color: '#666', fontSize: 8 }]}>{abonos.length} mov.</Text>
                            <Text style={s.rowValue}>{formatPdfCurrency(abonosTotal)}</Text>
                        </View>
                    </View>
                    <View style={[s.row, { borderBottomWidth: 0 }]}>
                        <Text style={s.rowLabel}>Entregas</Text>
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            <Text style={[s.rowValue, { color: '#666', fontSize: 8 }]}>{entregas.length} mov.</Text>
                            <Text style={s.rowValue}>{formatPdfCurrency(entregasTotal)}</Text>
                        </View>
                    </View>
                </View>

                {/* ── Section 2: Saldos por Cuentas ── */}
                <Text style={s.sectionTitle}>Saldos por Cuentas</Text>
                <View style={{ flexDirection: 'row', gap: 15, marginBottom: 15 }}>
                    {/* Cash Column */}
                    <View style={[s.card, { flex: 1 }]}>
                        <Text style={[s.infoBold, { fontSize: 10, marginBottom: 8, textDecoration: 'underline' }]}>EFECTIVO</Text>
                        {cashAccounts.map((acc, i) => (
                            <View key={i} style={s.row}>
                                <Text style={s.rowLabel}>{acc.name}</Text>
                                <Text style={s.rowValue}>{formatPdfCurrency(acc.balance)}</Text>
                            </View>
                        ))}
                        <View style={[s.row, { borderBottomWidth: 0, borderTopWidth: 1, borderTopColor: COLORS.black, marginTop: 6, paddingTop: 6 }]}>
                            <Text style={[s.infoBold, { fontSize: 10 }]}>Total Efectivo:</Text>
                            <Text style={[s.bigValue, { color: COLORS.green }]}>{formatPdfCurrency(totalCash)}</Text>
                        </View>
                    </View>

                    {/* Bank Column */}
                    <View style={[s.card, { flex: 1 }]}>
                        <Text style={[s.infoBold, { fontSize: 10, marginBottom: 8, textDecoration: 'underline' }]}>BANCOS</Text>
                        {bankAccounts.map((acc, i) => (
                            <View key={i} style={s.row}>
                                <Text style={s.rowLabel}>{acc.name}</Text>
                                <Text style={s.rowValue}>{formatPdfCurrency(acc.balance)}</Text>
                            </View>
                        ))}
                        <View style={[s.row, { borderBottomWidth: 0, borderTopWidth: 1, borderTopColor: COLORS.black, marginTop: 6, paddingTop: 6 }]}>
                            <Text style={[s.infoBold, { fontSize: 10 }]}>Total Bancos:</Text>
                            <Text style={[s.bigValue, { color: '#1d4ed8' }]}>{formatPdfCurrency(totalBanks)}</Text>
                        </View>
                    </View>
                </View>

                {/* ── Section 3: Conciliación ── */}
                <Text style={s.sectionTitle}>Conciliación del Cierre</Text>
                <View style={[s.card, { backgroundColor: '#FAFAFA' }]}>
                    <View style={s.row}>
                        <Text style={{ fontSize: 10 }}>Saldo Esperado en Sistema (Efectivo + Bancos):</Text>
                        <Text style={[s.infoBold, { fontSize: 11 }]}>{formatPdfCurrency(totalCash + totalBanks)}</Text>
                    </View>

                    <View style={s.row}>
                        <Text style={{ fontSize: 10 }}>Total Reportado por Usuario (Contado + Bancos):</Text>
                        <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
                            <Text style={[s.infoBold, { fontSize: 11 }]}>{formatPdfCurrency((actualAmount || 0) + totalBanks)}</Text>
                            <Text style={{ fontSize: 8, color: '#666' }}>
                                ({formatPdfCurrency(actualAmount)} contado + {formatPdfCurrency(totalBanks)} bancos)
                            </Text>
                        </View>
                    </View>

                    <View style={s.divider} />

                    <View style={[s.row, { borderBottomWidth: 0 }]}>
                        <Text style={{ fontSize: 12, fontFamily: 'Helvetica-Bold' }}>Diferencia Total:</Text>
                        <Text style={{
                            fontSize: 14,
                            fontFamily: 'Helvetica-Bold',
                            color: Math.abs(((actualAmount || 0) + totalBanks) - (totalCash + totalBanks)) > 0.01 ? COLORS.red : COLORS.green,
                        }}>
                            {formatPdfCurrency(((actualAmount || 0) + totalBanks) - (totalCash + totalBanks))}
                        </Text>
                    </View>

                    <View style={[s.row, { borderBottomWidth: 0 }]}>
                        <Text style={{ fontSize: 10 }}>Resultado de Auditoría:</Text>
                        <Text style={{
                            fontSize: 10,
                            fontFamily: 'Helvetica-Bold',
                            color: Math.abs(((actualAmount || 0) + totalBanks) - (totalCash + totalBanks)) > 0.01 ? COLORS.red : COLORS.green,
                        }}>
                            {Math.abs(((actualAmount || 0) + totalBanks) - (totalCash + totalBanks)) > 0.01 ? 'DESCUADRE DETECTADO' : 'CORRECTAMENTE CUADRADO'}
                        </Text>
                    </View>

                    {report.notes && (
                        <View style={{ marginTop: 8, borderTopWidth: 0.5, borderTopColor: '#DDD', paddingTop: 6 }}>
                            <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', marginBottom: 2 }}>Observaciones:</Text>
                            <Text style={{ fontSize: 8, fontStyle: 'italic', color: '#444' }}>{report.notes}</Text>
                        </View>
                    )}
                </View>

                {/* ── Signatures ── */}
                <View style={s.signatureContainer} wrap={false}>
                    <View style={s.signatureBox}>
                        <View style={s.signatureLine} />
                        <Text style={s.signatureName}>{(closedByName || 'Responsable').toUpperCase()}</Text>
                        <Text style={s.signatureRole}>Responsable de Caja</Text>
                    </View>
                    <View style={s.signatureBox}>
                        <View style={s.signatureLine} />
                        <Text style={s.signatureName}>_________________</Text>
                        <Text style={s.signatureRole}>Auditoría / Gerencia</Text>
                    </View>
                </View>

                <Text style={s.footer} render={({ pageNumber, totalPages }) =>
                    `Resumen ejecutivo de auditoría - Página ${pageNumber} de ${totalPages}`
                } fixed />
            </Page>
        </Document>
    );
}
