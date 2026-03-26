import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Destination, TravelPlanResponse } from './types';

interface TripDetails {
  startDate: string;
  endDate: string;
  travelers: string;
  style: string;
}

interface SelectionContextType {
  selectedDestinations: Destination[];
  allSearchResults: Destination[];  // 所有搜索到的POI
  tripDetails: TripDetails;
  generatedPlan: TravelPlanResponse | null;
  toggleSelection: (destination: Destination) => void;
  clearSelection: () => void;
  updateTripDetails: (details: Partial<TripDetails>) => void;
  setGeneratedPlan: (plan: TravelPlanResponse | null) => void;
  setAllSearchResults: (results: Destination[]) => void;  // 设置所有搜索结果
}

const SelectionContext = createContext<SelectionContextType | undefined>(undefined);

export const SelectionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedDestinations, setSelectedDestinations] = useState<Destination[]>([]);
  const [allSearchResults, setAllSearchResults] = useState<Destination[]>([]);
  const [generatedPlan, setGeneratedPlan] = useState<TravelPlanResponse | null>(null);
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
      allSearchResults,
      tripDetails, 
      generatedPlan,
      toggleSelection, 
      clearSelection,
      updateTripDetails,
      setGeneratedPlan,
      setAllSearchResults
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
