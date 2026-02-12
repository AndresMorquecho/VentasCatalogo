import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/shared/ui/sidebar"
import { AppSidebar } from "@/widgets/Sidebar"
import { Header } from "@/widgets/Header"
import { Outlet } from "react-router-dom"
import { Separator } from "@/shared/ui/separator"

export function MainLayout({ children }: { children?: React.ReactNode }) {
    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b bg-background px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <div className="flex-1">
                        <Header />
                    </div>
                </header>
                <main className="flex flex-1 flex-col gap-4 p-4 pt-0">
                    {children || <Outlet />}
                </main>
            </SidebarInset>
        </SidebarProvider>
    )
}
