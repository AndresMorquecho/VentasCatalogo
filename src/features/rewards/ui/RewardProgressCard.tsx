
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/card";
import type { ClientReward } from "@/entities/client-reward/model/types";
import { cn } from "@/shared/lib/utils";

interface RewardProgressCardProps {
    reward: ClientReward;
    className?: string;
}

export function RewardProgressCard({ reward, className }: RewardProgressCardProps) {
    const { totalPoints, level } = reward;

    const getProgress = () => {
        if (totalPoints >= 600) return 100;
        if (totalPoints >= 300) return ((totalPoints - 300) / 300) * 100; // 300 to 599 (range 300)
        if (totalPoints >= 100) return ((totalPoints - 100) / 200) * 100; // 100 to 299 (range 200)
        return (totalPoints / 100) * 100; // 0 to 99 (range 100)
    };

    const getNextLevelInfo = () => {
        if (totalPoints >= 600) return "¡Nivel Máximo Alcanzado!";
        if (totalPoints >= 300) return `${600 - totalPoints} puntos para PLATINO`;
        if (totalPoints >= 100) return `${300 - totalPoints} puntos para ORO`;
        return `${100 - totalPoints} puntos para PLATA`;
    };

    const progress = Math.min(Math.max(getProgress(), 0), 100);

    const levelColors = {
        BRONCE: "text-orange-700 bg-orange-100",
        PLATA: "text-gray-600 bg-gray-100",
        ORO: "text-yellow-600 bg-yellow-100",
        PLATINO: "text-purple-600 bg-purple-100"
    };

    return (
        <Card className={cn("overflow-hidden", className)}>
            <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">Nivel de Fidelidad</CardTitle>
                    <span className={cn("px-2 py-1 rounded-full text-xs font-bold", levelColors[level])}>
                        {level}
                    </span>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Puntos Actuales</span>
                        <span className="font-bold text-xl">{totalPoints} pts</span>
                    </div>

                    <div className="space-y-1">
                        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary transition-all duration-500 ease-out"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <p className="text-xs text-muted-foreground text-right">{getNextLevelInfo()}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-center text-sm pt-2 border-t">
                        <div>
                            <p className="text-muted-foreground text-xs">Total Pedidos</p>
                            <p className="font-semibold">{reward.totalOrders}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground text-xs">Total Gastado</p>
                            <p className="font-semibold">${reward.totalSpent.toFixed(2)}</p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
