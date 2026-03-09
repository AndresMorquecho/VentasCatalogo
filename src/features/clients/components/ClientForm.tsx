import { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { AsyncButton } from "@/shared/ui/async-button";
import { Label } from "@/shared/ui/label";
import { Separator } from "@/shared/ui/separator";
import { Badge } from "@/shared/ui/badge";
import type { Client, IdentificationType } from "@/entities/client/model/types";
import { useCreateClient, useUpdateClient, useClientList } from "@/features/clients/api/hooks";
import { Switch } from "@/shared/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/shared/ui/select";
import { differenceInYears } from "date-fns";

import { useAuth } from "@/shared/auth";
import { logAction } from "@/shared/lib/auditService";
import { useNotifications } from "@/shared/lib/notifications";

interface ClientFormProps {
    client?: Client | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const OPERATORS = ["Claro", "Movistar", "CNT", "Tuenti", "Otro"];
const ID_TYPES = [
    { label: "N° Cedula", value: "CEDULA" },
    { label: "Cedula extranjera", value: "CEDULA_EXTRANJERA" },
    { label: "RUC", value: "RUC" }
];
const PAYMENT_PREFERENCES = [
    { label: "Normal", value: "NORMAL" },
    { label: "Solo Contado", value: "SOLO_CONTADO" }
];

const validationSchema = Yup.object({
    identificationType: Yup.string().required("Requerido"),
    identificationNumber: Yup.string()
        .when('identificationType', {
            is: (val: string) => val === 'CEDULA',
            then: (schema) => schema.matches(/^\d{10}$/, "Cédula debe tener 10 dígitos"),
        })
        .when('identificationType', {
            is: (val: string) => val === 'RUC',
            then: (schema) => schema.matches(/^\d{13}$/, "RUC debe tener 13 dígitos"),
        })
        .required("Requerido"),
    firstName: Yup.string().required("El nombre es requerido"),
    country: Yup.string().required("Requerido"),
    province: Yup.string().required("Requerido"),
    city: Yup.string().required("Requerido"),
    address: Yup.string().required("Requerido"),
    neighborhood: Yup.string().optional(),
    sector: Yup.string().optional(),
    email: Yup.string().email("Formato inválido").required("Requerido"),
    reference: Yup.string().optional(),
    phone1: Yup.string()
        .matches(/^\d{7,15}$/, "Entre 7 y 15 dígitos")
        .required("Requerido"),
    operator1: Yup.string().required("Requerido"),
    phone2: Yup.string()
        .matches(/^\d{7,15}$/, "Entre 7 y 15 dígitos")
        .optional()
        .nullable()
        .transform((value) => (value === "" ? undefined : value)),
    operator2: Yup.string().optional(),
    birthDate: Yup.date().optional().nullable(),
    isWhatsApp: Yup.boolean().optional(),
    referredById: Yup.string().optional().nullable(),
    paymentPreference: Yup.string().optional(),
});

export function ClientForm({ client, open, onOpenChange }: ClientFormProps) {
    const createClient = useCreateClient();
    const updateClient = useUpdateClient();
    const { data: clientsResponse } = useClientList({ limit: 1000 }); // Para el selector de referidos
    const allClients = clientsResponse?.data || [];

    const { user } = useAuth();
    const { notifySuccess, notifyError } = useNotifications();
    const isEditing = !!client;
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const inputClass =
        "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

    const formik = useFormik({
        initialValues: {
            identificationType: client?.identificationType || "CEDULA" as IdentificationType,
            identificationNumber: client?.identificationNumber || "",
            firstName: client?.firstName || "",
            country: client?.country || "Ecuador",
            province: client?.province || "",
            city: client?.city || "",
            address: client?.address || "",
            neighborhood: client?.neighborhood || "",
            sector: client?.sector || "",
            email: client?.email || "",
            reference: client?.reference || "",
            phone1: client?.phone1 || "",
            operator1: client?.operator1 || "Claro",
            phone2: client?.phone2 || "",
            operator2: client?.operator2 || "",
            birthDate: client?.birthDate ? client.birthDate.split('T')[0] : "",
            isWhatsApp: client?.isWhatsApp || false,
            referredById: client?.referredById || "",
            paymentPreference: client?.paymentPreference || "NORMAL",
        },
        validationSchema,
        enableReinitialize: true,
        onSubmit: async (values) => {
            setSubmitError(null);
            setIsSubmitting(true);
            const payload = {
                identificationType: values.identificationType as IdentificationType,
                identificationNumber: values.identificationNumber,
                firstName: values.firstName,
                country: values.country,
                province: values.province,
                city: values.city,
                address: values.address,
                neighborhood: values.neighborhood || undefined,
                sector: values.sector || undefined,
                email: values.email,
                reference: values.reference || undefined,
                phone1: values.phone1,
                operator1: values.operator1,
                phone2: values.phone2 || undefined,
                operator2: values.operator2 || undefined,
                birthDate: values.birthDate || null,
                isWhatsApp: values.isWhatsApp,
                referredById: values.referredById || null,
                paymentPreference: values.paymentPreference,
            };

            try {
                if (isEditing && client) {
                    await updateClient.mutateAsync({ id: client.id, data: payload });
                    if (user) {
                        logAction({
                            userId: user.id,
                            userName: user.username,
                            action: 'UPDATE_CLIENT',
                            module: 'clients',
                            detail: `Actualizó empresaria: ${values.firstName}`
                        });
                    }
                    notifySuccess(`Empresaria "${values.firstName}" actualizada correctamente`);
                } else {
                    await createClient.mutateAsync(payload);
                    if (user) {
                        logAction({
                            userId: user.id,
                            userName: user.username,
                            action: 'CREATE_CLIENT',
                            module: 'clients',
                            detail: `Creó empresaria: ${values.firstName}`
                        });
                    }
                    notifySuccess(`Empresaria "${values.firstName}" creada correctamente`);
                }
                onOpenChange(false);
                formik.resetForm();
            } catch (error: any) {
                console.error("Error saving client", error);
                let msg = error.message || 'Ocurrió un error al guardar. Intente de nuevo.';

                if (error.code === 'UNIQUE_CONSTRAINT') {
                    const field = error.details?.target?.[0];
                    if (field === 'identification_number') {
                        msg = 'Ya existe una empresaria con este número de cédula.';
                    } else if (field === 'email') {
                        msg = 'Ya existe una empresaria con este correo electrónico.';
                    }
                }

                setSubmitError(msg);
                notifyError(error, msg);
            } finally {
                setIsSubmitting(false);
            }
        },
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto w-[95vw] max-w-[95vw] sm:w-full">
                <DialogHeader>
                    <DialogTitle className="text-base sm:text-lg">
                        {isEditing ? "Editar Empresaria" : "Nueva Empresaria"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={formik.handleSubmit} className="space-y-4 sm:space-y-6 py-2 sm:py-4">
                    {/* Sección: Identificación */}
                    <div>
                        <h4 className="text-xs sm:text-sm font-medium text-muted-foreground mb-2 sm:mb-3">
                            Identificación
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="identificationType">Tipo Documento</Label>
                                <Select
                                    value={formik.values.identificationType}
                                    onValueChange={(val) => formik.setFieldValue("identificationType", val)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccione tipo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ID_TYPES.map(type => (
                                            <SelectItem key={type.value} value={type.value}>
                                                {type.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="identificationNumber">Nº Documento</Label>
                                <Input
                                    id="identificationNumber"
                                    {...formik.getFieldProps("identificationNumber")}
                                    placeholder="1723456789"
                                />
                                {formik.touched.identificationNumber &&
                                    formik.errors.identificationNumber && (
                                        <p className="text-red-500 text-xs">
                                            {formik.errors.identificationNumber}
                                        </p>
                                    )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="firstName">Nombre Completo</Label>
                                <Input
                                    id="firstName"
                                    {...formik.getFieldProps("firstName")}
                                    placeholder="Maria Fernanda Gonzalez"
                                />
                                {formik.touched.firstName && formik.errors.firstName && (
                                    <p className="text-red-500 text-xs">
                                        {formik.errors.firstName}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="paymentPreference">Preferencia de Pago</Label>
                                <Select
                                    value={formik.values.paymentPreference}
                                    onValueChange={(val) => formik.setFieldValue("paymentPreference", val)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Preferencia" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {PAYMENT_PREFERENCES.map(pref => (
                                            <SelectItem key={pref.value} value={pref.value}>
                                                {pref.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mt-3 sm:mt-4">
                            <div className="space-y-2">
                                <Label htmlFor="birthDate">Fecha de Nacimiento</Label>
                                <div className="flex gap-2 items-center">
                                    <Input
                                        id="birthDate"
                                        type="date"
                                        {...formik.getFieldProps("birthDate")}
                                    />
                                    {formik.values.birthDate && (
                                        <Badge variant="outline" className="h-9 px-2 whitespace-nowrap">
                                            {differenceInYears(new Date(), new Date(formik.values.birthDate))} años
                                        </Badge>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="referredById">Referido por</Label>
                                <Select
                                    value={formik.values.referredById || "none"}
                                    onValueChange={(val) => formik.setFieldValue("referredById", val === "none" ? "" : val)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Buscar cliente..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">-- Sin referido --</SelectItem>
                                        {allClients
                                            .filter(c => c.id !== client?.id)
                                            .map(c => (
                                                <SelectItem key={c.id} value={c.id}>
                                                    {c.firstName} ({c.identificationNumber})
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Sección: Ubicación */}
                    <div>
                        <h4 className="text-xs sm:text-sm font-medium text-muted-foreground mb-2 sm:mb-3">
                            Ubicación
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="country">País</Label>
                                <Input
                                    id="country"
                                    {...formik.getFieldProps("country")}
                                    placeholder="Ecuador"
                                />
                                {formik.touched.country && formik.errors.country && (
                                    <p className="text-red-500 text-xs">
                                        {formik.errors.country}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="province">Provincia</Label>
                                <Input
                                    id="province"
                                    {...formik.getFieldProps("province")}
                                    placeholder="Pichincha"
                                />
                                {formik.touched.province && formik.errors.province && (
                                    <p className="text-red-500 text-xs">
                                        {formik.errors.province}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="city">Ciudad</Label>
                                <Input
                                    id="city"
                                    {...formik.getFieldProps("city")}
                                    placeholder="Quito"
                                />
                                {formik.touched.city && formik.errors.city && (
                                    <p className="text-red-500 text-xs">
                                        {formik.errors.city}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mt-3 sm:mt-4">
                            <div className="space-y-2">
                                <Label htmlFor="address">Dirección</Label>
                                <Input
                                    id="address"
                                    {...formik.getFieldProps("address")}
                                    placeholder="Av. Amazonas y Colon N23-45"
                                />
                                {formik.touched.address && formik.errors.address && (
                                    <p className="text-red-500 text-xs">
                                        {formik.errors.address}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="reference">Referencia (Opcional)</Label>
                                <Input
                                    id="reference"
                                    {...formik.getFieldProps("reference")}
                                    placeholder="Frente al parque..."
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mt-3 sm:mt-4">
                            <div className="space-y-2">
                                <Label htmlFor="neighborhood">Barrio (Opcional)</Label>
                                <Input
                                    id="neighborhood"
                                    {...formik.getFieldProps("neighborhood")}
                                    placeholder="La Mariscal"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="sector">Sector (Opcional)</Label>
                                <Input
                                    id="sector"
                                    {...formik.getFieldProps("sector")}
                                    placeholder="Norte"
                                />
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Sección: Contacto */}
                    <div>
                        <h4 className="text-xs sm:text-sm font-medium text-muted-foreground mb-2 sm:mb-3">
                            Contacto
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                            <div className="space-y-2 md:col-span-1">
                                <Label htmlFor="email">Correo Electrónico</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    {...formik.getFieldProps("email")}
                                    placeholder="correo@ejemplo.com"
                                />
                                {formik.touched.email && formik.errors.email && (
                                    <p className="text-red-500 text-xs">
                                        {formik.errors.email}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone1">Teléfono Principal</Label>
                                <div className="space-y-2">
                                    <Input
                                        id="phone1"
                                        {...formik.getFieldProps("phone1")}
                                        placeholder="0998765432"
                                    />
                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            id="isWhatsApp"
                                            checked={formik.values.isWhatsApp}
                                            onCheckedChange={(checked: boolean) => formik.setFieldValue("isWhatsApp", checked)}
                                        />
                                        <label
                                            htmlFor="isWhatsApp"
                                            className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            Es WhatsApp
                                        </label>
                                    </div>
                                </div>
                                {formik.touched.phone1 && formik.errors.phone1 && (
                                    <p className="text-red-500 text-xs text-xs">
                                        {formik.errors.phone1}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="operator1">Operadora</Label>
                                <select
                                    id="operator1"
                                    {...formik.getFieldProps("operator1")}
                                    className={inputClass}
                                >
                                    {OPERATORS.map((op) => (
                                        <option key={op} value={op}>
                                            {op}
                                        </option>
                                    ))}
                                </select>
                                {formik.touched.operator1 && formik.errors.operator1 && (
                                    <p className="text-red-500 text-xs">
                                        {formik.errors.operator1}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mt-3 sm:mt-4">
                            <div className="md:col-span-1" /> {/* spacer */}
                            <div className="space-y-2">
                                <Label htmlFor="phone2">Teléfono Secundario (Opc.)</Label>
                                <Input
                                    id="phone2"
                                    {...formik.getFieldProps("phone2")}
                                    placeholder="0987654321"
                                />
                                {formik.touched.phone2 && formik.errors.phone2 && (
                                    <p className="text-red-500 text-xs">
                                        {formik.errors.phone2}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="operator2">Operadora (Opc.)</Label>
                                <select
                                    id="operator2"
                                    {...formik.getFieldProps("operator2")}
                                    className={inputClass}
                                >
                                    <option value="">— Ninguna —</option>
                                    {OPERATORS.map((op) => (
                                        <option key={op} value={op}>
                                            {op}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {submitError && (
                        <p className="text-red-500 text-sm text-center">{submitError}</p>
                    )}

                    <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                        <AsyncButton
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="w-full sm:w-auto"
                        >
                            Cancelar
                        </AsyncButton>
                        <AsyncButton type="submit" isLoading={isSubmitting} loadingText="Guardando..." className="w-full sm:w-auto">
                            {isEditing ? "Guardar Cambios" : "Crear Empresaria"}
                        </AsyncButton>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
