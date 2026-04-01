import { useState, useEffect } from "react";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Settings2, MapPin, MessageSquare, Plus, Save, Trash2, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { Badge } from "@/shared/ui/badge";
import { useNotifications } from "@/shared/lib/notifications";
import { systemSettingsApi, type NoteTemplate } from "../api/systemSettingsApi";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/shared/ui/dialog";

export function SettingsPage() {
    const { notifySuccess, notifyError } = useNotifications();
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const [configs, setConfigs] = useState({
        location: "",
        phone: "",
        support_phone: "",
    });

    const [notes, setNotes] = useState<NoteTemplate[]>([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [settingsData, notesData] = await Promise.all([
                systemSettingsApi.getSettings(),
                systemSettingsApi.getNoteTemplates()
            ]);

            const configMap: any = { location: "", phone: "", support_phone: "" };
            settingsData.forEach(s => {
                if (configMap[s.key] !== undefined) {
                    configMap[s.key] = s.value;
                }
            });

            setConfigs(configMap);
            setNotes(notesData);
        } catch (error) {
            notifyError("Error al cargar configuraciones");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveConfigs = async () => {
        try {
            setIsSaving(true);
            await Promise.all([
                systemSettingsApi.updateSetting("location", configs.location),
                systemSettingsApi.updateSetting("phone", configs.phone),
                systemSettingsApi.updateSetting("support_phone", configs.support_phone),
            ]);
            notifySuccess("Configuraciones guardadas correctamente.");
        } catch (error) {
            notifyError("Error al guardar configuraciones");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteNote = async (id: string) => {
        if (!window.confirm("¿Está seguro de eliminar esta plantilla? Esta acción no se puede deshacer.")) return;
        try {
            await systemSettingsApi.deleteNote(id);
            notifySuccess("Plantilla eliminada correctamente");
            fetchData();
        } catch (error) {
            notifyError("Error al eliminar plantilla");
        }
    };

    const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
    const [editingNote, setEditingNote] = useState<Partial<NoteTemplate> | null>(null);

    const handleOpenNoteModal = (note?: NoteTemplate) => {
        setEditingNote(note || { title: "", content: "", isDefault: false, isActive: true });
        setIsNoteModalOpen(true);
    };

    const handleSaveNote = async () => {
        if (!editingNote?.title || !editingNote?.content) {
            notifyError("Título y contenido son obligatorios");
            return;
        }
        try {
            setIsSaving(true);
            await systemSettingsApi.upsertNote(editingNote);
            notifySuccess(editingNote.id ? "Plantilla actualizada" : "Plantilla creada");
            setIsNoteModalOpen(false);
            fetchData();
        } catch (error) {
            notifyError("Error al guardar plantilla");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader 
                title="Configuración del Sistema" 
                description="Gestione los datos que aparecen en los documentos y PDFs generados"
                icon={Settings2}
            />

            <Tabs defaultValue="general" className="w-full">
                <div className="w-full overflow-x-auto no-scrollbar -mx-1 px-1 mb-6">
                    <TabsList className="bg-white rounded-xl border border-slate-200 p-1 flex flex-nowrap gap-1 w-fit shadow-sm">
                        <TabsTrigger 
                            value="general" 
                            className="flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all duration-200 whitespace-nowrap data-[state=active]:bg-monchito-purple data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-monchito-purple/20 data-[state=inactive]:text-slate-500 data-[state=inactive]:hover:text-slate-800 data-[state=inactive]:hover:bg-slate-100"
                        >
                            Parámetros
                        </TabsTrigger>
                        <TabsTrigger 
                            value="notes" 
                            className="flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all duration-200 whitespace-nowrap data-[state=active]:bg-monchito-purple data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-monchito-purple/20 data-[state=inactive]:text-slate-500 data-[state=inactive]:hover:text-slate-800 data-[state=inactive]:hover:bg-slate-100"
                        >
                            Notimonchitos
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="general" className="space-y-4">
                    <Card className="border-none shadow-sm outline outline-1 outline-slate-200">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-black uppercase tracking-tight flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-primary" />
                                Ubicación y Contacto
                            </CardTitle>
                            <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                Establezca la información de cabecera de los PDFs
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Ubicación (Ciudad / País)</Label>
                                    <Input 
                                        value={configs.location}
                                        onChange={(e) => setConfigs({ ...configs, location: e.target.value })}
                                        placeholder="Ej: Quito - Ecuador" 
                                        className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white transition-all duration-300" 
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Teléfono Principal</Label>
                                        <Input 
                                            value={configs.phone}
                                            onChange={(e) => setConfigs({ ...configs, phone: e.target.value })}
                                            placeholder="Ej: 099 999 9999" 
                                            className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white transition-all duration-300" 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Teléfono Auxiliar</Label>
                                        <Input 
                                            value={configs.support_phone}
                                            onChange={(e) => setConfigs({ ...configs, support_phone: e.target.value })}
                                            placeholder="Ej: 02 2787237" 
                                            className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white transition-all duration-300" 
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <Button 
                                    onClick={handleSaveConfigs}
                                    disabled={isSaving}
                                    className="h-12 px-10 rounded-xl bg-monchito-purple hover:bg-monchito-purple/90 text-white font-black uppercase text-xs tracking-widest shadow-lg shadow-monchito-purple/20 transition-all duration-300 active:scale-95 disabled:opacity-70"
                                >
                                    <Save className="h-4 w-4 mr-2" />
                                    {isSaving ? "Guardando..." : "Guardar Cambios"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="notes" className="space-y-4">
                    <div className="flex justify-between items-center mb-2">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Plantillas de Notimonchitos</p>
                        <Button 
                            onClick={() => handleOpenNoteModal()}
                            variant="outline" 
                            className="h-9 border-slate-200 text-primary font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-slate-50 transition-all duration-300"
                        >
                            <Plus className="h-3 w-3 mr-2" /> Nueva Plantilla
                        </Button>
                    </div>

                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center p-12 space-y-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary border-r-2" />
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">Cargando plantillas...</p>
                        </div>
                    ) : (
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
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    onClick={() => handleDeleteNote(note.id)}
                                                    className="h-8 w-8 text-slate-400 hover:text-red-500"
                                                >
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
                                                onClick={async () => {
                                                    try {
                                                        await systemSettingsApi.upsertNote({ ...note, isDefault: true });
                                                        notifySuccess("Nota predeterminada establecida");
                                                        fetchData();
                                                    } catch (e) {
                                                        notifyError("Error al establecer predeterminada");
                                                    }
                                                }}
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
                    )}
                </TabsContent>
            </Tabs>

            {/* Note Modal */}
            <NoteModal 
                isOpen={isNoteModalOpen}
                onClose={() => setIsNoteModalOpen(false)}
                note={editingNote}
                onChange={(updated: any) => setEditingNote({ ...editingNote, ...updated })}
                onSave={handleSaveNote}
                isSaving={isSaving}
            />
        </div>
    );
}

// Reusing standard components correctly
function NoteModal({ isOpen, onClose, note, onChange, onSave, isSaving }: any) {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[500px] border-none shadow-2xl rounded-3xl p-0 overflow-hidden">
                <DialogHeader className="p-8 bg-slate-50/50 border-b">
                    <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                            <MessageSquare className="h-5 w-5 text-primary" />
                        </div>
                        {note?.id ? "Editar Notimonchito" : "Nuevo Notimonchito"}
                    </DialogTitle>
                </DialogHeader>
                
                <div className="p-8 space-y-6">
                    <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Título de la Plantilla</Label>
                        <Input 
                            value={note?.title || ""}
                            onChange={(e) => onChange({ title: e.target.value })}
                            placeholder="Ej: Nota de Entrega Especial"
                            className="h-12 rounded-2xl bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all duration-300 font-bold"
                        />
                    </div>
                    
                    <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Contenido de la Nota (PDF)</Label>
                        <textarea 
                            value={note?.content || ""}
                            onChange={(e) => onChange({ content: e.target.value })}
                            placeholder="Ingrese el texto que aparecerá en el pie de página de los pedidos..."
                            className="w-full min-h-[140px] p-4 text-sm font-bold text-slate-700 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all duration-300 resize-none shadow-inner"
                        />
                    </div>
                </div>

                <DialogFooter className="p-8 bg-slate-50/30 border-t gap-3">
                    <Button 
                        variant="ghost" 
                        onClick={onClose} 
                        className="h-12 px-6 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-100"
                    >
                        Cancelar
                    </Button>
                    <Button 
                        onClick={onSave} 
                        disabled={isSaving} 
                        className="h-12 px-10 rounded-2xl bg-monchito-purple hover:bg-monchito-purple/90 text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-monchito-purple/20 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {isSaving ? "Guardando..." : (note?.id ? "Actualizar Nota" : "Crear Plantilla")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default SettingsPage;
