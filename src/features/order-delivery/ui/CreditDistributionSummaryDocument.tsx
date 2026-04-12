import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { formatPdfCurrency } from '@/shared/lib/formatPdfCurrency';
import type { Order } from '@/entities/order/model/types';
import type { CreditDistribution, CreditDistributionItem } from '@/entities/financial-record/model/types';
import { getPaidAmount } from '@/entities/order/model/model';

const BRAND = '#511378';

const styles = StyleSheet.create({
    page: { padding: 26, fontFamily: 'Helvetica', fontSize: 9, color: '#111' },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: BRAND,
    },
    logo: { width: 200, height: 56, objectFit: 'contain' },
    titleBlock: { alignItems: 'flex-end', maxWidth: '42%' },
    title: { fontSize: 13, fontWeight: 'bold', color: BRAND, textAlign: 'right' },
    subtitle: { fontSize: 7.5, color: '#444', marginTop: 4, textAlign: 'right' },
    metaRow: { flexDirection: 'row', marginBottom: 3, fontSize: 9 },
    metaLabel: { width: 120, fontWeight: 'bold' },
    sectionTitle: {
        fontSize: 10,
        fontWeight: 'bold',
        marginTop: 12,
        marginBottom: 6,
        borderBottomWidth: 0.5,
        borderBottomColor: BRAND,
        paddingBottom: 2,
        color: BRAND,
    },
    table: { borderWidth: 0.5, borderColor: '#000', marginTop: 4 },
    row: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#ccc' },
    th: {
        fontSize: 6.5,
        fontWeight: 'bold',
        padding: 4,
        borderRightWidth: 0.5,
        borderRightColor: '#000',
        backgroundColor: '#f0f0f0',
        textAlign: 'center',
    },
    td: {
        fontSize: 6.5,
        padding: 4,
        borderRightWidth: 0.5,
        borderRightColor: '#eee',
        textAlign: 'center',
    },
    tdRight: { textAlign: 'right' },
    tdLast: { borderRightWidth: 0 },
    note: { fontSize: 7, color: '#555', marginTop: 10, fontStyle: 'italic' },
    // 5 columnas: orden | pedido | pend. antes | distribución | pend. después
    colOrden: { width: '13%' },
    colPedido: { width: '27%' },
    colPendAntes: { width: '18%' },
    colDist: { width: '16%' },
    colPendDespues: { width: '26%' },
});

function totalIncomingToTarget(targetId: string, allDist: CreditDistribution[]) {
    let sum = 0;
    for (const d of allDist) {
        for (const x of d.distributions || []) {
            if (x.targetOrderId === targetId) sum += Number(x.amount || 0);
        }
    }
    return sum;
}

/** Saldo pendiente del pedido destino tras aplicar todas las distribuciones de la sesión. */
function pendingAfterForTarget(targetId: string, allDist: CreditDistribution[], ordersById: Record<string, Order>): number {
    const tgt = ordersById[targetId];
    if (!tgt) return 0;
    const totalIn = totalIncomingToTarget(targetId, allDist);
    const total = Number(tgt.realInvoiceTotal ?? tgt.total ?? 0);
    return Math.max(0, total - getPaidAmount(tgt) - totalIn);
}

function isWalletLine(line: CreditDistributionItem) {
    return !line.targetOrderId && !line.isCashReturn;
}

function isCashReturnLine(line: CreditDistributionItem) {
    return !!line.isCashReturn;
}

interface Props {
    distributions: CreditDistribution[];
    ordersById: Record<string, Order>;
    deliveryNumber: string;
    clientName: string;
    username?: string;
    formattedDate: string;
    /** Total saldo billetera tras la operación (desde API). Si no viene, la fila billetera usa solo el monto de la línea. */
    clientWalletTotalAfter?: number | null;
}

export const CreditDistributionSummaryDocument: React.FC<Props> = ({
    distributions,
    ordersById,
    deliveryNumber,
    clientName,
    username,
    formattedDate,
    clientWalletTotalAfter,
}) => {
    const list = distributions.filter((d) => d.distributions?.length);

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.headerRow}>
                    <Image src="/images/BannerHeader.jpg" style={styles.logo} />
                    <View style={styles.titleBlock}>
                        <Text style={styles.title}>Distribución de saldo a favor</Text>
                        <Text style={styles.subtitle}>
                            Resumen por pedido destino y montos aplicados (antes del cobro final de entrega)
                        </Text>
                    </View>
                </View>

                <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Fecha:</Text>
                    <Text>{formattedDate}</Text>
                </View>
                <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>N° Entrega:</Text>
                    <Text>{deliveryNumber}</Text>
                </View>
                <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Empresaria:</Text>
                    <Text>{clientName}</Text>
                </View>
                <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Registrado por:</Text>
                    <Text>{username || '—'}</Text>
                </View>

                {list.map((dist, di) => {
                    const src = ordersById[dist.sourceOrderId];
                    const srcLabel = src
                        ? `${src.receiptNumber || '—'} · ${src.orderNumber || '—'} · ${src.brandName || ''}`
                        : `Pedido origen ${dist.sourceOrderId?.slice(0, 8)}…`;

                    const lines = dist.distributions || [];
                    let walletSumSuffix = 0;
                    const walletSuffixFromIndex: number[] = new Array(lines.length).fill(0);
                    for (let i = lines.length - 1; i >= 0; i--) {
                        if (isWalletLine(lines[i])) {
                            walletSumSuffix += Number(lines[i].amount || 0);
                        }
                        walletSuffixFromIndex[i] = walletSumSuffix;
                    }

                    return (
                        <View key={di} wrap={false}>
                            <Text style={styles.sectionTitle}>Origen: {srcLabel}</Text>
                            <Text style={{ fontSize: 8, marginBottom: 6 }}>
                                Total crédito distribuido: {formatPdfCurrency(Number(dist.totalCreditAmount || 0))}
                            </Text>

                            <View style={styles.table}>
                                <View style={styles.row}>
                                    <Text style={[styles.th, styles.colOrden]}>Orden</Text>
                                    <Text style={[styles.th, styles.colPedido]}>Pedido</Text>
                                    <Text style={[styles.th, styles.colPendAntes]}>
                                        {'Saldo pendiente\n(antes*)'}
                                    </Text>
                                    <Text style={[styles.th, styles.colDist]}>Distribución</Text>
                                    <Text style={[styles.th, styles.colPendDespues, styles.tdLast]}>
                                        {'Saldo pendiente\n(después*)'}
                                    </Text>
                                </View>
                                {lines.map((line, li) => {
                                    const monto = Number(line.amount || 0);
                                    let orden = '—';
                                    let pedido = '';
                                    let pendAntesStr = '—';
                                    let pendDespuesStr = '—';

                                    if (line.targetOrderId) {
                                        const tgt = ordersById[line.targetOrderId];
                                        if (tgt) {
                                            orden = tgt.receiptNumber || '—';
                                            const brand = tgt.brandName ? ` · ${tgt.brandName}` : '';
                                            pedido = `${tgt.orderNumber || '—'}${brand}`;
                                            const pendDespues = pendingAfterForTarget(line.targetOrderId, list, ordersById);
                                            const pendAntes = pendDespues + monto;
                                            pendAntesStr = formatPdfCurrency(pendAntes);
                                            pendDespuesStr = formatPdfCurrency(pendDespues);
                                        } else {
                                            pedido = `Pedido ${line.targetOrderId.slice(0, 8)}…`;
                                            pendAntesStr = '—';
                                            pendDespuesStr = '—';
                                        }
                                    } else if (isCashReturnLine(line)) {
                                        pedido = 'Devolución (efectivo / cuenta)';
                                        pendAntesStr = '—';
                                        pendDespuesStr = formatPdfCurrency(monto);
                                    } else if (isWalletLine(line)) {
                                        pedido = 'Billetera virtual / saldo a favor';
                                        const walletAfter =
                                            clientWalletTotalAfter != null &&
                                            Number.isFinite(clientWalletTotalAfter) &&
                                            clientWalletTotalAfter >= 0
                                                ? clientWalletTotalAfter
                                                : null;
                                        if (walletAfter != null) {
                                            pendDespuesStr = formatPdfCurrency(walletAfter);
                                            const sumThisAndFollowingWallet =
                                                walletSuffixFromIndex[li] ?? monto;
                                            const antes = Math.max(0, walletAfter - sumThisAndFollowingWallet);
                                            pendAntesStr = formatPdfCurrency(antes);
                                        } else {
                                            pendAntesStr = '—';
                                            pendDespuesStr = formatPdfCurrency(monto);
                                        }
                                    }

                                    return (
                                        <View style={styles.row} key={li}>
                                            <Text style={[styles.td, styles.colOrden]}>{orden}</Text>
                                            <Text style={[styles.td, styles.colPedido]}>{pedido}</Text>
                                            <Text style={[styles.td, styles.colPendAntes, styles.tdRight]}>{pendAntesStr}</Text>
                                            <Text style={[styles.td, styles.colDist, styles.tdRight]}>{formatPdfCurrency(monto)}</Text>
                                            <Text style={[styles.td, styles.colPendDespues, styles.tdRight, styles.tdLast]}>
                                                {pendDespuesStr}
                                            </Text>
                                        </View>
                                    );
                                })}
                            </View>
                        </View>
                    );
                })}

                <Text style={styles.note}>
                    * En pedidos destino: primera columna = saldo pendiente estimado antes de aplicar esa fila; segunda =
                    saldo pendiente tras todas las distribuciones de la sesión hacia ese pedido. En billetera virtual: se
                    muestra el saldo disponible total en billetera (antes y después de esta línea), según el sistema tras
                    la entrega. En devolución en efectivo la última columna refleja el monto devuelto.
                </Text>
            </Page>
        </Document>
    );
};
