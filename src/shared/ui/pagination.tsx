import { Button } from "./button";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    totalItems?: number;
    itemsPerPage?: number;
}

export function Pagination({
    currentPage,
    totalPages,
    onPageChange,
    totalItems,
    itemsPerPage
}: PaginationProps) {
    if (totalPages <= 1) return null;

    const startItem = (currentPage - 1) * (itemsPerPage || 0) + 1;
    const endItem = Math.min(currentPage * (itemsPerPage || 0), totalItems || 0);

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2">
            <div className="text-sm text-slate-500 font-medium">
                {totalItems ? (
                    <>
                        Mostrando <span className="font-bold text-slate-700">{startItem}</span> a <span className="font-bold text-slate-700">{endItem}</span> de <span className="font-bold text-slate-700">{totalItems}</span> registros
                    </>
                ) : (
                    <>Página {currentPage} de {totalPages}</>
                )}
            </div>

            <div className="flex items-center gap-1">
                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-lg border-slate-200 hidden sm:flex"
                    onClick={() => onPageChange(1)}
                    disabled={currentPage === 1}
                >
                    <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-lg border-slate-200"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="flex items-center gap-1 mx-2">
                    {/* Simplified page numbers */}
                    {[...Array(Math.min(5, totalPages))].map((_, i) => {
                        let pageNumber;
                        if (totalPages <= 5) {
                            pageNumber = i + 1;
                        } else if (currentPage <= 3) {
                            pageNumber = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                            pageNumber = totalPages - 4 + i;
                        } else {
                            pageNumber = currentPage - 2 + i;
                        }

                        return (
                            <Button
                                key={pageNumber}
                                variant={currentPage === pageNumber ? "default" : "outline"}
                                size="icon"
                                className={`h-8 w-8 rounded-lg text-xs font-bold ${
                                    currentPage === pageNumber 
                                    ? "bg-monchito-purple hover:bg-monchito-purple/90 text-white" 
                                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                                }`}
                                onClick={() => onPageChange(pageNumber)}
                            >
                                {pageNumber}
                            </Button>
                        );
                    })}
                </div>

                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-lg border-slate-200"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-lg border-slate-200 hidden sm:flex"
                    onClick={() => onPageChange(totalPages)}
                    disabled={currentPage === totalPages}
                >
                    <ChevronsRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
