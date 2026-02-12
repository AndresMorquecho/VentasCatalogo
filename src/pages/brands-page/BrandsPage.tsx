import { BrandList } from "@/features/brands"

export default function BrandsPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Marcas</h1>
            <BrandList />
        </div>
    )
}
