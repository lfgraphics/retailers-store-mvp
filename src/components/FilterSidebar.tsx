'use client';

import React from 'react';
import { useFilter } from '@/contexts/FilterContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

export function FilterSidebar() {
  const { isOpen, setIsOpen, filters, setFilters, resetFilters } = useFilter();

  const handlePriceChange = (index: number, value: string) => {
    const newPriceRange = [...filters.priceRange] as [number, number];
    newPriceRange[index] = Number(value);
    setFilters({ ...filters, priceRange: newPriceRange });
  };

  const handleSortChange = (value: string) => {
    setFilters({ ...filters, sortBy: value });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="fixed top-0 right-0 left-auto translate-x-0 translate-y-0 h-full w-full max-w-sm rounded-none border-l p-0 flex flex-col gap-0 duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-md">
        <DialogHeader className="p-6 border-b shrink-0">
          <DialogTitle className="text-xl font-bold">Filters</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Sort By */}
          <div className="space-y-4">
            <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Sort By</Label>
            <Select value={filters.sortBy} onValueChange={handleSortChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="rating">Top Rated</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Price Range */}
          <div className="space-y-4">
            <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Price Range</Label>
            <div className="flex items-center gap-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor="min-price" className="text-xs">Min Price</Label>
                <Input
                  id="min-price"
                  type="number"
                  placeholder="Min"
                  value={filters.priceRange[0]}
                  onChange={(e) => handlePriceChange(0, e.target.value)}
                />
              </div>
              <div className="flex-1 space-y-2">
                <Label htmlFor="max-price" className="text-xs">Max Price</Label>
                <Input
                  id="max-price"
                  type="number"
                  placeholder="Max"
                  value={filters.priceRange[1]}
                  onChange={(e) => handlePriceChange(1, e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 border-t shrink-0 flex-row gap-4">
          <Button variant="outline" className="flex-1" onClick={resetFilters}>
            Reset
          </Button>
          <Button className="flex-1" onClick={() => setIsOpen(false)}>
            Apply Filters
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
