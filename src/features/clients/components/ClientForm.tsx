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

import { ECUADOR_DATA } from "@/shared/constants/ecuador-locations";
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

const OPERATORS = ["CLARO", "MOVISTAR", "CNT", "TUENTI", "OTRO"];
const ID_TYPES = [
    { label: "N° CEDULA", value: "CEDULA" },
    { label: "CEDULA EXTRANJERA", value: "CEDULA_EXTRANJERA" },
    { label: "RUC", value: "RUC" }
];

const validationSchema = Yup.object({
    identificationType: Yup.string().required("Se requiere elegir un tipo de documento"),
    identificationNumber: Yup.string()
        .when('identificationType', {
            is: (val: string) => val === 'CEDULA',
            then: (schema) => schema.matches(/^\d{10}$/, "Cédula debe tener 10 dígitos"),
        })
        .when('identificationType', {
            is: (val: string) => val === 'RUC',
            then: (schema) => schema.matches(/^\d{13}$/, "RUC debe tener 13 dígitos"),
        })
        .required("Se requiere número de identificación"),
    firstName: Yup.string().required("Se requiere nombre completo de empresaria"),
    country: Yup.string().required("Se requiere el país"),
    province: Yup.string().required("Se requiere la provincia"),
    city: Yup.string().required("Se requiere la ciudad"),
    address: Yup.string().required("Se requiere la dirección domiciliaria"),
    neighborhood: Yup.string().optional(),
    sector: Yup.string().optional(),
    email: Yup.string().email("Formato de correo inválido").required("Se requiere correo electrónico"),
    reference: Yup.string().optional(),
    phone1: Yup.string()
        .matches(/^\d{7,15}$/, "Teléfono debe tener entre 7 y 15 dígitos")
        .required("Se requiere teléfono principal"),
    operator1: Yup.string().required("Se requiere operadora del teléfono"),
    phone2: Yup.string()
        .matches(/^\d{7,15}$/, "Entre 7 y 15 dígitos")
        .optional()
        .nullable()
        .transform((value) => (value === "" ? undefined : value)),
    operator2: Yup.string().optional(),
    birthDate: Yup.date().optional().nullable(),
    isWhatsApp: Yup.boolean().optional(),
    referredById: Yup.string().optional().nullable(),
    identificationIssuanceDate: Yup.date().optional().nullable(),
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
    const [showValidationModal, setShowValidationModal] = useState(false);
    const [missingFields, setMissingFields] = useState<string[]>([]);

    const formik = useFormik({
        initialValues: {
            identificationType: (client?.identificationType?.toUpperCase() || "CEDULA") as IdentificationType,
            identificationNumber: client?.identificationNumber || "",
            firstName: client?.firstName?.toUpperCase() || "",
            country: client?.country || "Ecuador",
            province: (() => {
                if (!client?.province) return "";
                const match = Object.keys(ECUADOR_DATA).find(
                    k => k.toLowerCase() === client.province.toLowerCase()
                );
                return match || client.province;
            })(),
            city: (() => {
                if (!client?.city || !client?.province) return client?.city || "";
                const provMatch = Object.keys(ECUADOR_DATA).find(
                    k => k.toLowerCase() === client.province.toLowerCase()
                );
                const cities = provMatch ? ECUADOR_DATA[provMatch] : [];
                const cityMatch = cities.find(
                    c => c.toLowerCase() === client.city.toLowerCase()
                );
                return cityMatch || client.city;
            })(),
            address: client?.address || "",
            neighborhood: client?.neighborhood || "",
            sector: client?.sector || "",
            email: client?.email || "",
            reference: client?.reference || "",
            phone1: client?.phone1 || "",
            operator1: (() => {
                if (!client?.operator1) return "Claro";
                const match = OPERATORS.find(
                    op => op.toLowerCase() === client.operator1.toLowerCase()
                );
                return match || client.operator1;
            })(),
            phone2: client?.phone2 || "",
            operator2: (() => {
                const val = client?.operator2;
                if (!val) return "";
                const match = OPERATORS.find(
                    op => op.toLowerCase() === val.toLowerCase()
                );
                return match || val;
            })(),
            birthDate: client?.birthDate ? client.birthDate.split('T')[0] : "",
            isWhatsApp: client?.isWhatsApp || false,
            referredById: client?.referredById || "",
            isBlocked: client?.isBlocked || false,
            identificationIssuanceDate: client?.identificationIssuanceDate ? client.identificationIssuanceDate.split('T')[0] : "",
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
                isBlocked: values.isBlocked,
                identificationIssuanceDate: values.identificationIssuanceDate || null,
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
                        msg = 'Ese número de identificación de identidad ya está registrado.';
                    } else if (field === 'email') {
                        msg = 'Este correo electrónico ya se encuentra registrado.';
                    }
                }

                setSubmitError(msg);
                notifyError(error, msg);
            } finally {
                setIsSubmitting(false);
            }
        },
    });

    const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const errors = await formik.validateForm();
        const errorMessages = Object.values(errors) as string[];

        if (errorMessages.length > 0) {
            setMissingFields(errorMessages);
            setShowValidationModal(true);
            // Mark all fields as touched to show inline errors as well
            formik.setTouched(
                Object.keys(formik.values).reduce((acc, key) => ({ ...acc, [key]: true }), {})
            );
        } else {
            formik.handleSubmit(e);
        }
    };

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
                    <form id="client-form" onSubmit={handleFormSubmit} className="space-y-8">
                        {/* SECCIÓN 1: INFORMACIÓN PERSONAL */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 pb-2 border-b border-muted">
                                <User className="h-4 w-4 text-primary" />
                                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">INFORMACIÓN PERSONAL</h3>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                                <div className="md:col-span-3 space-y-2">
                                    <Label htmlFor="identificationType" className="text-xs font-semibold">TIPO DOCUMENTO</Label>
                                    <Select
                                        value={formik.values.identificationType}
                                        onValueChange={(val) => formik.setFieldValue("identificationType", val)}
                                    >
                                        <SelectTrigger className="bg-slate-50/50 h-11">
                                            <SelectValue placeholder="Seleccione tipo" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {ID_TYPES.map(type => (
                                                <SelectItem key={type.value} value={type.value}>
                                                    {type.label.toUpperCase()}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="md:col-span-5 space-y-2">
                                    <Label htmlFor="identificationNumber" className="text-xs font-semibold">N° IDENTIFICACIÓN</Label>
                                    <div className="relative">
                                        <Input
                                            id="identificationNumber"
                                            name="identificationNumber"
                                            value={formik.values.identificationNumber}
                                            onChange={(e) => {
                                                formik.setFieldValue("identificationNumber", e.target.value.toUpperCase());
                                            }}
                                            onBlur={formik.handleBlur}
                                            placeholder="Ej: 1723456789"
                                            className={cn(
                                                "bg-slate-50/50 font-mono uppercase h-11",
                                                formik.touched.identificationNumber && formik.errors.identificationNumber && "border-destructive ring-destructive/20"
                                            )}
                                        />
                                        <span className="absolute right-3 top-3.5 text-muted-foreground/30">
                                            <CreditCard className="h-4 w-4" />
                                        </span>
                                    </div>
                                    {formik.touched.identificationNumber && formik.errors.identificationNumber && (
                                        <p className="text-[10px] font-medium text-destructive mt-1">{formik.errors.identificationNumber}</p>
                                    )}
                                </div>

                                <div className="md:col-span-4 space-y-2">
                                    <Label htmlFor="identificationIssuanceDate" className="text-xs font-semibold">EXPEDICIÓN CÉDULA (OPCIONAL)</Label>
                                    <Input
                                        id="identificationIssuanceDate"
                                        type="date"
                                        {...formik.getFieldProps("identificationIssuanceDate")}
                                        className="bg-slate-50/50 h-11 uppercase"
                                    />
                                </div>

                                <div className="md:col-span-12 space-y-2">
                                    <Label htmlFor="firstName" className="text-xs font-semibold">NOMBRE COMPLETO DE LA EMPRESARIA</Label>
                                    <Input
                                        id="firstName"
                                        name="firstName"
                                        value={formik.values.firstName}
                                        onChange={(e) => {
                                            formik.setFieldValue("firstName", e.target.value.toUpperCase());
                                        }}
                                        onBlur={formik.handleBlur}
                                        placeholder="Nombre y Apellidos"
                                        className={cn(
                                            "bg-slate-50/50 uppercase h-11",
                                            formik.touched.firstName && formik.errors.firstName && "border-destructive ring-destructive/20"
                                        )}
                                    />
                                    {formik.touched.firstName && formik.errors.firstName && (
                                        <p className="text-[10px] font-medium text-destructive mt-1">{formik.errors.firstName}</p>
                                    )}
                                </div>

                                <div className="md:col-span-6 space-y-2">
                                    <Label htmlFor="birthDate" className="text-xs font-semibold">FECHA DE NACIMIENTO</Label>
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
                                                {differenceInYears(new Date(), new Date(formik.values.birthDate))} AÑOS
                                            </Badge>
                                        )}
                                    </div>
                                </div>

                                <div className="md:col-span-6 space-y-2">
                                    <Label htmlFor="referredById" className="text-xs font-semibold">REFERIDO POR (OPCIONAL)</Label>
                                    <Select
                                        value={formik.values.referredById || "none"}
                                        onValueChange={(val) => formik.setFieldValue("referredById", val === "none" ? "" : val)}
                                    >
                                        <SelectTrigger className="bg-slate-50/50 h-11">
                                            <SelectValue placeholder="Busque una empresaria..." />
                                        </SelectTrigger>
                                        <SelectContent searchable>
                                            <SelectItem value="none">-- SIN REFERIDO --</SelectItem>
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
                        {/* SECCIÓN NUEVA: ESTADO DE BLOQUEO */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 pb-2 border-b border-muted">
                                <AlertCircle className="h-4 w-4 text-primary" />
                                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">ESTADO DE CUENTA</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-1 bg-slate-50/30 p-4 rounded-xl border border-dashed">
                                <div className="flex items-center justify-between p-3 bg-white rounded-lg border shadow-sm">
                                    <div className="space-y-0.5">
                                        <div className="flex items-center gap-2">
                                            <Label htmlFor="isBlocked" className="text-xs font-bold text-destructive">BLOQUEAR EMPRESARIA</Label>
                                            {formik.values.isBlocked && <Badge variant="destructive" className="h-4 text-[8px] px-1 uppercase animate-pulse">Bloqueada</Badge>}
                                        </div>
                                        <p className="text-[10px] text-muted-foreground">Impide que la empresaria realice nuevos pedidos.</p>
                                    </div>
                                    <Switch
                                        id="isBlocked"
                                        checked={formik.values.isBlocked}
                                        onCheckedChange={(val) => formik.setFieldValue("isBlocked", val)}
                                        className="data-[state=checked]:bg-destructive"
                                    />
                                </div>
                            </div>
                        </section>

                        {/* SECCIÓN 2: UBICACIÓN Y DOMICILIO */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 pb-2 border-b border-muted">
                                <MapPin className="h-4 w-4 text-primary" />
                                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">UBICACIÓN Y DOMICILIO</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                                <div className="md:col-span-4 space-y-2">
                                    <Label htmlFor="country" className="text-xs font-semibold italic">PAÍS</Label>
                                    <Input 
                                        id="country" 
                                        name="country"
                                        value={formik.values.country}
                                        onChange={(e) => formik.setFieldValue("country", e.target.value.toUpperCase())}
                                        onBlur={formik.handleBlur}
                                        className="bg-slate-50/50 uppercase h-11" 
                                    />
                                </div>
                                <div className="md:col-span-4 space-y-2">
                                    <Label htmlFor="province" className="text-xs font-semibold">PROVINCIA</Label>
                                    <Select
                                        value={formik.values.province}
                                        onValueChange={(val) => {
                                            formik.setFieldValue("province", val);
                                            formik.setFieldValue("city", ""); // Reset city when province changes
                                        }}
                                    >
                                        <SelectTrigger className="bg-slate-50/50 uppercase h-11">
                                            <SelectValue placeholder="SELECCIONE PROVINCIA" />
                                        </SelectTrigger>
                                        <SelectContent searchable>
                                            {Object.keys(ECUADOR_DATA).sort().map(prov => (
                                                <SelectItem key={prov} value={prov}>{prov.toUpperCase()}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {formik.touched.province && formik.errors.province && (
                                        <p className="text-[10px] font-medium text-destructive mt-1">{formik.errors.province}</p>
                                    )}
                                </div>
                                <div className="md:col-span-4 space-y-2">
                                    <Label htmlFor="city" className="text-xs font-semibold">CIUDAD</Label>
                                    <Select
                                        value={formik.values.city}
                                        onValueChange={(val) => formik.setFieldValue("city", val)}
                                    >
                                        <SelectTrigger className="bg-slate-50/50 uppercase h-11" disabled={!formik.values.province}>
                                            <SelectValue placeholder={formik.values.province ? "SELECCIONE CIUDAD" : "PRIMERO ELIJA PROVINCIA"} />
                                        </SelectTrigger>
                                        <SelectContent searchable>
                                            {formik.values.province && ECUADOR_DATA[formik.values.province]?.sort().map(city => (
                                                <SelectItem key={city} value={city}>{city.toUpperCase()}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {formik.touched.city && formik.errors.city && (
                                        <p className="text-[10px] font-medium text-destructive mt-1">{formik.errors.city}</p>
                                    )}
                                </div>

                                <div className="md:col-span-6 space-y-2">
                                    <Label htmlFor="address" className="text-xs font-semibold">DIRECCIÓN DOMICILIARIA</Label>
                                    <Input 
                                        id="address" 
                                        name="address"
                                        value={formik.values.address}
                                        onChange={(e) => formik.setFieldValue("address", e.target.value.toUpperCase())}
                                        onBlur={formik.handleBlur}
                                        placeholder="Calle principal y secundaria, N°" 
                                        className="bg-slate-50/50 uppercase h-11" 
                                    />
                                </div>
                                <div className="md:col-span-3 space-y-2">
                                    <Label htmlFor="neighborhood" className="text-xs font-semibold">BARRIO / URBANIZACIÓN</Label>
                                    <Input 
                                        id="neighborhood" 
                                        name="neighborhood"
                                        value={formik.values.neighborhood}
                                        onChange={(e) => formik.setFieldValue("neighborhood", e.target.value.toUpperCase())}
                                        onBlur={formik.handleBlur}
                                        className="bg-slate-50/50 uppercase h-11" 
                                    />
                                </div>
                                <div className="md:col-span-3 space-y-2">
                                    <Label htmlFor="sector" className="text-xs font-semibold">SECTOR</Label>
                                    <Input 
                                        id="sector" 
                                        name="sector"
                                        value={formik.values.sector}
                                        onChange={(e) => formik.setFieldValue("sector", e.target.value.toUpperCase())}
                                        onBlur={formik.handleBlur}
                                        className="bg-slate-50/50 uppercase h-11" 
                                    />
                                </div>

                                <div className="md:col-span-12 space-y-2 text-area-like">
                                    <Label htmlFor="reference" className="text-xs font-semibold">REFERENCIA DE UBICACIÓN</Label>
                                    <Input 
                                        id="reference" 
                                        name="reference"
                                        value={formik.values.reference}
                                        onChange={(e) => formik.setFieldValue("reference", e.target.value.toUpperCase())}
                                        onBlur={formik.handleBlur}
                                        placeholder="Ej: Frente a la farmacia, casa color verde..." 
                                        className="bg-slate-50/50 uppercase h-11" 
                                     />
                                </div>
                            </div>
                        </section>

                        {/* SECCIÓN 3: CANALES DE CONTACTO */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 pb-2 border-b border-muted">
                                <PhoneIcon className="h-4 w-4 text-primary" />
                                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">CANALES DE CONTACTO</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                                <div className="md:col-span-12 space-y-2">
                                    <Label htmlFor="email" className="text-xs font-semibold uppercase">CORREO ELECTRÓNICO</Label>
                                    <div className="relative">
                                        <Input 
                                            id="email" 
                                            type="email" 
                                            {...formik.getFieldProps("email")} 
                                            placeholder="ejemplo@correo.com" 
                                            className="bg-slate-50/50 pl-10 h-11" 
                                        />
                                        <Mail className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground/50" />
                                    </div>
                                    {formik.touched.email && formik.errors.email && (
                                        <p className="text-[10px] font-medium text-destructive mt-1">{formik.errors.email}</p>
                                    )}
                                </div>

                                {/* Teléfono Principal */}
                                <div className="md:col-span-6 space-y-2">
                                    <Label className="text-xs font-semibold uppercase">TELÉFONO PRINCIPAL</Label>
                                    <div className="flex gap-2">
                                        <Input 
                                            id="phone1" 
                                            name="phone1"
                                            value={formik.values.phone1}
                                            onChange={(e) => formik.setFieldValue("phone1", e.target.value.toUpperCase())}
                                            onBlur={formik.handleBlur}
                                            placeholder="0998765432" 
                                            className="flex-1 bg-slate-50/50 uppercase h-11" 
                                        />
                                        <div className="w-32 shrink-0">
                                            <Select
                                                value={formik.values.operator1}
                                                onValueChange={(val) => formik.setFieldValue("operator1", val)}
                                            >
                                                <SelectTrigger className="bg-slate-50/50 h-11 uppercase">
                                                    <SelectValue placeholder="OPERADOR" />
                                                </SelectTrigger>
                                                <SelectContent side="top">
                                                    {OPERATORS.map(op => (
                                                        <SelectItem key={op} value={op}>{op}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 pt-1 h-8">
                                        <Switch
                                            id="isWhatsApp"
                                            checked={formik.values.isWhatsApp}
                                            onCheckedChange={(val) => formik.setFieldValue("isWhatsApp", val)}
                                        />
                                        <Label htmlFor="isWhatsApp" className="text-[10px] cursor-pointer flex items-center gap-1.5 font-bold text-slate-500 uppercase">
                                            <MessageSquare className={cn("h-3 w-3", formik.values.isWhatsApp ? "text-green-600" : "text-slate-400")} />
                                            VINCULAR CON WHATSAPP
                                        </Label>
                                    </div>
                                    {formik.touched.phone1 && formik.errors.phone1 && (
                                        <p className="text-[10px] font-medium text-destructive mt-1">{formik.errors.phone1}</p>
                                    )}
                                </div>

                                {/* Teléfono Secundario */}
                                <div className="md:col-span-6 space-y-2">
                                    <Label htmlFor="phone2" className="text-xs font-semibold uppercase">TELÉFONO SECUNDARIO (RESPALDOS)</Label>
                                    <div className="flex gap-2">
                                        <Input 
                                            id="phone2" 
                                            name="phone2"
                                            value={formik.values.phone2}
                                            onChange={(e) => formik.setFieldValue("phone2", e.target.value.toUpperCase())}
                                            onBlur={formik.handleBlur}
                                            placeholder="022123456" 
                                            className="flex-1 bg-slate-50/50 uppercase h-11" 
                                        />
                                        <div className="w-32 shrink-0">
                                            <Select
                                                value={formik.values.operator2 || "none"}
                                                onValueChange={(val) => formik.setFieldValue("operator2", val === "none" ? "" : val)}
                                            >
                                                <SelectTrigger className="bg-slate-50/50 h-11 uppercase">
                                                    <SelectValue placeholder="OPERADOR" />
                                                </SelectTrigger>
                                                <SelectContent side="top">
                                                    <SelectItem value="none">-- SIN ESPECIFICAR --</SelectItem>
                                                    {OPERATORS.map(op => (
                                                        <SelectItem key={op} value={op}>{op}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    {/* Spacer to maintain vertical alignment with Phone 1 */}
                                    <div className="h-8 pt-1" aria-hidden="true" />
                                    {formik.touched.phone2 && formik.errors.phone2 && (
                                        <p className="text-[10px] font-medium text-destructive mt-1">{formik.errors.phone2}</p>
                                    )}
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
                            CERRAR
                        </Button>
                        <AsyncButton 
                            form="client-form"
                            type="submit" 
                            isLoading={isSubmitting} 
                            loadingText="PROCESANDO..." 
                            className="flex-1 sm:flex-none px-8 uppercase text-[10px] font-bold tracking-widest shadow-lg shadow-primary/20"
                        >
                            {isEditing ? "ACTUALIZAR REGISTRO" : "REGISTRAR EMPRESARIA"}
                        </AsyncButton>
                    </div>
                </DialogFooter>
            </DialogContent>

            {/* Modal de Validación de Campos Faltantes */}
            <Dialog open={showValidationModal} onOpenChange={setShowValidationModal}>
                <DialogContent className="sm:max-w-[450px] max-h-[85vh] flex flex-col border-none shadow-2xl p-0 overflow-hidden transform-gpu transition-all">
                    <DialogHeader className="p-5 bg-gradient-to-r from-primary/5 via-primary/10 to-transparent border-b shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-primary/10 text-primary shadow-sm border border-primary/20">
                                <AlertCircle className="h-5 w-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-lg font-bold text-slate-800 tracking-tight">
                                    ¡Atención Requerida!
                                </DialogTitle>
                                <p className="text-[10px] text-primary font-bold uppercase tracking-widest mt-0.5">
                                    Campos Pendientes
                                </p>
                            </div>
                        </div>
                    </DialogHeader>
                    
                    <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar bg-slate-50/30">
                        <div className="p-4 bg-white rounded-xl border border-dashed border-primary/30 shadow-sm shadow-primary/5">
                             <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                                Para registrar a la empresaria, por favor asegúrese de completar correctamente los siguientes campos:
                            </p>
                        </div>
                        
                        <div className="space-y-3">
                            {missingFields.map((error, idx) => (
                                <div key={idx} className="flex items-center gap-3 p-3.5 bg-white rounded-xl border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] group hover:scale-[1.01] transition-all">
                                    <div className="h-2 w-2 rounded-full bg-primary/30 group-hover:bg-primary shrink-0" />
                                    <span className="text-[13px] font-bold text-slate-700 italic leading-snug">
                                        {error}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <DialogFooter className="p-5 bg-white border-t shrink-0">
                        <Button 
                            className="w-full bg-primary hover:bg-primary/90 text-white font-bold uppercase text-[11px] tracking-[1.5px] h-12 shadow-xl shadow-primary/20 transition-all hover:translate-y-[-1px] active:translate-y-[1px]"
                            onClick={() => setShowValidationModal(false)}
                        >
                            Entendido, iré a completar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Dialog>
    );
}
