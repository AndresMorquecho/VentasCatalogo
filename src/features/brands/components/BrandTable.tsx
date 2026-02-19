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
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Creada</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {brands.map((brand) => (
                        <TableRow key={brand.id}>
                            <TableCell className="font-medium">
                                {brand.name}
                                {brand.description && (
                                    <span className="block text-xs text-muted-foreground font-normal">{brand.description}</span>
                                )}
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        checked={brand.isActive}
                                        onCheckedChange={() => toggleStatus.mutate(brand.id)}
                                    />
                                    <Badge variant={brand.isActive ? "default" : "secondary"}>
                                        {brand.isActive ? "Activa" : "Inactiva"}
                                    </Badge>
                                </div>
                            </TableCell>
                            <TableCell>
                                {new Date(brand.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => onEdit(brand)}
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                        onClick={() => onDelete(brand)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
