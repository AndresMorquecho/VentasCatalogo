import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { formatPdfCurrency } from '@/shared/lib/formatPdfCurrency';
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
        alignItems: 'center',
        marginBottom: 15
    },
    logo: { 
        width: 180, 
        height: 60,
        objectFit: 'contain' 
    },
    mainTitle: {
        fontSize: 16,
        fontFamily: 'Helvetica-Bold',
        letterSpacing: 1
    },
    subHeaderInfo: {
        marginBottom: 25,
    },
    infoBold: {
        fontSize: 10,
        fontFamily: 'Helvetica-Bold',
        marginBottom: 5
    },
    // Table Styles
    sectionTitle: {
        fontSize: 10,
        fontFamily: 'Helvetica-Bold',
        textTransform: 'uppercase',
        marginBottom: 8
    },
    tableContainer: {
        borderTopWidth: 1,
        borderLeftWidth: 1,
        borderColor: COLORS.black,
    },
    tableHeaderRow: {
        flexDirection: 'row',
        backgroundColor: COLORS.white,
    },
    colHeaderView: {
        borderRightWidth: 0.5,
        borderBottomWidth: 0.5,
        borderColor: COLORS.black,
        paddingVertical: 5,
        paddingHorizontal: 2,
        backgroundColor: '#F0F0F0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    colHeader: {
        fontFamily: 'Helvetica-Bold',
        fontSize: 6,
        textAlign: 'center',
        textTransform: 'uppercase'
    },
    row: {
        flexDirection: 'row',
        alignItems: 'stretch',
    },
    cellView: {
        borderRightWidth: 0.5,
        borderBottomWidth: 0.5,
        borderColor: COLORS.black,
        paddingVertical: 3,
        paddingHorizontal: 2,
    },
    cellText: {
        fontSize: 6,
        lineHeight: 1.1,
    },
    tableFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
        marginBottom: 10,
    },
    tableFooterText: {
        fontSize: 9,
        fontFamily: 'Helvetica',
    },
    sectionDivider: {
        width: '100%',
        borderBottomWidth: 1,
        borderColor: COLORS.black,
        marginBottom: 20
    },
    // Final Summary
    finalSummaryContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'flex-end',
        marginTop: 35,
        width: '100%'
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
        borderTopWidth: 1,
        borderTopColor: COLORS.black,
        marginBottom: 4,
    },
    signatureName: {
        fontSize: 8,
        fontFamily: 'Helvetica-Bold',
        textTransform: 'uppercase',
    },
    signatureRole: {
        fontSize: 7,
        fontStyle: 'italic',
        color: '#444'
    },
    footerContainer: {
        position: 'absolute',
        bottom: 20,
        left: 0,
        right: 0,
        textAlign: 'center',
        fontSize: 7,
        color: '#666'
    }
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
    /** Max rows per table section. Defaults to no limit (all rows). */
    maxRowsPerTable?: number;
}

export function CashClosureDetailedPDF({ report, maxRowsPerTable }: Props) {
    const { fromDate, toDate, closedByName, boxUserName, generatedBy, summaryTables, actualAmount = 0 } = report;

    const wallet = summaryTables?.wallet || [];
    const bancos = summaryTables?.bancos || [];
    const abonos = summaryTables?.abonos || [];
    const entregas = summaryTables?.entregas || [];
    const catalog = summaryTables?.catalog || [];

    // ── Performance: Limit rows per table to prevent PDF renderer from freezing ──
    // When maxRowsPerTable is not set, we render ALL rows (full report).
    // When set (e.g. 150), we truncate each table but keep accurate totals from ALL data.
    const MAX_PDF_ROWS = maxRowsPerTable ?? Infinity;

    // Optimized column widths matching the new requested layout
    const W = {
        n: '3%',
        tipo: '12%',
        trans: '8%',
        ctrl: '8%',
        obs: '14%',
        fecha: '11%',
        recibo: '14%',
        emp: '22%',
        val: '8%'
    };

    const renderFinancialTable = (data: SummaryTableRecord[], title: string) => {
        // Calculate totals from ALL data (before truncating)
        const totalBalance = data.length > 0 ? data[data.length - 1].balance : 0;
        const totalRows = data.length;
        const isTruncated = totalRows > MAX_PDF_ROWS;
        // Show the most recent rows (end of the array = most recent chronologically)
        const displayData = isTruncated ? data.slice(totalRows - MAX_PDF_ROWS) : data;
        const omittedCount = totalRows - displayData.length;

        return (
            <View style={{ marginBottom: 15 }}>
                {/* Title */}
                <Text style={s.sectionTitle}>{title}</Text>

                {/* Truncation notice */}
                {isTruncated && (
                    <View style={{ backgroundColor: '#FEF3C7', borderWidth: 0.5, borderColor: '#F59E0B', padding: 4, marginBottom: 4, borderRadius: 2 }}>
                        <Text style={{ fontSize: 6, color: '#92400E', fontFamily: 'Helvetica-Bold' }}>
                            Mostrando los últimos {MAX_PDF_ROWS} de {totalRows} movimientos. {omittedCount} registros anteriores omitidos en impresión. Totales calculados sobre TODOS los {totalRows} registros.
                        </Text>
                    </View>
                )}

                {/* Table */}
                <View style={s.tableContainer}>
                    {/* Header Row */}
                    <View style={s.tableHeaderRow}>
                        <View style={[s.colHeaderView, { width: W.n, borderLeftWidth: 0.5 }]}><Text style={s.colHeader}>N°</Text></View>
                        <View style={[s.colHeaderView, { width: W.tipo }]}><Text style={s.colHeader}>Tipo</Text></View>
                        <View style={[s.colHeaderView, { width: W.trans }]}><Text style={s.colHeader}>Transac. / Doc</Text></View>
                        <View style={[s.colHeaderView, { width: W.ctrl }]}><Text style={s.colHeader}>Control / Valid.</Text></View>
                        <View style={[s.colHeaderView, { width: W.obs }]}><Text style={s.colHeader}>Observaciones</Text></View>
                        <View style={[s.colHeaderView, { width: W.fecha }]}><Text style={s.colHeader}>Fecha y Hora</Text></View>
                        <View style={[s.colHeaderView, { width: W.recibo }]}><Text style={s.colHeader}>N° Recibo / Pedido</Text></View>
                        <View style={[s.colHeaderView, { width: W.emp }]}><Text style={s.colHeader}>Empresaria</Text></View>
                        <View style={[s.colHeaderView, { width: W.val }]}><Text style={s.colHeader}>Valor</Text></View>
                    </View>

                    {/* Data Rows */}
                    {data.length === 0 ? (
                        <View style={[s.row, s.cellView, { width: '100%', borderRightWidth: 0 }]}><Text style={s.cellText}>Sin movimientos</Text></View>
                    ) : (
                        displayData.map((row, i) => {
                            // Use original index for numbering when truncated
                            const rowNumber = isTruncated ? omittedCount + i + 1 : i + 1;
                            return (
                            <View key={i} style={s.row}>
                                <View style={[s.cellView, { width: W.n, borderLeftWidth: 0.5, alignItems: 'center' }]}><Text style={[s.cellText, { textAlign: 'center' }]}>{rowNumber}</Text></View>
                                <View style={[s.cellView, { width: W.tipo }]}><Text style={s.cellText}>{row.label || '-'}</Text></View>
                                <View style={[s.cellView, { width: W.trans, alignItems: 'center' }]}><Text style={[s.cellText, { textAlign: 'center' }]}>{row.reference || '-'}</Text></View>
                                <View style={[s.cellView, { width: W.ctrl, alignItems: 'center' }]}><Text style={[s.cellText, { textAlign: 'center' }]}>{row.identification || '-'}</Text></View>
                                <View style={[s.cellView, { width: W.obs }]}><Text style={s.cellText}>{row.description || '-'}</Text></View>
                                <View style={[s.cellView, { width: W.fecha, alignItems: 'center' }]}>
                                    <Text style={[s.cellText, { textAlign: 'center' }]}>{fmtDateOnly(row.date)} {fmtTimeOnly(row.date)}</Text>
                                </View>
                                <View style={[s.cellView, { width: W.recibo }]}><Text style={s.cellText}>{row.code || '-'}</Text></View>
                                <View style={[s.cellView, { width: W.emp }]}><Text style={s.cellText}>{(row.client || '-').toUpperCase()}</Text></View>
                                <View style={[s.cellView, { width: W.val, alignItems: 'flex-end' }]}>
                                    <Text style={[s.cellText, { textAlign: 'right' }]}>{formatPdfCurrency(row.amount)}</Text>
                                </View>
                            </View>
                            );
                        })
                    )}
                </View>

                {/* Table Footer - ALWAYS uses full data totals */}
                <View style={s.tableFooter}>
                    <Text style={s.tableFooterText}>N° de Movimientos: {totalRows}</Text>
                    <Text style={s.tableFooterText}>Total Acum: {formatPdfCurrency(totalBalance)}</Text>
                </View>

                {/* Section Divider */}
                <View style={s.sectionDivider} />
            </View>
        );
    };

    // Filter accounts for summary
    const cashAccounts = report.totalDetails?.accounts.filter(a => a.type === 'CASH') || [];
    const bankAccounts = report.totalDetails?.accounts.filter(a => a.type !== 'CASH') || [];
    
    const totalCash = cashAccounts.reduce((s, a) => s + (a.balance || 0), 0);
    const totalBanks = bankAccounts.reduce((s, a) => s + (a.balance || 0), 0);

    return (
        <Document title={`Cierre de Caja - ${fmtDateOnly(new Date())}`}>
            <Page size="A4" orientation="landscape" style={s.page}>
                {/* Custom Header based on image */}
                <View style={s.headerContainer}>
                    <Image src="/images/BannerHeader.jpg" style={s.logo} />
                    <Text style={s.mainTitle}>CIERRE DE CAJA</Text>
                </View>

                {/* Sub-header info */}
                <View style={s.subHeaderInfo}>
                    <Text style={s.infoBold}>
                        RANGO DE REPORTE: {fmtFullDateTime(fromDate)}  AL  {fmtFullDateTime(toDate)}
                    </Text>
                    <Text style={s.infoBold}>
                        CAJA DE: {(boxUserName || closedByName || 'ADMINISTRADOR').toUpperCase()}
                    </Text>
                    {generatedBy && (
                        <Text style={[s.infoBold, { color: '#666', fontSize: 8 }]}>
                            Generado o descargado por: {generatedBy.toUpperCase()}
                        </Text>
                    )}
                </View>

                {/* Tables rendering in portrait */}
                {renderFinancialTable(wallet, 'Wallet Informativa')}
                {renderFinancialTable(bancos, 'Bancos / Movimientos Globales')}
                {renderFinancialTable(catalog, 'Ventas - Catálogo')}
                {renderFinancialTable(abonos, 'Abonos')}
                {renderFinancialTable(entregas, 'Entregas')}

                {/* Accounts Summary Section */}
                <View style={{ marginTop: 20 }} wrap={false}>
                    <View style={{ borderBottomWidth: 1, borderColor: COLORS.black, paddingBottom: 5, marginBottom: 10 }}>
                        <Text style={s.sectionTitle}>RESUMEN DE SALDOS POR CUENTAS</Text>
                    </View>
                    
                    <View style={{ flexDirection: 'row', gap: 20, marginTop: 10 }}>
                        {/* CASH Column */}
                        <View style={{ flex: 1 }}>
                            <Text style={[s.infoBold, { fontSize: 9, borderBottomWidth: 1, paddingBottom: 2, marginBottom: 5 }]}>EFECTIVO</Text>
                            {cashAccounts.map((acc, i) => (
                                <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 }}>
                                    <Text style={{ fontSize: 8 }}>{acc.name}</Text>
                                    <Text style={{ fontSize: 8 }}>{formatPdfCurrency(acc.balance)}</Text>
                                </View>
                            ))}
                            <View style={{ borderTopWidth: 1, marginTop: 5, paddingTop: 3, flexDirection: 'row', justifyContent: 'space-between' }}>
                                <Text style={s.infoBold}>Total Efectivo:</Text>
                                <Text style={s.infoBold}>{formatPdfCurrency(totalCash)}</Text>
                            </View>
                        </View>

                        {/* BANK Column */}
                        <View style={{ flex: 1 }}>
                            <Text style={[s.infoBold, { fontSize: 9, borderBottomWidth: 1, paddingBottom: 2, marginBottom: 5 }]}>BANCOS</Text>
                            {bankAccounts.map((acc, i) => (
                                <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 }}>
                                    <Text style={{ fontSize: 8 }}>{acc.name}</Text>
                                    <Text style={{ fontSize: 8 }}>{formatPdfCurrency(acc.balance)}</Text>
                                </View>
                            ))}
                            <View style={{ borderTopWidth: 1, marginTop: 5, paddingTop: 3, flexDirection: 'row', justifyContent: 'space-between' }}>
                                <Text style={s.infoBold}>Total Bancos:</Text>
                                <Text style={s.infoBold}>{formatPdfCurrency(totalBanks)}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Botón de Conciliación Final */}
                <View style={{ marginTop: 30, border: '1pt solid #000', padding: 10, backgroundColor: '#FAFAFA' }} wrap={false}>
                    <Text style={[s.infoBold, { fontSize: 10, marginBottom: 8, textDecoration: 'underline' }]}>CONCILIACIÓN DEL CIERRE</Text>
                    
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text style={{ fontSize: 9 }}>Saldo Esperado en Sistema (Efectivo + Bancos):</Text>
                        <Text style={[s.infoBold, { fontSize: 9 }]}>{formatPdfCurrency(totalCash + totalBanks)}</Text>
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text style={{ fontSize: 9 }}>Total Reportado por Usuario (Contado + Bancos):</Text>
                        <View style={{ flexDirection: 'row', gap: 2 }}>
                            <Text style={[s.infoBold, { fontSize: 9 }]}>{formatPdfCurrency((actualAmount || 0) + totalBanks)}</Text>
                            <Text style={{ fontSize: 8, color: '#666' }}>({formatPdfCurrency(actualAmount)} contado + {formatPdfCurrency(totalBanks)} bancos)</Text>
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
                            {formatPdfCurrency(((actualAmount || 0) + totalBanks) - (totalCash + totalBanks))}
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
