import * as XLSX from "xlsx";
import { format, differenceInDays } from "date-fns";
import type { Client } from "@/entities/client/model/types";

export function exportClientsToExcel(clients: Client[]) {
    const dataToExport = clients.map(client => {
        const lastOrder = client.lastOrderDate ? new Date(client.lastOrderDate) : null;
        const isInactive = !lastOrder || differenceInDays(new Date(), lastOrder) > 30;
        
        return {
            "ID / Cédula": client.identificationNumber,
            "Tipo Doc.": client.identificationType,
            "Nombre Completo": client.firstName,
            "Email": client.email,
            "Teléfono Principal": client.phone1,
            "Operador": client.operator1,
            "WhatsApp": client.isWhatsApp ? "SÍ" : "NO",
            "Ciudad": client.city,
            "Provincia": client.province,
            "País": client.country,
            "Dirección": client.address,
            "Referencia": client.reference || "",
            "Fecha Registro": format(new Date(client.createdAt), "dd/MM/yyyy HH:mm"),
            "Último Pedido": client.lastOrderDate ? format(new Date(client.lastOrderDate), "dd/MM/yyyy") : "NINGUNO",
            "Última Marca": client.lastBrandName || "N/A",
            "Estado Actividad": isInactive ? "INACTIVO" : "ACTIVO",
            "Registrado Por": client.createdByName || "SISTEMA",
            "Última Actualización": client.lastDataUpdate ? format(new Date(client.lastDataUpdate), "dd/MM/yyyy HH:mm") : "N/A",
            "Total Pedidos": client.clientAccount?.totalOrders || 0,
            "Total Gastado": client.clientAccount?.totalSpent || 0,
            "Nivel Lealtad": client.clientAccount?.rewardLevel || "BRONCE",
            "Saldo a Favor": client.clientAccount?.totalCreditAvailable || 0,
        };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    
    // Create professional table-like look with AutoFilters
    const range = XLSX.utils.decode_range(worksheet['!ref'] || "A1");
    worksheet['!autofilter'] = { ref: XLSX.utils.encode_range(range) };

    // Basic Column Widths
    const wscols = [
        { wch: 15 }, // ID
        { wch: 12 }, // Tipo
        { wch: 30 }, // Nombre
        { wch: 25 }, // Email
        { wch: 15 }, // Tel
        { wch: 12 }, // Operador
        { wch: 10 }, // WA
        { wch: 15 }, // Ciudad
        { wch: 15 }, // Prov
        { wch: 10 }, // Pais
        { wch: 40 }, // Dir
        { wch: 30 }, // Ref
        { wch: 18 }, // Registro
        { wch: 15 }, // U. Pedido
        { wch: 15 }, // U. Marca
        { wch: 12 }, // Estado
        { wch: 15 }, // Registrado Por
        { wch: 18 }, // U. Actualizacion
        { wch: 12 }, // Total Pedidos
        { wch: 12 }, // Total Gastado
        { wch: 12 }, // Nivel
        { wch: 12 }, // Saldo
    ];
    worksheet['!cols'] = wscols;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Empresarias");
    
    // Generate filename with date
    const fileName = `Export_Empresarias_${format(new Date(), "yyyy-MM-dd_HHmm")}.xlsx`;
    XLSX.writeFile(workbook, fileName);
}
