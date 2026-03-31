import { useState } from "react";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Settings2, MapPin, MessageSquare, Plus, Save, Trash2, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { Badge } from "@/shared/ui/badge";
import { useNotifications } from "@/shared/lib/notifications";

export function SettingsPage() {
    const { notifySuccess } = useNotifications();
    const [isSaving, setIsSaving] = useState(false);

    // Mock data for now
    const [configs, setConfigs] = useState({
        location: "Quito - Ecuador",
        phone: "099 999 9999",
        support_phone: "2787237",
    });

    const [notes] = useState([
        { id: "1", title: "Nota General", content: "Todos los pedidos serán ingresados con el 50% caso contrario no se realizará.", isDefault: true, isActive: true },
        { id: "2", title: "Nota Retiro", content: "Pedido que no sea retirado dentro de los 10 días será desmantelado y pierde el abono.", isDefault: false, isActive: true },
    ]);

    const handleSaveConfigs = () => {
        setIsSaving(true);
        setTimeout(() => {
            setIsSaving(false);
            notifySuccess("Configuraciones guardadas correctamente.");
        }, 800);
    };

    return (
        <div className="space-y-6">
            <PageHeader 
                title="Configuración del Sistema" 
                description="Gestione los datos que aparecen en los documentos y PDFs generados"
                icon={Settings2}
            />

            <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px] mb-6">
                    <TabsTrigger value="general">Parámetros</TabsTrigger>
                    <TabsTrigger value="notes">Notimonchitos</TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="border-none shadow-sm outline outline-1 outline-slate-200 overflow-hidden">
                            <CardHeader className="bg-slate-50/50 border-b pb-4">
                                <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-primary" />
                                    <CardTitle className="text-sm font-black uppercase tracking-tight">Ubicación y Contacto</CardTitle>
                                </div>
                                <CardDescription className="text-[10px] font-bold uppercase opacity-70 tracking-wider">
                                    Establezca la información de cabecera de los PDFs
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-500 opacity-70">Ubicación (Ciudad/País)</Label>
                                    <Input 
                                        value={configs.location} 
                                        onChange={(e) => setConfigs({ ...configs, location: e.target.value })}
                                        className="font-bold text-slate-700 bg-slate-50/30"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-slate-500 opacity-70">Teléfono Principal</Label>
                                        <Input 
                                            value={configs.phone} 
                                            onChange={(e) => setConfigs({ ...configs, phone: e.target.value })}
                                            className="font-bold text-slate-700 bg-slate-50/30 font-mono"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-slate-500 opacity-70">Teléfono Auxiliar</Label>
                                        <Input 
                                            value={configs.support_phone} 
                                            onChange={(e) => setConfigs({ ...configs, support_phone: e.target.value })}
                                            className="font-bold text-slate-700 bg-slate-50/30 font-mono"
                                        />
                                    </div>
                                </div>
                                <div className="pt-4 flex justify-end">
                                    <Button 
                                        onClick={handleSaveConfigs} 
                                        disabled={isSaving}
                                        className="bg-slate-800 hover:bg-slate-900 text-white font-black uppercase text-[10px] tracking-widest h-11 px-8 rounded-xl shadow-lg"
                                    >
                                        {isSaving ? "Guardando..." : <><Save className="h-4 w-4 mr-2" /> Guardar Cambios</>}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm outline outline-1 outline-slate-200 overflow-hidden opacity-50 pointer-events-none">
                            <CardHeader className="bg-slate-50/50 border-b pb-4">
                                <div className="flex items-center gap-2">
                                    <Settings2 className="h-4 w-4 text-primary" />
                                    <CardTitle className="text-sm font-black uppercase tracking-tight">Otros Ajustes</CardTitle>
                                </div>
                                <CardDescription className="text-[10px] font-bold uppercase opacity-70 tracking-wider">
                                    Configuraciones avanzadas del sistema
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <p className="text-xs font-bold text-slate-400 italic">Módulo en desarrollo...</p>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="notes" className="space-y-4">
                    <div className="flex justify-between items-center mb-2">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Plantillas de Notimonchitos</p>
                        <Button variant="outline" className="h-9 border-slate-200 text-primary font-black uppercase text-[10px] tracking-widest rounded-xl">
                            <Plus className="h-3 w-3 mr-2" /> Nueva Plantilla
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {notes.map((note) => (
                            <Card key={note.id} className={`border-none shadow-sm outline outline-1 transition-all ${note.isDefault ? 'outline-primary ring-4 ring-primary/5' : 'outline-slate-200'}`}>
                                <CardHeader className="pb-3">
                                    <div className="flex justify-between items-start">
                                        <div className="flex flex-col gap-2">
                                            <CardTitle className="text-sm font-black uppercase tracking-tight flex items-center gap-2">
                                                <MessageSquare className="h-4 w-4 text-slate-400" />
                                                {note.title}
                                            </CardTitle>
                                            <div className="flex gap-2">
                                                {note.isDefault && (
                                                    <Badge className="bg-primary hover:bg-primary text-white font-black text-[8px] uppercase tracking-tighter rounded-md h-4 px-1.5 border-none">
                                                        Predeterminado
                                                    </Badge>
                                                )}
                                                <Badge variant="outline" className="font-black text-[8px] uppercase tracking-tighter rounded-md h-4 px-1.5 border-slate-200 text-slate-400">
                                                    {note.isActive ? "Activo" : "Inactivo"}
                                                </Badge>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 min-h-[80px]">
                                        <p className="text-xs font-medium text-slate-600 italic">"{note.content}"</p>
                                    </div>
                                    
                                    {!note.isDefault && (
                                        <Button 
                                            variant="ghost" 
                                            className="w-full text-primary hover:text-primary hover:bg-primary/5 font-black uppercase text-[9px] tracking-widest h-9"
                                        >
                                            Establecer como predeterminado
                                        </Button>
                                    )}
                                    {note.isDefault && (
                                        <div className="flex items-center justify-center gap-2 h-9 text-emerald-500 bg-emerald-50 rounded-lg">
                                            <CheckCircle2 className="h-3 w-3" />
                                            <span className="text-[9px] font-black uppercase tracking-widest">Activo en PDF</span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

export default SettingsPage;
