import { useState, useEffect } from "react";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Settings2, MessageSquare, Plus, Trash2, CheckCircle2, ListTree, Share2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Badge } from "@/shared/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { useNotifications } from "@/shared/lib/notifications";
import { systemSettingsApi, type NoteTemplate, type OrderType, type SalesChannel } from "../api/systemSettingsApi";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/shared/ui/dialog";
import { useAuth } from "@/shared/auth";

export function SettingsPage() {
    const { hasPermission } = useAuth();
    const { notifySuccess, notifyError } = useNotifications();
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const [notes, setNotes] = useState<NoteTemplate[]>([]);
    const [orderTypes, setOrderTypes] = useState<OrderType[]>([]);
    const [salesChannels, setSalesChannels] = useState<SalesChannel[]>([]);

    const [deleteItem, setDeleteItem] = useState<{ id: string, type: 'note' | 'orderType' | 'salesChannel' } | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [notesData, orderTypesData, salesChannelsData] = await Promise.all([
                systemSettingsApi.getNoteTemplates(),
                systemSettingsApi.getOrderTypes(),
                systemSettingsApi.getSalesChannels()
            ]);
            setNotes(notesData);
            setOrderTypes(orderTypesData);
            setSalesChannels(salesChannelsData);
        } catch (error) {
            notifyError("Error al cargar configuraciones");
        } finally {
            setIsLoading(false);
        }
    };

    const confirmDelete = async () => {
        if (!deleteItem) return;
        
        try {
            setIsSaving(true);
            if (deleteItem.type === 'note') {
                if (!hasPermission('system_config.delete_notimonchito')) {
                    notifyError("No tienes permiso");
                    return;
                }
                await systemSettingsApi.deleteNote(deleteItem.id);
            } else if (deleteItem.type === 'orderType') {
                await systemSettingsApi.deleteOrderType(deleteItem.id);
            } else if (deleteItem.type === 'salesChannel') {
                await systemSettingsApi.deleteSalesChannel(deleteItem.id);
            }
            
            notifySuccess("Eliminado correctamente");
            setDeleteItem(null);
            fetchData();
        } catch (error: any) {
            notifyError(error.message || "Error al eliminar");
        } finally {
            setIsSaving(false);
        }
    };

    // Note Modal State
    const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
    const [editingNote, setEditingNote] = useState<Partial<NoteTemplate> | null>(null);

    // Order Type Modal State
    const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
    const [editingType, setEditingType] = useState<Partial<OrderType> | null>(null);

    // Sales Channel Modal State
    const [isChannelModalOpen, setIsChannelModalOpen] = useState(false);
    const [editingChannel, setEditingChannel] = useState<Partial<SalesChannel> | null>(null);

    return (
        <div className="space-y-6">
            <PageHeader 
                title="Configuración del Sistema" 
                description="Gestione los datos maestros y plantillas del sistema"
                icon={Settings2}
            />

            <Tabs defaultValue="notimonchitos" className="w-full">
                <TabsList className="bg-slate-100 p-1 rounded-2xl mb-6">
                    <TabsTrigger value="notimonchitos" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm font-black uppercase text-[10px] tracking-widest px-6 py-2.5">
                        <MessageSquare className="h-3.5 w-3.5 mr-2" /> Notimonchitos
                    </TabsTrigger>
                    <TabsTrigger value="order-types" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm font-black uppercase text-[10px] tracking-widest px-6 py-2.5">
                        <ListTree className="h-3.5 w-3.5 mr-2" /> Tipos de Pedido
                    </TabsTrigger>
                    <TabsTrigger value="sales-channels" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm font-black uppercase text-[10px] tracking-widest px-6 py-2.5">
                        <Share2 className="h-3.5 w-3.5 mr-2" /> Canales de Venta
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="notimonchitos" className="space-y-4 outline-none">
                    <div className="flex justify-between items-center mb-2">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Plantillas de Notimonchitos</p>
                        <Button 
                            onClick={() => {
                                if (!hasPermission('system_config.create_notimonchito')) {
                                    notifyError("No tienes permiso");
                                    return;
                                }
                                setEditingNote({ title: "", content: "", isDefault: false, isActive: true });
                                setIsNoteModalOpen(true);
                            }}
                            variant="outline" 
                            className="h-9 border-slate-200 text-primary font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-slate-50 transition-all duration-300"
                        >
                            <Plus className="h-3 w-3 mr-2" /> Nueva Plantilla
                        </Button>
                    </div>

                    {isLoading ? <LoadingSpinner /> : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {notes.map((note) => (
                                <NoteCard 
                                    key={note.id} 
                                    note={note} 
                                    onEdit={(n: NoteTemplate) => {
                                        if (!hasPermission('system_config.edit_notimonchito')) {
                                            notifyError("No tienes permiso");
                                            return;
                                        }
                                        setEditingNote(n);
                                        setIsNoteModalOpen(true);
                                    }}
                                    onDelete={(id: string) => setDeleteItem({ id, type: 'note' })}
                                    onSetDefault={async (n: NoteTemplate) => {
                                        try {
                                            await systemSettingsApi.upsertNote({ ...n, isDefault: true });
                                            notifySuccess("Predeterminada establecida");
                                            fetchData();
                                        } catch (e) { notifyError("Error"); }
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="order-types" className="space-y-4 outline-none">
                    <div className="flex justify-between items-center mb-2">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Gestión de Tipos de Pedido</p>
                        <Button 
                            onClick={() => {
                                setEditingType({ name: "", description: "", isActive: true });
                                setIsTypeModalOpen(true);
                            }}
                            variant="outline" 
                            className="h-9 border-slate-200 text-primary font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-slate-50 transition-all duration-300"
                        >
                            <Plus className="h-3 w-3 mr-2" /> Nuevo Tipo
                        </Button>
                    </div>

                    {isLoading ? <LoadingSpinner /> : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {orderTypes.map((type) => (
                                <SimpleCard 
                                    key={type.id} 
                                    title={type.name} 
                                    description={type.description} 
                                    isActive={type.isActive}
                                    isSystem={type.isSystem}
                                    onEdit={() => {
                                        setEditingType(type);
                                        setIsTypeModalOpen(true);
                                    }}
                                    onDelete={() => setDeleteItem({ id: type.id, type: 'orderType' })}
                                />
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="sales-channels" className="space-y-4 outline-none">
                    <div className="flex justify-between items-center mb-2">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Gestión de Canales de Venta</p>
                        <Button 
                            onClick={() => {
                                setEditingChannel({ name: "", description: "", isActive: true });
                                setIsChannelModalOpen(true);
                            }}
                            variant="outline" 
                            className="h-9 border-slate-200 text-primary font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-slate-50 transition-all duration-300"
                        >
                            <Plus className="h-3 w-3 mr-2" /> Nuevo Canal
                        </Button>
                    </div>

                    {isLoading ? <LoadingSpinner /> : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {salesChannels.map((channel) => (
                                <SimpleCard 
                                    key={channel.id} 
                                    title={channel.name} 
                                    description={channel.description} 
                                    isActive={channel.isActive}
                                    onEdit={() => {
                                        setEditingChannel(channel);
                                        setIsChannelModalOpen(true);
                                    }}
                                    onDelete={() => setDeleteItem({ id: channel.id, type: 'salesChannel' })}
                                />
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* Modals and Delete Dialog */}
            <NoteModal 
                isOpen={isNoteModalOpen} 
                onClose={() => setIsNoteModalOpen(false)} 
                note={editingNote} 
                onSave={async (data: any) => {
                    try {
                        setIsSaving(true);
                        await systemSettingsApi.upsertNote(data);
                        notifySuccess("Guardado");
                        setIsNoteModalOpen(false);
                        fetchData();
                    } catch (e) { notifyError("Error"); } finally { setIsSaving(false); }
                }}
                isSaving={isSaving}
            />

            <GenericModal 
                isOpen={isTypeModalOpen}
                onClose={() => setIsTypeModalOpen(false)}
                title={editingType?.id ? "Editar Tipo de Pedido" : "Nuevo Tipo de Pedido"}
                data={editingType}
                onSave={async (data: any) => {
                    try {
                        setIsSaving(true);
                        await systemSettingsApi.upsertOrderType(data);
                        notifySuccess("Guardado");
                        setIsTypeModalOpen(false);
                        fetchData();
                    } catch (e) { notifyError("Error"); } finally { setIsSaving(false); }
                }}
                isSaving={isSaving}
            />

            <GenericModal 
                isOpen={isChannelModalOpen}
                onClose={() => setIsChannelModalOpen(false)}
                title={editingChannel?.id ? "Editar Canal" : "Nuevo Canal"}
                data={editingChannel}
                onSave={async (data: any) => {
                    try {
                        setIsSaving(true);
                        await systemSettingsApi.upsertSalesChannel(data);
                        notifySuccess("Guardado");
                        setIsChannelModalOpen(false);
                        fetchData();
                    } catch (e) { notifyError("Error"); } finally { setIsSaving(false); }
                }}
                isSaving={isSaving}
            />

            <DeleteConfirmationDialog 
                isOpen={!!deleteItem} 
                onClose={() => setDeleteItem(null)} 
                onConfirm={confirmDelete}
                isSaving={isSaving}
            />
        </div>
    );
}

function LoadingSpinner() {
    return (
        <div className="flex flex-col items-center justify-center p-12 space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary border-r-2" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">Cargando...</p>
        </div>
    );
}

function NoteCard({ note, onEdit, onDelete, onSetDefault }: any) {
    return (
        <Card className={`border-none shadow-sm outline outline-1 transition-all duration-300 hover:scale-[1.01] hover:shadow-xl hover:shadow-primary/5 ${note.isDefault ? 'outline-primary ring-4 ring-primary/5' : 'outline-slate-200'}`}>
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-2">
                        <CardTitle className="text-sm font-black uppercase tracking-tight flex items-center gap-2 cursor-pointer hover:text-primary transition-colors" onClick={() => onEdit(note)}>
                            <div className="p-1.5 rounded-lg bg-slate-100 group-hover:bg-primary/10 transition-colors">
                                <MessageSquare className="h-3.5 w-3.5 text-slate-400 group-hover:text-primary" />
                            </div>
                            {note.title}
                        </CardTitle>
                        <div className="flex gap-2">
                            {note.isDefault && (
                                <Badge className="bg-primary hover:bg-primary text-white font-black text-[8px] uppercase tracking-tighter rounded-md h-4 px-1.5 border-none animate-pulse">
                                    Predeterminado
                                </Badge>
                            )}
                            <Badge variant="outline" className={`font-black text-[8px] uppercase tracking-tighter rounded-md h-4 px-1.5 border-none ${note.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                {note.isActive ? "Activo" : "Inactivo"}
                            </Badge>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => onDelete(note.id)} className="h-8 w-8 text-slate-300 hover:text-red-500 transition-colors"><Trash2 className="h-4 w-4" /></Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100 min-h-[80px] shadow-inner">
                    <p className="text-xs font-medium text-slate-600 italic leading-relaxed">"{note.content}"</p>
                </div>
                {!note.isDefault ? (
                    <Button variant="ghost" onClick={() => onSetDefault(note)} className="w-full text-primary hover:text-primary hover:bg-primary/5 font-black uppercase text-[9px] tracking-widest h-9 rounded-xl transition-all">Establecer como predeterminado</Button>
                ) : (
                    <div className="flex items-center justify-center gap-2 h-9 text-emerald-600 bg-emerald-50 rounded-xl border border-emerald-100/50"><CheckCircle2 className="h-3 w-3" /><span className="text-[9px] font-black uppercase tracking-widest">Activo en PDF</span></div>
                )}
            </CardContent>
        </Card>
    );
}

function SimpleCard({ title, description, isActive, isSystem, onEdit, onDelete }: any) {
    return (
        <Card className="border-none shadow-sm outline outline-1 outline-slate-200 hover:outline-primary/40 hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 group bg-white rounded-2xl overflow-hidden">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <CardTitle className="text-sm font-black uppercase tracking-tight group-hover:text-primary transition-colors cursor-pointer" onClick={onEdit}>{title}</CardTitle>
                    <div className="flex gap-1">
                        {isSystem ? (
                            <Badge className="bg-slate-100 text-slate-500 font-black text-[8px] uppercase tracking-tighter rounded-md h-5 px-1.5 border-none">Sistema</Badge>
                        ) : (
                            <Button variant="ghost" size="icon" onClick={onDelete} className="h-7 w-7 text-slate-200 hover:text-red-500 transition-colors"><Trash2 className="h-3.5 w-3.5" /></Button>
                        )}
                    </div>
                </div>
                <CardDescription className="text-[10px] font-bold text-slate-400 line-clamp-1">{description || "Sin descripción"}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className={`inline-flex items-center gap-2 px-2 py-0.5 rounded-full ${isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'} border ${isActive ? 'border-emerald-100' : 'border-slate-100'}`}>
                    <div className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                    <span className="text-[8px] font-black uppercase tracking-widest">{isActive ? "Activo" : "Inactivo"}</span>
                </div>
            </CardContent>
        </Card>
    );
}

function NoteModal({ isOpen, onClose, note, onSave, isSaving }: any) {
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");

    useEffect(() => {
        if (note) {
            setTitle(note.title || "");
            setContent(note.content || "");
        }
    }, [note]);

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
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Título</Label>
                        <Input value={title} onChange={(e) => setTitle(e.target.value)} className="h-12 rounded-2xl bg-slate-50 border-slate-200 font-bold" />
                    </div>
                    <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Contenido</Label>
                        <textarea value={content} onChange={(e) => setContent(e.target.value)} className="w-full min-h-[140px] p-4 text-sm font-bold text-slate-700 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/10 resize-none shadow-inner" />
                    </div>
                </div>
                <DialogFooter className="p-8 bg-slate-50/30 border-t gap-3 flex flex-row justify-end">
                    <Button variant="ghost" onClick={onClose} className="h-12 px-6 rounded-2xl font-black uppercase text-[10px] tracking-widest">Cancelar</Button>
                    <Button onClick={() => onSave({ ...note, title, content })} disabled={isSaving} className="h-12 px-10 rounded-2xl bg-monchito-purple text-white font-black uppercase text-[10px] tracking-widest">{isSaving ? "Guardando..." : "Guardar"}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function GenericModal({ isOpen, onClose, title, data, onSave, isSaving }: any) {
    const [name, setName] = useState("");
    const [desc, setDesc] = useState("");
    const [active, setActive] = useState(true);

    useEffect(() => {
        if (data) {
            setName(data.name || "");
            setDesc(data.description || "");
            setActive(data.isActive !== false);
        }
    }, [data]);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[450px] border-none shadow-2xl rounded-3xl p-0 overflow-hidden">
                <DialogHeader className="p-8 bg-slate-50/50 border-b">
                    <DialogTitle className="text-xl font-black uppercase tracking-tight">{title}</DialogTitle>
                </DialogHeader>
                <div className="p-8 space-y-6">
                    <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nombre</Label>
                        <Input value={name} onChange={(e) => setName(e.target.value)} disabled={data?.isSystem} className="h-12 rounded-2xl bg-slate-50 border-slate-200 font-bold" />
                    </div>
                    <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Descripción</Label>
                        <Input value={desc} onChange={(e) => setDesc(e.target.value)} className="h-12 rounded-2xl bg-slate-50 border-slate-200 font-bold" />
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary" />
                        <Label className="text-xs font-bold text-slate-600">Elemento Activo</Label>
                    </div>
                </div>
                <DialogFooter className="p-8 bg-slate-50/30 border-t gap-3 flex flex-row justify-end">
                    <Button variant="ghost" onClick={onClose} className="h-12 px-6 rounded-2xl font-black uppercase text-[10px] tracking-widest">Cancelar</Button>
                    <Button onClick={() => onSave({ ...data, name, description: desc, isActive: active })} disabled={isSaving} className="h-12 px-10 rounded-2xl bg-monchito-purple text-white font-black uppercase text-[10px] tracking-widest">Guardar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function DeleteConfirmationDialog({ isOpen, onClose, onConfirm, isSaving }: any) {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[400px] border-none shadow-2xl rounded-3xl p-0 overflow-hidden">
                <DialogHeader className="p-8 bg-red-50 border-b">
                    <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-3 text-red-600">
                        <div className="h-10 w-10 rounded-2xl bg-red-100 flex items-center justify-center"><Trash2 className="h-5 w-5 text-red-600" /></div>
                        Confirmar Eliminación
                    </DialogTitle>
                </DialogHeader>
                <div className="p-8"><p className="text-sm font-bold text-slate-600">¿Está seguro de eliminar este elemento? Esta acción no se puede deshacer.</p></div>
                <DialogFooter className="p-8 bg-slate-50/30 border-t gap-3 flex flex-row justify-end">
                    <Button variant="ghost" onClick={onClose} className="h-12 px-6 rounded-2xl font-black uppercase text-[10px] tracking-widest">Cancelar</Button>
                    <Button onClick={onConfirm} disabled={isSaving} className="h-12 px-10 rounded-2xl bg-red-500 text-white font-black uppercase text-[10px] tracking-widest">{isSaving ? "Eliminando..." : "Sí, Eliminar"}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default SettingsPage;
