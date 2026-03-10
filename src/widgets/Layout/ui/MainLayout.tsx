import { SidebarProvider, SidebarInset } from "@/shared/ui/sidebar"
import { AppSidebar } from "@/widgets/Sidebar"
import { Outlet } from "react-router-dom"

export function MainLayout({ children }: { children?: React.ReactNode }) {
    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="bg-slate-50/50 min-h-screen min-w-0 overflow-hidden">
                <div className="flex-1 flex flex-col gap-4 p-4 md:p-8 w-full max-w-[1600px] mx-auto min-w-0">
                    {children || <Outlet />}
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
