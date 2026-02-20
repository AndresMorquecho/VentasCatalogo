import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar"
import { Button } from "@/shared/ui/button"
import { Search, LogOut } from "lucide-react"
import { authService } from "@/shared/services/authService"
import { LogoutDialog } from "@/shared/components/LogoutDialog"
import { useState } from "react"

export function Header() {
    const user = authService.getUser();
    const [showLogoutDialog, setShowLogoutDialog] = useState(false);
    
    const handleLogout = () => {
        authService.logout();
    };

    return (
        <div className="flex flex-1 items-center gap-4">
            <div className="relative ml-auto flex-1 md:grow-0">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                    type="search"
                    placeholder="Buscar..."
                    className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
                />
            </div>
            <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground hidden md:inline">
                    {user?.name || user?.email}
                </span>
                <Button variant="outline" size="icon" className="h-8 w-8">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src="/placeholder-user.jpg" alt={user?.name} />
                        <AvatarFallback>
                            {user?.name?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                    </Avatar>
                </Button>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => setShowLogoutDialog(true)}
                    title="Cerrar sesión"
                >
                    <LogOut className="h-4 w-4" />
                </Button>
            </div>
            
            <LogoutDialog 
                open={showLogoutDialog}
                onOpenChange={setShowLogoutDialog}
                onConfirm={handleLogout}
            />
        </div>
    )
}
