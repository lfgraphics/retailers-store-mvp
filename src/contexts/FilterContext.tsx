'use client';

import React, { createContext, useContext, useState } from 'react';

interface FilterState {
  priceRange: [number, number];
  sortBy: string;
}

interface FilterContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
  resetFilters: () => void;
}

const defaultFilters: FilterState = {
  priceRange: [0, 100000],
  sortBy: 'newest',
};

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function FilterProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);

  const resetFilters = () => {
    setFilters(defaultFilters);
  };

  return (
    <FilterContext.Provider value={{ isOpen, setIsOpen, filters, setFilters, resetFilters }}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilter() {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilter must be used within a FilterProvider');
  }
  return context;
}
