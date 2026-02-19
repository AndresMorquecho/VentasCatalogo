import { SidebarProvider, SidebarInset } from "@/shared/ui/sidebar"
import { AppSidebar } from "@/widgets/Sidebar"
import { Outlet } from "react-router-dom"

export function MainLayout({ children }: { children?: React.ReactNode }) {
    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <main className="flex flex-1 flex-col gap-4 p-4">
                    {children || <Outlet />}
                </main>
            </SidebarInset>
        </SidebarProvider>
    )
}
