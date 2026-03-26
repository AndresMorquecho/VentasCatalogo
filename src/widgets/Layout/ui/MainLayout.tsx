import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/shared/ui/sidebar"
import { AppSidebar } from "@/widgets/Sidebar"
import { Header } from "@/widgets/Header"
import { Outlet } from "react-router-dom"
import { Separator } from "@/shared/ui/separator"

export function MainLayout({ children }: { children?: React.ReactNode }) {
    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="bg-slate-50/50 min-h-screen min-w-0 overflow-hidden flex flex-col">
                <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-white px-4 sticky top-0 z-30 md:hidden overflow-visible">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <Header />
                </header>
                <div className="flex-1 flex flex-col gap-4 p-4 md:p-6 w-full max-w-[1600px] mx-auto min-w-0 overflow-auto">
                    {children || <Outlet />}
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
