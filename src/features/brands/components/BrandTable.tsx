import { Skeleton } from "@/shared/ui/skeleton"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/shared/ui/table"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Pencil, Trash2 } from "lucide-react"
import { Switch } from "@/shared/ui/switch"
import type { Brand } from "@/entities/brand/model/types"
import { useToggleBrandStatus } from "@/features/brands/api/hooks"

interface BrandTableProps {
    brands: Brand[]
    isLoading: boolean
    onEdit: (brand: Brand) => void
    onDelete: (brand: Brand) => void
}

export function BrandTable({ brands, isLoading, onEdit, onDelete }: BrandTableProps) {
    const toggleStatus = useToggleBrandStatus()

    if (isLoading) {
        return (
            <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
        )
    }

    if (brands.length === 0) {
        return <div className="p-8 text-center text-muted-foreground">No hay marcas registradas.</div>
    }

    return (
        <div className="rounded-md border overflow-hidden">
            <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="text-xs sm:text-sm whitespace-nowrap">Nombre</TableHead>
                        <TableHead className="text-xs sm:text-sm whitespace-nowrap">Estado</TableHead>
                        <TableHead className="text-xs sm:text-sm whitespace-nowrap">Creada</TableHead>
                        <TableHead className="text-right text-xs sm:text-sm whitespace-nowrap">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {brands.map((brand) => (
                        <TableRow key={brand.id}>
                            <TableCell className="font-medium text-xs sm:text-sm">
                                {brand.name}
                                {brand.description && (
                                    <span className="block text-[10px] sm:text-xs text-muted-foreground font-normal">{brand.description}</span>
                                )}
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        checked={brand.isActive}
                                        onCheckedChange={() => toggleStatus.mutate(brand.id)}
                                    />
                                    <Badge variant={brand.isActive ? "default" : "secondary"} className="text-xs whitespace-nowrap">
                                        {brand.isActive ? "Activa" : "Inactiva"}
                                    </Badge>
                                </div>
                            </TableCell>
                            <TableCell className="text-xs sm:text-sm whitespace-nowrap">
                                {new Date(brand.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-0.5 sm:gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => onEdit(brand)}
                                        className="h-7 w-7 sm:h-8 sm:w-8"
                                    >
                                        <Pencil className="h-3 w-3 sm:h-4 sm:w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50 h-7 w-7 sm:h-8 sm:w-8"
                                        onClick={() => onDelete(brand)}
                                    >
                                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            </div>
        </div>
    )
}
