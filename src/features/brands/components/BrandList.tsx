import { useState, useMemo } from "react"
import { useBrandList, useDeleteBrand } from "@/features/brands/api/hooks"
import { searchBrands } from "@/entities/brand/model/queries"
import type { Brand } from "@/entities/brand/model/types"
import { BrandTable } from "./BrandTable"
import { BrandForm } from "./BrandForm"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Plus, Search, Tag } from "lucide-react"
import { ConfirmDialog } from "@/shared/ui/confirm-dialog"
import { useAuth } from "@/shared/auth"
import { useToast } from "@/shared/ui/use-toast"
import { PageHeader } from "@/shared/ui/PageHeader"

export function BrandList() {
    const { data: brands = [], isLoading, isError } = useBrandList()
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
        showToast("Error al cargar las marcas", "error")
    }

    return (
        <div className="space-y-4 min-w-0 max-w-full overflow-hidden">
            <PageHeader
                title="Marcas"
                description="Gestión y catálogo de marcas comerciales disponibles en el sistema."
                icon={Tag}
            />

            <div className="flex flex-col md:flex-row md:items-center justify-end gap-3 py-2">
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Buscar marca o descripción..."
                        className="pl-9 bg-white border-slate-200 focus:ring-monchito-purple/20 transition-all shadow-sm rounded-xl h-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button
                    onClick={handleCreate}
                    className="gap-2 bg-monchito-purple hover:bg-monchito-purple-dark text-white h-10 px-4 rounded-xl text-sm font-semibold shadow-sm transition-all shrink-0 w-full md:w-auto"
                >
                    <Plus className="h-4 w-4" /> Nueva Marca
                </Button>
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
