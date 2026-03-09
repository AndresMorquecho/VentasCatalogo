import { useState, useEffect } from "react"
import { useBrandList, useDeleteBrand } from "@/features/brands/api/hooks"
import type { Brand } from "@/entities/brand/model/types"
import { BrandTable } from "./BrandTable"
import { BrandForm } from "./BrandForm"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { AlertCircle, Plus, RotateCw, Search } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"
import { ConfirmDialog } from "@/shared/ui/confirm-dialog"
import { useAuth } from "@/shared/auth"
import { logAction } from "@/shared/lib/auditService"
import { useNotifications } from "@/shared/lib/notifications"
import { useDebounce } from "@/shared/lib/hooks"
import { Pagination } from "@/shared/ui/pagination"

export function BrandList() {
    const [page, setPage] = useState(1)
    const [limit] = useState(25)
    const [searchTerm, setSearchTerm] = useState("")
    const debouncedSearch = useDebounce(searchTerm, 1000)

    const { data: response, isLoading, isError, refetch } = useBrandList({
        page,
        limit,
        search: debouncedSearch.length >= 3 ? debouncedSearch : undefined,
    })

    const brands = response?.data || []
    const pagination = response?.pagination

    const deleteBrand = useDeleteBrand()
    const { hasPermission, user } = useAuth()
    const { notifySuccess, notifyError } = useNotifications()
    const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null)
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [brandToDelete, setBrandToDelete] = useState<Brand | null>(null)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

    // Reset page on filter change
    useEffect(() => {
        setPage(1)
    }, [debouncedSearch])


    const handleCreate = () => {
        if (!hasPermission('brands.create')) {
            notifyError({ message: 'No tienes permiso para crear marcas' })
            return
        }
        setSelectedBrand(null)
        setIsFormOpen(true)
    }

    const handleEdit = (brand: Brand) => {
        if (!hasPermission('brands.edit')) {
            notifyError({ message: 'No tienes permiso para editar marcas' })
            return
        }
        setSelectedBrand(brand)
        setIsFormOpen(true)
    }

    const handleDeleteClick = (brand: Brand) => {
        if (!hasPermission('brands.delete')) {
            notifyError({ message: 'No tienes permiso para eliminar marcas' })
            return
        }
        setBrandToDelete(brand)
        setIsDeleteDialogOpen(true)
    }

    const handleConfirmDelete = async () => {
        if (!hasPermission('brands.delete')) {
            notifyError({ message: 'No tienes permiso para eliminar marcas' })
            return
        }
        if (!brandToDelete) return
        try {
            await deleteBrand.mutateAsync(brandToDelete.id)
            if (user) {
                logAction({
                    userId: user.id,
                    userName: user.username,
                    action: 'DELETE_BRAND',
                    module: 'brands',
                    detail: `Eliminó marca: ${brandToDelete.name}`
                });
            }
            notifySuccess(`Marca "${brandToDelete.name}" eliminada correctamente`)
            setBrandToDelete(null)
            setIsDeleteDialogOpen(false)
        } catch (error) {
            notifyError(error, "No se pudo eliminar la marca")
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
                brands={brands}
                isLoading={isLoading}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
            />

            <BrandForm
                brand={selectedBrand}
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
            />

            {pagination && (
                <Pagination
                    currentPage={page}
                    totalPages={pagination.pages}
                    onPageChange={setPage}
                    totalItems={pagination.total}
                    itemsPerPage={limit}
                />
            )}

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

