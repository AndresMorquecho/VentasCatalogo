import { useState, useMemo } from "react"
import { useBrandList, useDeleteBrand } from "@/features/brands/api/hooks"
import { searchBrands } from "@/entities/brand/model/queries"
import type { Brand } from "@/entities/brand/model/types"
import { BrandTable } from "./BrandTable"
import { BrandForm } from "./BrandForm"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { AlertCircle, Plus, RotateCw, Search } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"
import { ConfirmDialog } from "@/shared/ui/confirm-dialog"
import { useAuth } from "@/shared/auth"
import { useToast } from "@/shared/ui/use-toast"

export function BrandList() {
    const { data: brands = [], isLoading, isError, refetch } = useBrandList()
    const deleteBrand = useDeleteBrand()
    const { hasPermission } = useAuth()
    const { showToast } = useToast()
    const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null)
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const [brandToDelete, setBrandToDelete] = useState<Brand | null>(null)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

    const filteredBrands = useMemo(
        () => searchBrands(brands, searchTerm),
        [brands, searchTerm]
    )

    const handleCreate = () => {
        if (!hasPermission('brands.create')) {
            showToast('No tienes permiso para crear marcas', 'error')
            return
        }
        setSelectedBrand(null)
        setIsFormOpen(true)
    }

    const handleEdit = (brand: Brand) => {
        if (!hasPermission('brands.edit')) {
            showToast('No tienes permiso para editar marcas', 'error')
            return
        }
        setSelectedBrand(brand)
        setIsFormOpen(true)
    }

    const handleDeleteClick = (brand: Brand) => {
        if (!hasPermission('brands.delete')) {
            showToast('No tienes permiso para eliminar marcas', 'error')
            return
        }
        setBrandToDelete(brand)
        setIsDeleteDialogOpen(true)
    }

    const handleConfirmDelete = async () => {
        if (!hasPermission('brands.delete')) {
            showToast('No tienes permiso para eliminar marcas', 'error')
            return
        }
        if (!brandToDelete) return
        try {
            await deleteBrand.mutateAsync(brandToDelete.id)
            setBrandToDelete(null)
        } catch (error) {
            console.error("Error deleting brand", error)
        }
    }

    if (isError) {
        return (
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold tracking-tight">Listado de Marcas</h2>
                </div>
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription className="flex items-center justify-between">
                        <span>Ocurrió un error al cargar las marcas.</span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => refetch()}
                            className="bg-background text-foreground hover:bg-accent border-destructive/50"
                        >
                            <RotateCw className="mr-2 h-3 w-3" />
                            Reintentar
                        </Button>
                    </AlertDescription>
                </Alert>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold tracking-tight">Listado de Marcas</h2>
                <Button onClick={handleCreate}>
                    <Plus className="mr-2 h-4 w-4" /> Nueva Marca
                </Button>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar por nombre o descripción..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                />
            </div>

            <BrandTable
                brands={filteredBrands}
                isLoading={isLoading}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
            />

            <BrandForm
                brand={selectedBrand}
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
            />

            <ConfirmDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                onConfirm={handleConfirmDelete}
                title="Eliminar Marca"
                description={`¿Está seguro de eliminar la marca "${brandToDelete?.name}"? Esta acción no se puede deshacer si no tiene pedidos asociados.`}
                confirmText="Eliminar"
                variant="destructive"
            />
        </div>
    )
}
