import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Destination } from './types';

interface TripDetails {
  startDate: string;
  endDate: string;
  travelers: string;
  style: string;
}

interface SelectionContextType {
  selectedDestinations: Destination[];
  tripDetails: TripDetails;
  toggleSelection: (destination: Destination) => void;
  clearSelection: () => void;
  updateTripDetails: (details: Partial<TripDetails>) => void;
}

const SelectionContext = createContext<SelectionContextType | undefined>(undefined);

export const SelectionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedDestinations, setSelectedDestinations] = useState<Destination[]>([]);
  const [tripDetails, setTripDetails] = useState<TripDetails>({
    startDate: '',
    endDate: '',
    travelers: '独自一人',
    style: '慢旅行'
  });

  const toggleSelection = (destination: Destination) => {
    setSelectedDestinations((prev) => {
      const isSelected = prev.find((d) => d.id === destination.id);
      if (isSelected) {
        return prev.filter((d) => d.id !== destination.id);
      } else {
        return [...prev, destination];
      }
    });
  };

  const clearSelection = () => setSelectedDestinations([]);

  const updateTripDetails = (details: Partial<TripDetails>) => {
    setTripDetails(prev => ({ ...prev, ...details }));
  };

  return (
    <SelectionContext.Provider value={{ 
      selectedDestinations, 
      tripDetails, 
      toggleSelection, 
      clearSelection,
      updateTripDetails 
    }}>
      {children}
    </SelectionContext.Provider>
  );
};

export const useSelection = () => {
  const context = useContext(SelectionContext);
  if (!context) {
    throw new Error('useSelection must be used within a SelectionProvider');
  }
  return context;
};
