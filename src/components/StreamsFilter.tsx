import { useState, useEffect } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

const StreamsFilter = ({
  onFiltersChange,
  pagination: { limit, page, total, totalPages },
}) => {
  const [streamType, setStreamType] = useState('All');
  const [hostGender, setHostGender] = useState('All');
  const [streamCategory, setStreamCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(page);
  const [itemsPerPage, setItemsPerPage] = useState(limit);

  useEffect(() => {
    const filters = {
      streamType,
      hostGender,
      streamCategory,
      searchQuery,
    };
    const paginationData = {
      page: currentPage,
      limit: itemsPerPage,
    };
    onFiltersChange(filters, paginationData);
  }, [
    streamType,
    hostGender,
    streamCategory,
    searchQuery,
    currentPage,
    itemsPerPage,
    // onFiltersChange,
  ]);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const renderPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (startPage > 1) {
      items.push(
        <PaginationItem key="ellipsis-start">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink
            onClick={() => handlePageChange(i)}
            isActive={currentPage === i}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    if (endPage < totalPages) {
      items.push(
        <PaginationItem key="ellipsis-end">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

    return items;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Streams Filter</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select value={streamType} onValueChange={setStreamType}>
            <SelectTrigger>
              <SelectValue placeholder="Stream Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              <SelectItem value="PK">PK</SelectItem>
              <SelectItem value="Gaming">Gaming</SelectItem>
            </SelectContent>
          </Select>

          <Select value={hostGender} onValueChange={setHostGender}>
            <SelectTrigger>
              <SelectValue placeholder="Host Gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="non-binary">Non-binary</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>

          <Select value={streamCategory} onValueChange={setStreamCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Stream Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              <SelectItem value="Regular">Regular</SelectItem>
              <SelectItem value="Talent">Talent</SelectItem>
              <SelectItem value="Adult">Adult</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mt-4">
          <Input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="mt-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
            {Math.min(currentPage * itemsPerPage, total)} of {total} results
          </div>

          <div className="flex items-center gap-4">
            <Select
              value={String(itemsPerPage)}
              onValueChange={(value) => setItemsPerPage(Number(value))}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>

            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  {currentPage == !1 && (
                    <PaginationPrevious
                      onClick={() =>
                        handlePageChange(Math.max(1, currentPage - 1))
                      }
                      // disabled={currentPage === 1}
                    />
                  )}
                </PaginationItem>
                {renderPaginationItems()}
                <PaginationItem>
                  {currentPage !== totalPages && (
                    <PaginationNext
                      onClick={() =>
                        handlePageChange(Math.min(totalPages, currentPage + 1))
                      }
                      // disabled={currentPage === totalPages}
                    />
                  )}
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StreamsFilter;
