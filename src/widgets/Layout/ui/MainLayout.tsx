import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/shared/ui/sidebar"
import { AppSidebar } from "@/widgets/Sidebar"
import { Outlet, useLocation } from "react-router-dom"
import { useEffect } from "react"
import { useSidebar } from "@/shared/ui/sidebar"

function MainLayoutContent({ children }: { children?: React.ReactNode }) {
    const { isMobile, setOpenMobile } = useSidebar()
    const location = useLocation()

    // Cierra el sidebar automáticamente al navegar en móvil
    useEffect(() => {
        if (isMobile) {
            setOpenMobile(false)
        }
    }, [location.pathname, isMobile, setOpenMobile])

    return (
        <div className="flex min-h-screen w-full bg-background">
            <AppSidebar />
            <SidebarInset className="flex flex-col w-full">
                {/* Header Móvil con Botón Hamburguesa */}
                <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 lg:hidden sticky top-0 z-30 bg-white/80 backdrop-blur-md">
                    <SidebarTrigger className="-ml-1" />
                    <div className="flex flex-1 items-center gap-2 px-2">
                        <img src="/images/mochitopng.png" alt="Logo" className="h-6 w-6 mix-blend-multiply" />
                        <span className="text-xs font-black tracking-tighter uppercase text-slate-900 mt-0.5">Venta por Catálogo</span>
                    </div>
                </header>

                <main className="flex flex-1 flex-col gap-4 p-4 lg:p-8 w-full max-w-[1600px] mx-auto overflow-hidden">
                    {children || <Outlet />}
                </main>
            </SidebarInset>
        </div>
    )
}

export function MainLayout({ children }: { children?: React.ReactNode }) {
    return (
        <SidebarProvider>
            <MainLayoutContent>
                {children}
            </MainLayoutContent>
        </SidebarProvider>
    )
}

