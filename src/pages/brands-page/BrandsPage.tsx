import { BrandList } from "@/features/brands"
import { PageHeader } from "@/shared/ui/PageHeader"
import { Tag } from "lucide-react"

export default function BrandsPage() {
    return (
        <div className="space-y-6">
            <PageHeader 
                title="Marcas" 
                description="Administra las marcas de productos"
                icon={Tag}
            />
            <BrandList />
        </div>
    )
}
