import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar"
import { Button } from "@/shared/ui/button"
import { Search } from "lucide-react"

export function Header() {
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
                <Button variant="outline" size="icon" className="ml-auto h-8 w-8">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src="/placeholder-user.jpg" alt="@shadcn" />
                        <AvatarFallback>CN</AvatarFallback>
                    </Avatar>
                </Button>
            </div>
        </div>
    )
}
