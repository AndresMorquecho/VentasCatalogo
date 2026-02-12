import { useFormik } from "formik"
import * as Yup from "yup"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/shared/ui/dialog"
import { Input } from "@/shared/ui/input"
import { Button } from "@/shared/ui/button"
import { Label } from "@/shared/ui/label"
import { Switch } from "@/shared/ui/switch"
import type { Brand } from "@/entities/brand/model/types"
import { useCreateBrand, useUpdateBrand } from "@/entities/brand/model/hooks"

interface BrandFormProps {
    brand?: Brand | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

const validationSchema = Yup.object({
    name: Yup.string().required("El nombre es requerido"),
    description: Yup.string().optional(),
    isActive: Yup.boolean().default(true),
})

export function BrandForm({ brand, open, onOpenChange }: BrandFormProps) {
    const createBrand = useCreateBrand()
    const updateBrand = useUpdateBrand()
    const isEditing = !!brand

    const formik = useFormik({
        initialValues: {
            name: brand?.name || "",
            description: brand?.description || "",
            isActive: brand ? brand.isActive : true,
        },
        validationSchema,
        enableReinitialize: true,
        onSubmit: async (values) => {
            try {
                if (isEditing && brand) {
                    await updateBrand.mutateAsync({ id: brand.id, data: values })
                } else {
                    await createBrand.mutateAsync(values)
                }
                onOpenChange(false)
                formik.resetForm()
            } catch (error) {
                console.error("Error saving brand", error)
            }
        }
    })

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Editar Marca" : "Nueva Marca"}</DialogTitle>
                </DialogHeader>

                <form onSubmit={formik.handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nombre</Label>
                        <Input
                            id="name"
                            {...formik.getFieldProps('name')}
                            placeholder="Ej. Nike"
                        />
                        {formik.touched.name && formik.errors.name && (
                            <p className="text-red-500 text-xs">{formik.errors.name}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Descripción (Opcional)</Label>
                        <Input
                            id="description"
                            {...formik.getFieldProps('description')}
                            placeholder="Descripción breve..."
                        />
                    </div>

                    <div className="flex items-center space-x-2 pt-2">
                        <Switch
                            id="isActive"
                            checked={formik.values.isActive}
                            onCheckedChange={(checked) => formik.setFieldValue('isActive', checked)}
                        />
                        <Label htmlFor="isActive">Activa</Label>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit">
                            {isEditing ? "Guardar" : "Crear"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
