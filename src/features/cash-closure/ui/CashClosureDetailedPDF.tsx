import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import type { CashClosureDetailedReport, SummaryTableRecord } from '@/entities/cash-closure/model/detailed-types';

// Constants for styles based on the provided image
const COLORS = {
    black: '#000000',
    grayHeader: '#E5E7EB', // Gray for the table title bar
    white: '#FFFFFF',
    text: '#000000',
    lightGray: '#F9FAFB',
    green: '#15803d', // Dark green for income
    red: '#b91c1c',   // Dark red for expense
};

const s = StyleSheet.create({
    page: { 
        paddingVertical: 40, 
        paddingHorizontal: 30, 
        fontFamily: 'Helvetica', 
        fontSize: 7.5, 
        color: COLORS.text,
        backgroundColor: COLORS.white 
    },
    // Header Styles
    headerContainer: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        marginBottom: 5,
        alignItems: 'flex-start'
    },
    logoContainer: {
        width: '30%',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5
    },
    logo: { 
        width: 35, 
        height: 35, 
        objectFit: 'contain' 
    },
    logoText: {
        fontSize: 6,
        fontFamily: 'Helvetica-Bold',
        width: 60
    },
    titleContainer: {
        width: '40%',
        alignItems: 'center',
    },
    mainTitle: {
        fontSize: 14,
        fontFamily: 'Helvetica-Bold',
        marginTop: 10
    },
    reportDateContainer: {
        width: '30%',
        alignItems: 'flex-end',
    },
    reportDate: {
        fontSize: 10,
        fontFamily: 'Helvetica',
    },
    subHeaderInfo: {
        marginTop: 2,
        marginBottom: 10,
    },
    infoText: {
        fontSize: 9,
        marginBottom: 3,
    },
    infoBold: {
        fontFamily: 'Helvetica-Bold',
    },
    headerLine: {
        borderBottomWidth: 1,
        borderBottomColor: COLORS.black,
        borderBottomStyle: 'dotted',
        marginBottom: 15,
        width: '100%'
    },
    // Table Styles
    tableTitleBar: {
        backgroundColor: COLORS.grayHeader,
        borderWidth: 1,
        borderColor: COLORS.black,
        paddingVertical: 3,
        paddingHorizontal: 8,
        marginTop: 15,
        borderRadius: 2,
    },
    tableTitleText: {
        fontSize: 9,
        fontFamily: 'Helvetica-Bold',
        textTransform: 'uppercase',
    },
    tableHeaderRow: {
        flexDirection: 'row',
        borderBottomWidth: 1.5,
        borderBottomColor: COLORS.black,
        paddingVertical: 3,
        marginTop: 2,
    },
    colHeader: {
        fontFamily: 'Helvetica-Bold',
        fontSize: 7,
    },
    row: {
        flexDirection: 'row',
        paddingVertical: 3,
        borderBottomWidth: 0.5,
        borderBottomColor: '#EEE',
    },
    rowText: {
        fontSize: 6.5,
    },
    tableFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 5,
        paddingHorizontal: 10,
    },
    tableCount: {
        fontSize: 10,
        fontFamily: 'Helvetica-Bold',
    },
    tableTotalLine: {
        width: 80,
        borderTopWidth: 1.5,
        borderTopColor: COLORS.black,
        alignItems: 'flex-end',
        paddingTop: 2,
    },
    tableTotalValue: {
        fontSize: 11,
        fontFamily: 'Helvetica-Bold',
    },
    // Final Summary
    finalSummaryContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'flex-end',
        marginTop: 35,
        width: '100%'
    },
    totalToReportBox: {
        borderWidth: 1,
        borderColor: COLORS.black,
        paddingVertical: 6,
        paddingHorizontal: 15,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
        backgroundColor: '#FAFAFA'
    },
    totalToReportLabel: {
        fontSize: 10,
        fontFamily: 'Helvetica-Bold',
    },
    totalToReportValue: {
        fontSize: 11,
        fontFamily: 'Helvetica-Bold',
    },
    signatureContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 80,
        marginTop: 20,
        width: '100%'
    },
    signatureBox: {
        width: 140,
        alignItems: 'center',
    },
    signatureLine: {
        width: '100%',
        borderTopWidth: 0.8,
        borderTopColor: COLORS.black,
        marginBottom: 4,
    },
    signatureName: {
        fontSize: 7,
        fontFamily: 'Helvetica-Bold',
        textTransform: 'uppercase',
    },
    signatureRole: {
        fontSize: 6.5,
        fontStyle: 'italic',
        color: '#444'
    },
    footerContainer: {
        position: 'absolute',
        bottom: 20,
        left: 0,
        right: 0,
        textAlign: 'center',
        fontSize: 6,
        color: '#666'
    }
});

const fmt = (n: number) => (n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtCurrency = (n: number) => (n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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

interface Props { report: CashClosureDetailedReport; }

export function CashClosureDetailedPDF({ report }: Props) {
    const { toDate, closedByName, summaryTables, actualAmount = 0 } = report;

    const wallet = summaryTables?.wallet || [];
    const bancos = summaryTables?.bancos || [];
    const abonos = summaryTables?.abonos || [];
    const entregas = summaryTables?.entregas || [];
    const catalog = summaryTables?.catalog || [];

    // Optimized column widths for 10 columns in Portrait
    const W = {
        n: '3%',
        tipo: '7%',
        ref: '8%',
        cod: '16%', // Max room for long IDs
        desc: '16%',
        hora: '7%',
        id: '9%',
        cli: '17%',
        val: '9%',
        acum: '8%'
    };

    const renderFinancialTable = (data: SummaryTableRecord[], title: string) => (
        <View style={{ marginBottom: 15 }} wrap={false}>
            {/* Title Bar */}
            <View style={s.tableTitleBar}>
                <Text style={s.tableTitleText}>{title}</Text>
            </View>

            {/* Header Row */}
            <View style={[s.tableHeaderRow, { paddingHorizontal: 2 }]}>
                <View style={{ width: W.n }}><Text style={s.colHeader}>N°</Text></View>
                <View style={{ width: W.tipo }}><Text style={s.colHeader}>Tipo</Text></View>
                <View style={{ width: W.ref }}><Text style={s.colHeader}>Ref.</Text></View>
                <View style={{ width: W.cod }}><Text style={s.colHeader}>Código</Text></View>
                <View style={{ width: W.desc }}><Text style={s.colHeader}>Descripción</Text></View>
                <View style={{ width: W.hora }}><Text style={s.colHeader}>Hora</Text></View>
                <View style={{ width: W.id }}><Text style={s.colHeader}>Identificación</Text></View>
                <View style={{ width: W.cli }}><Text style={s.colHeader}>Empresaria/Cliente</Text></View>
                <View style={{ width: W.val }}><Text style={[s.colHeader, { textAlign: 'right' }]}>Valor</Text></View>
                <View style={{ width: W.acum }}><Text style={[s.colHeader, { textAlign: 'right' }]}>Acum.</Text></View>
            </View>

            {/* Data Rows with strict containment */}
            {data.length === 0 ? (
                <View style={{ padding: 10 }}><Text style={{ fontSize: 7, textAlign: 'center', fontStyle: 'italic' }}>Sin movimientos registrados en este periodo</Text></View>
            ) : (
                data.map((row, i) => (
                    <View key={i} style={[s.row, { paddingHorizontal: 2 }]} wrap={false}>
                        <View style={{ width: W.n, overflow: 'hidden' }}><Text style={{ fontSize: 6.2 }}>{i + 1}</Text></View>
                        <View style={{ width: W.tipo, paddingRight: 4, overflow: 'hidden' }}><Text style={{ fontSize: 6.2 }}>{row.label || '---'}</Text></View>
                        <View style={{ width: W.ref, paddingRight: 4, overflow: 'hidden' }}><Text style={{ fontSize: 6.2 }}>{row.reference || '---'}</Text></View>
                        <View style={{ width: W.cod, paddingRight: 4, overflow: 'hidden' }}><Text style={{ fontSize: 6.2 }}>{row.code || '---'}</Text></View>
                        <View style={{ width: W.desc, paddingRight: 4, overflow: 'hidden' }}><Text style={{ fontSize: 6.2 }}>{row.description}</Text></View>
                        <View style={{ width: W.hora, overflow: 'hidden' }}><Text style={{ fontSize: 6.2 }}>{fmtTimeOnly(row.date)}</Text></View>
                        <View style={{ width: W.id, paddingRight: 2, overflow: 'hidden' }}><Text style={{ fontSize: 6.2 }}>{row.identification || '---'}</Text></View>
                        <View style={{ width: W.cli, paddingRight: 4, overflow: 'hidden' }}><Text style={{ fontSize: 6.2 }}>{(row.client || '---').toUpperCase()}</Text></View>
                        <View style={{ width: W.val, overflow: 'hidden' }}>
                            <Text style={{ 
                                fontSize: 6.2,
                                textAlign: 'right', 
                                fontFamily: 'Helvetica-Bold',
                                color: row.type === 'INCOME' ? COLORS.green : (row.type === 'EXPENSE' ? COLORS.red : COLORS.text)
                            }}>
                                {row.type === 'INCOME' ? '▲ ' : (row.type === 'EXPENSE' ? '▼ ' : '')}{fmt(row.amount)}
                            </Text>
                        </View>
                        <View style={{ width: W.acum, overflow: 'hidden' }}><Text style={{ fontSize: 6.2, textAlign: 'right' }}>{fmt(row.balance)}</Text></View>
                    </View>
                ))
            )}

            {/* Table Footer */}
            <View style={s.tableFooter}>
                <Text style={s.tableCount}>{data.length}</Text>
                <View style={s.tableTotalLine}>
                    <Text style={s.tableTotalValue}>{data.length > 0 ? fmtCurrency(data[data.length - 1].balance) : '0.00'}</Text>
                </View>
            </View>
        </View>
    );

    // Filter accounts for summary
    const cashAccounts = report.totalDetails?.accounts.filter(a => a.type === 'CASH') || [];
    const bankAccounts = report.totalDetails?.accounts.filter(a => a.type !== 'CASH') || [];
    
    const totalCash = cashAccounts.reduce((s, a) => s + (a.balance || 0), 0);
    const totalBanks = bankAccounts.reduce((s, a) => s + (a.balance || 0), 0);

    return (
        <Document title={`Cierre de Caja - ${fmtDateOnly(new Date())}`}>
            <Page size="A4" style={s.page}>
                {/* Custom Header based on image */}
                <View style={s.headerContainer}>
                    <View style={s.logoContainer}>
                        <Image src="/images/mochitopng.png" style={s.logo} />
                        <Text style={s.logoText}>VENTA POR CATÁLOGO</Text>
                    </View>
                    <View style={s.titleContainer}>
                        <Text style={s.mainTitle}>CIERRE DE CAJA</Text>
                    </View>
                    <View style={s.reportDateContainer}>
                        <Text style={s.reportDate}>{fmtDateOnly(new Date())}</Text>
                    </View>
                </View>

                {/* Sub-header info */}
                <View style={s.subHeaderInfo}>
                    <Text style={s.infoText}>
                        Fecha de cierre: <Text style={s.infoBold}>{fmtDateOnly(toDate)}</Text>
                    </Text>
                    <Text style={s.infoText}>
                        Responsable: <Text style={s.infoBold}>{(closedByName || 'ADMINISTRADOR').toUpperCase()}</Text>
                    </Text>
                </View>

                {/* Separator Line */}
                <View style={s.headerLine} />

                {/* Tables rendering in portrait */}
                {renderFinancialTable(wallet, 'Wallet Informativa')}
                {renderFinancialTable(bancos, 'Bancos / Movimientos Globales')}
                {renderFinancialTable(catalog, 'Ventas - Catálogo')}
                {renderFinancialTable(abonos, 'Abonos')}
                {renderFinancialTable(entregas, 'Entregas')}

                {/* Accounts Summary Section */}
                <View style={{ marginTop: 20 }} wrap={false}>
                    <View style={[s.tableTitleBar, { backgroundColor: '#F3F4F6' }]}>
                        <Text style={s.tableTitleText}>RESUMEN DE SALDOS POR CUENTAS</Text>
                    </View>
                    
                    <View style={{ flexDirection: 'row', gap: 20, marginTop: 10 }}>
                        {/* CASH Column */}
                        <View style={{ flex: 1 }}>
                            <Text style={[s.infoBold, { fontSize: 9, borderBottomWidth: 1, paddingBottom: 2, marginBottom: 5 }]}>EFECTIVO</Text>
                            {cashAccounts.map((acc, i) => (
                                <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 }}>
                                    <Text style={{ fontSize: 8 }}>{acc.name}</Text>
                                    <Text style={{ fontSize: 8 }}>{fmtCurrency(acc.balance)}</Text>
                                </View>
                            ))}
                            <View style={{ borderTopWidth: 1, marginTop: 5, paddingTop: 3, flexDirection: 'row', justifyContent: 'space-between' }}>
                                <Text style={s.infoBold}>Total Efectivo:</Text>
                                <Text style={s.infoBold}>{fmtCurrency(totalCash)}</Text>
                            </View>
                        </View>

                        {/* BANK Column */}
                        <View style={{ flex: 1 }}>
                            <Text style={[s.infoBold, { fontSize: 9, borderBottomWidth: 1, paddingBottom: 2, marginBottom: 5 }]}>BANCOS</Text>
                            {bankAccounts.map((acc, i) => (
                                <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 }}>
                                    <Text style={{ fontSize: 8 }}>{acc.name}</Text>
                                    <Text style={{ fontSize: 8 }}>{fmtCurrency(acc.balance)}</Text>
                                </View>
                            ))}
                            <View style={{ borderTopWidth: 1, marginTop: 5, paddingTop: 3, flexDirection: 'row', justifyContent: 'space-between' }}>
                                <Text style={s.infoBold}>Total Bancos:</Text>
                                <Text style={s.infoBold}>{fmtCurrency(totalBanks)}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Botón de Conciliación Final */}
                <View style={{ marginTop: 30, border: '1pt solid #000', padding: 10, backgroundColor: '#FAFAFA' }} wrap={false}>
                    <Text style={[s.infoBold, { fontSize: 10, marginBottom: 8, textDecoration: 'underline' }]}>CONCILIACIÓN DEL CIERRE</Text>
                    
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text style={{ fontSize: 9 }}>Saldo Esperado en Sistema (Efectivo + Bancos):</Text>
                        <Text style={[s.infoBold, { fontSize: 9 }]}>{fmtCurrency(totalCash + totalBanks)}</Text>
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text style={{ fontSize: 9 }}>Total Reportado por Usuario (Contado + Bancos):</Text>
                        <View style={{ flexDirection: 'row', gap: 2 }}>
                            <Text style={[s.infoBold, { fontSize: 9 }]}>{fmtCurrency((actualAmount || 0) + totalBanks)}</Text>
                            <Text style={{ fontSize: 8, color: '#666' }}>({fmtCurrency(actualAmount)} contado + {fmtCurrency(totalBanks)} bancos)</Text>
                        </View>
                    </View>

                    <View style={{ borderTopWidth: 0.5, borderTopColor: '#CCC', marginVertical: 5 }} />

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold' }}>Diferencia Total:</Text>
                        <Text style={{ 
                            fontSize: 10, 
                            fontFamily: 'Helvetica-Bold',
                            color: Math.abs(((actualAmount || 0) + totalBanks) - (totalCash + totalBanks)) > 0.01 ? COLORS.red : COLORS.green 
                        }}>
                            {fmtCurrency(((actualAmount || 0) + totalBanks) - (totalCash + totalBanks))}
                        </Text>
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text style={{ fontSize: 9 }}>Resultado de Auditoría:</Text>
                        <Text style={{ 
                            fontSize: 9, 
                            fontFamily: 'Helvetica-Bold',
                            color: Math.abs(((actualAmount || 0) + totalBanks) - (totalCash + totalBanks)) > 0.01 ? COLORS.red : COLORS.green 
                        }}>
                            {Math.abs(((actualAmount || 0) + totalBanks) - (totalCash + totalBanks)) > 0.01 ? 'DESCUADRE DETECTADO' : 'CORRECTAMENTE CUADRADO'}
                        </Text>
                    </View>

                    {report.notes && (
                        <View style={{ marginTop: 8, borderTopWidth: 0.5, borderTopColor: '#EEE', paddingTop: 5 }}>
                            <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', marginBottom: 2 }}>Observaciones:</Text>
                            <Text style={{ fontSize: 8, fontStyle: 'italic', color: '#444' }}>{report.notes}</Text>
                        </View>
                    )}
                </View>

                {/* Final Signature Section */}
                <View style={[s.finalSummaryContainer, { marginTop: 40 }]} wrap={false}>
                    {/* Signatures */}
                    <View style={s.signatureContainer}>
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
                </View>

                <Text style={s.footerContainer} render={({ pageNumber, totalPages }) => `Documento oficial de auditoría - Página ${pageNumber} de ${totalPages}`} fixed />
            </Page>
        </Document>
    );
}
