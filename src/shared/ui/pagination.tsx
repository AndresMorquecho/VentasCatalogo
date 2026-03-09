import { Button } from "./button"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    totalItems?: number;
    itemsPerPage?: number;
}

export function Pagination({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage }: PaginationProps) {
    if (totalPages <= 1) return null;

    const renderPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;

        let start = Math.max(1, currentPage - 2);
        let end = Math.min(totalPages, start + maxVisible - 1);

        if (end === totalPages) {
            start = Math.max(1, end - maxVisible + 1);
        }

        if (start > 1) {
            pages.push(
                <Button key={1} variant="outline" size="sm" onClick={() => onPageChange(1)}>
                    1
                </Button>
            );
            if (start > 2) {
                pages.push(<MoreHorizontal key="start-more" className="h-4 w-4 text-muted-foreground" />);
            }
        }

        for (let i = start; i <= end; i++) {
            pages.push(
                <Button
                    key={i}
                    variant={currentPage === i ? "default" : "outline"}
                    size="sm"
                    onClick={() => onPageChange(i)}
                >
                    {i}
                </Button>
            );
        }

        if (end < totalPages) {
            if (end < totalPages - 1) {
                pages.push(<MoreHorizontal key="end-more" className="h-4 w-4 text-muted-foreground" />);
            }
            pages.push(
                <Button key={totalPages} variant="outline" size="sm" onClick={() => onPageChange(totalPages)}>
                    {totalPages}
                </Button>
            );
        }

        return pages;
    };

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
            {totalItems !== undefined && itemsPerPage !== undefined && (
                <div className="text-sm text-muted-foreground">
                    Mostrando {Math.min(totalItems, (currentPage - 1) * itemsPerPage + 1)} a {Math.min(totalItems, currentPage * itemsPerPage)} de {totalItems} resultados
                </div>
            )}
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-1">
                    {renderPageNumbers()}
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
