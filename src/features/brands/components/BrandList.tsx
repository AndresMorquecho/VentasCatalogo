import { useState } from "react"
import { useBrandList } from "@/entities/brand/model/hooks"
import type { Brand } from "@/entities/brand/model/types"
import { BrandTable } from "./BrandTable"
import { BrandForm } from "./BrandForm"
import { Button } from "@/shared/ui/button"
import { AlertCircle, Plus, RotateCw } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"

export function BrandList() {
    const { data: brands = [], isLoading, isError, refetch } = useBrandList()
    const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null)
    const [isFormOpen, setIsFormOpen] = useState(false)

    const handleCreate = () => {
        setSelectedBrand(null)
        setIsFormOpen(true)
    }

    const handleEdit = (brand: Brand) => {
        setSelectedBrand(brand)
        setIsFormOpen(true)
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

            <BrandTable
                brands={brands}
                isLoading={isLoading}
                onEdit={handleEdit}
            />

            <BrandForm
                brand={selectedBrand}
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
            />
        </div>
    )
}
