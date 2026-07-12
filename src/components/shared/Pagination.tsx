
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: PaginationProps) {
  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  // Generate page numbers to display
  // Logic to show a limited number of page buttons (e.g., first, last, current, and neighbors)
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    const halfPagesToShow = Math.floor(maxPagesToShow / 2);

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      let pages: (number | string)[] = [];
      let leftSide = currentPage - halfPagesToShow;
      let rightSide = currentPage + halfPagesToShow;

      if (leftSide <= 0) {
        leftSide = 1;
        rightSide = maxPagesToShow;
      }
      if (rightSide > totalPages) {
        rightSide = totalPages;
        leftSide = totalPages - maxPagesToShow + 1;
      }
      
      let lastPage: number | string | null = null;
      for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= leftSide && i <= rightSide)) {
          if (lastPage !== null && i - (lastPage as number) > 1) {
            pages.push('...');
          }
          pages.push(i);
          lastPage = i;
        }
      }
      return pages;
    }
    return pageNumbers;
  };

  const pageNumbers = getPageNumbers();


  return (
    <nav
      className={cn("flex items-center justify-center space-x-2 p-4", className)}
      aria-label="Pagination"
    >
      <Button
        variant="outline"
        size="icon"
        onClick={handlePrevious}
        disabled={currentPage === 1}
        className="h-9 w-9"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="sr-only">Página anterior</span>
      </Button>

      {pageNumbers.map((page, index) =>
        typeof page === 'number' ? (
          <Button
            key={index}
            variant={currentPage === page ? "default" : "outline"}
            size="icon"
            onClick={() => onPageChange(page)}
            className="h-9 w-9"
          >
            {page}
          </Button>
        ) : (
          <span key={index} className="px-2 py-1 text-muted-foreground">
            {page}
          </span>
        )
      )}

      <Button
        variant="outline"
        size="icon"
        onClick={handleNext}
        disabled={currentPage === totalPages}
        className="h-9 w-9"
      >
        <ChevronRight className="h-4 w-4" />
        <span className="sr-only">Siguiente página</span>
      </Button>
    </nav>
  );
}
