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
import { 
    User, 
    MapPin, 
    Phone as PhoneIcon, 
    Mail, 
    Calendar, 
    UserPlus, 
    CreditCard,
    MessageSquare,
    AlertCircle,
} from "lucide-react";

import { useAuth } from "@/shared/auth";
import { logAction } from "@/shared/lib/auditService";
import { useNotifications } from "@/shared/lib/notifications";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

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
});

export function ClientForm({ client, open, onOpenChange }: ClientFormProps) {
    const createClient = useCreateClient();
    const updateClient = useUpdateClient();
    const { data: clientsResponse } = useClientList({ limit: 1000 });
    const allClients = clientsResponse?.data || [];

    const { user } = useAuth();
    const { notifySuccess, notifyError } = useNotifications();
    const isEditing = !!client;
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

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
            <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
                <DialogHeader className="p-6 pb-4 bg-gradient-to-r from-primary/5 to-primary/10 border-b">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                            {isEditing ? <User className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold tracking-tight">
                                {isEditing ? "Editar Perfil de Empresaria" : "Registro de Nueva Empresaria"}
                            </DialogTitle>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {isEditing ? "Actualice la información detallada de la empresaria." : "Complete todos los campos para dar de alta una nueva empresaria."}
                            </p>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
                    <form id="client-form" onSubmit={formik.handleSubmit} className="space-y-8">
                        {/* SECCIÓN 1: INFORMACIÓN PERSONAL */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 pb-2 border-b border-muted">
                                <User className="h-4 w-4 text-primary" />
                                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">Información Personal</h3>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                                <div className="md:col-span-4 space-y-2">
                                    <Label htmlFor="identificationType" className="text-xs font-semibold">Tipo Documento</Label>
                                    <Select
                                        value={formik.values.identificationType}
                                        onValueChange={(val) => formik.setFieldValue("identificationType", val)}
                                    >
                                        <SelectTrigger className="bg-slate-50/50">
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

                                <div className="md:col-span-8 space-y-2">
                                    <Label htmlFor="identificationNumber" className="text-xs font-semibold">Número de Identificación</Label>
                                    <div className="relative">
                                        <Input
                                            id="identificationNumber"
                                            {...formik.getFieldProps("identificationNumber")}
                                            placeholder="Ej: 1723456789"
                                            className={cn(
                                                "bg-slate-50/50 font-mono",
                                                formik.touched.identificationNumber && formik.errors.identificationNumber && "border-destructive ring-destructive/20"
                                            )}
                                        />
                                        <span className="absolute right-3 top-2.5 text-muted-foreground/30">
                                            <CreditCard className="h-4 w-4" />
                                        </span>
                                    </div>
                                    {formik.touched.identificationNumber && formik.errors.identificationNumber && (
                                        <p className="text-[10px] font-medium text-destructive mt-1">{formik.errors.identificationNumber}</p>
                                    )}
                                </div>

                                <div className="md:col-span-12 space-y-2">
                                    <Label htmlFor="firstName" className="text-xs font-semibold">Nombre Completo de la Empresaria</Label>
                                    <Input
                                        id="firstName"
                                        {...formik.getFieldProps("firstName")}
                                        placeholder="Nombre y Apellidos"
                                        className={cn(
                                            "bg-slate-50/50",
                                            formik.touched.firstName && formik.errors.firstName && "border-destructive ring-destructive/20"
                                        )}
                                    />
                                    {formik.touched.firstName && formik.errors.firstName && (
                                        <p className="text-[10px] font-medium text-destructive mt-1">{formik.errors.firstName}</p>
                                    )}
                                </div>

                                <div className="md:col-span-6 space-y-2">
                                    <Label htmlFor="birthDate" className="text-xs font-semibold">Fecha de Nacimiento</Label>
                                    <div className="relative flex gap-2">
                                        <Input
                                            id="birthDate"
                                            type="date"
                                            {...formik.getFieldProps("birthDate")}
                                            className="bg-slate-50/50 flex-1"
                                        />
                                        {formik.values.birthDate && (
                                            <Badge variant="secondary" className="h-9 px-3 shrink-0 bg-primary/5 text-primary border-primary/10">
                                                <Calendar className="h-3 w-3 mr-1.5" />
                                                {differenceInYears(new Date(), new Date(formik.values.birthDate))} años
                                            </Badge>
                                        )}
                                    </div>
                                </div>

                                <div className="md:col-span-6 space-y-2">
                                    <Label htmlFor="referredById" className="text-xs font-semibold">Referido por (Opcional)</Label>
                                    <Select
                                        value={formik.values.referredById || "none"}
                                        onValueChange={(val) => formik.setFieldValue("referredById", val === "none" ? "" : val)}
                                    >
                                        <SelectTrigger className="bg-slate-50/50">
                                            <SelectValue placeholder="Busque una empresaria..." />
                                        </SelectTrigger>
                                        <SelectContent searchable>
                                            <SelectItem value="none">-- Sin referido --</SelectItem>
                                            {allClients
                                                .filter(c => c.id !== client?.id)
                                                .map(c => (
                                                    <SelectItem key={c.id} value={c.id}>
                                                        {c.firstName}
                                                    </SelectItem>
                                                ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </section>

                        {/* SECCIÓN 2: UBICACIÓN Y DOMICILIO */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 pb-2 border-b border-muted">
                                <MapPin className="h-4 w-4 text-primary" />
                                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">Ubicación y Domicilio</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <div className="space-y-2">
                                    <Label htmlFor="country" className="text-xs font-semibold">País</Label>
                                    <Input id="country" {...formik.getFieldProps("country")} className="bg-slate-50/50" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="province" className="text-xs font-semibold">Provincia</Label>
                                    <Input id="province" {...formik.getFieldProps("province")} className="bg-slate-50/50" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="city" className="text-xs font-semibold">Ciudad</Label>
                                    <Input id="city" {...formik.getFieldProps("city")} className="bg-slate-50/50" />
                                </div>

                                <div className="md:col-span-2 space-y-2">
                                    <Label htmlFor="address" className="text-xs font-semibold">Dirección Domiciliaria</Label>
                                    <Input id="address" {...formik.getFieldProps("address")} placeholder="Calle principal y secundaria, N° de casa" className="bg-slate-50/50" />
                                </div>
                                <div className="md:col-span-1 space-y-2">
                                    <Label htmlFor="neighborhood" className="text-xs font-semibold">Barrio / Urbanización</Label>
                                    <Input id="neighborhood" {...formik.getFieldProps("neighborhood")} className="bg-slate-50/50" />
                                </div>

                                <div className="md:col-span-3 space-y-2 text-area-like">
                                    <Label htmlFor="reference" className="text-xs font-semibold">Referencia de Ubicación</Label>
                                    <Input id="reference" {...formik.getFieldProps("reference")} placeholder="Ej: Frente a la farmacia, casa color verde..." className="bg-slate-50/50" />
                                </div>
                            </div>
                        </section>

                        {/* SECCIÓN 3: CONTACTO DIGITAL Y TELEFÓNICO */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 pb-2 border-b border-muted">
                                <PhoneIcon className="h-4 w-4 text-primary" />
                                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">Canales de Contacto</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                                <div className="md:col-span-12 space-y-2">
                                    <Label htmlFor="email" className="text-xs font-semibold">Correo Electrónico</Label>
                                    <div className="relative">
                                        <Input id="email" type="email" {...formik.getFieldProps("email")} placeholder="ejemplo@correo.com" className="bg-slate-50/50 pl-10" />
                                        <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/50" />
                                    </div>
                                    {formik.touched.email && formik.errors.email && (
                                        <p className="text-[10px] font-medium text-destructive mt-1">{formik.errors.email}</p>
                                    )}
                                </div>

                                <div className="md:col-span-6 lg:md:col-span-7 space-y-3">
                                    <Label className="text-xs font-semibold">Teléfono Principal</Label>
                                    <div className="flex flex-col gap-3 p-3 rounded-lg border bg-slate-50/30 border-dashed">
                                        <div className="flex gap-2">
                                            <Input id="phone1" {...formik.getFieldProps("phone1")} placeholder="0998765432" className="flex-1" />
                                            <div className="w-32 shrink-0">
                                                <Select
                                                    value={formik.values.operator1}
                                                    onValueChange={(val) => formik.setFieldValue("operator1", val)}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Operador" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {OPERATORS.map(op => (
                                                            <SelectItem key={op} value={op}>{op}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between px-1">
                                            <div className="flex items-center gap-2">
                                                <div className={cn(
                                                    "p-1.5 rounded-md",
                                                    formik.values.isWhatsApp ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-400"
                                                )}>
                                                    <MessageSquare className="h-3.5 w-3.5" />
                                                </div>
                                                <Label htmlFor="isWhatsApp" className="text-xs cursor-pointer">Vincular con WhatsApp</Label>
                                            </div>
                                            <Switch
                                                id="isWhatsApp"
                                                checked={formik.values.isWhatsApp}
                                                onCheckedChange={(val) => formik.setFieldValue("isWhatsApp", val)}
                                            />
                                        </div>
                                    </div>
                                    {formik.touched.phone1 && formik.errors.phone1 && (
                                        <p className="text-[10px] font-medium text-destructive mt-1">{formik.errors.phone1}</p>
                                    )}
                                </div>

                                <div className="md:col-span-6 lg:md:col-span-5 space-y-2">
                                    <Label htmlFor="phone2" className="text-xs font-semibold">Teléfono Secundario (Respaldos)</Label>
                                    <div className="space-y-3">
                                        <Input id="phone2" {...formik.getFieldProps("phone2")} placeholder="022123456" className="bg-slate-50/50" />
                                        <Select
                                            value={formik.values.operator2 || "none"}
                                            onValueChange={(val) => formik.setFieldValue("operator2", val === "none" ? "" : val)}
                                        >
                                            <SelectTrigger className="bg-slate-50/50">
                                                <SelectValue placeholder="Operador secundario" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">-- Sin especificar --</SelectItem>
                                                {OPERATORS.map(op => (
                                                    <SelectItem key={op} value={op}>{op}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </form>
                </div>

                <DialogFooter className="p-6 bg-slate-50 border-t flex items-center justify-between gap-4">
                    <div className="hidden sm:block">
                        {submitError && (
                            <p className="text-xs font-semibold text-destructive flex items-center gap-1.5">
                                <AlertCircle className="h-3.5 w-3.5" />
                                {submitError}
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            className="flex-1 sm:flex-none uppercase text-[10px] font-bold tracking-widest"
                        >
                            Cerrar
                        </Button>
                        <AsyncButton 
                            form="client-form"
                            type="submit" 
                            isLoading={isSubmitting} 
                            loadingText="Procesando..." 
                            className="flex-1 sm:flex-none px-8 uppercase text-[10px] font-bold tracking-widest shadow-lg shadow-primary/20"
                        >
                            {isEditing ? "Actualizar Registro" : "Registrar Empresaria"}
                        </AsyncButton>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
