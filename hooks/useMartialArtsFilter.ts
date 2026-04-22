import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Player } from '../types';

export const useMartialArtsFilter = (players: Player[], teams: string[]) => {
  const [maFilter, setMaFilter] = useState<string[]>([]);
  const [maStates, setMaStates] = useState<Record<string, 'none' | 'mark' | 'select'>>({});
  const [showSummary, setShowSummary] = useState(false);
  const [hasManuallyClosed, setHasManuallyClosed] = useState(false);
  const [popupPos, setPopupPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const filterBtnRef = useRef<HTMLButtonElement>(null);

  const teamPriorityMap = useMemo(() => {
    return new Map<string, number>(teams.map((t, index) => [t, index]));
  }, [teams]);

  useEffect(() => {
    if (maFilter.length > 0 && !hasManuallyClosed) {
      setShowSummary(true);
    }
    if (maFilter.length === 0) {
      setHasManuallyClosed(false);
      setShowSummary(false);
    }
  }, [maFilter, hasManuallyClosed]);

  useEffect(() => {
    if (showSummary && popupPos.x === 0 && popupPos.y === 0 && filterBtnRef.current) {
      const rect = filterBtnRef.current.getBoundingClientRect();
      setPopupPos({ 
        x: rect.left, 
        y: rect.bottom + 12 
      });
    }
  }, [showSummary, popupPos.x, popupPos.y]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).closest('.draggable-popup')?.getBoundingClientRect();
    if (!rect) return;
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPopupPos({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y
        });
      }
    };
    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const filteredPlayers = useMemo(() => {
    if (maFilter.length === 0) return [];
    
    const matched = players.filter(p => p.martialArts.some(ma => maFilter.includes(ma)));
    
    // Create a priority map for O(1) lookup during sort
    const priorityMap = new Map<string, number>(maFilter.map((ma, index) => [ma, index]));
    
    return matched.sort((a, b) => {
      // 1. Sort by martial arts priority (based on filter order)
      let aMaMin = Infinity;
      for (const ma of a.martialArts) {
        const p = priorityMap.get(ma);
        if (p !== undefined && p < aMaMin) aMaMin = p;
      }
      
      let bMaMin = Infinity;
      for (const ma of b.martialArts) {
        const p = priorityMap.get(ma);
        if (p !== undefined && p < bMaMin) bMaMin = p;
      }
      
      if (aMaMin !== bMaMin) return aMaMin - bMaMin;

      // 2. Sort by team priority (Team 1 -> Reserve)
      const aTeamIdx = teamPriorityMap.get(a.team) ?? Infinity;
      const bTeamIdx = teamPriorityMap.get(b.team) ?? Infinity;
      
      return aTeamIdx - bTeamIdx;
    });
  }, [players, maFilter, teamPriorityMap]);

  const sortedPlayers = useMemo(() => {
    if (maFilter.length === 0) return players;
    
    const priorityMap = new Map<string, number>(maFilter.map((ma, index) => [ma, index]));
    
    return [...players].sort((a, b) => {
      let aMaMin = Infinity;
      for (const ma of a.martialArts) {
        const p = priorityMap.get(ma);
        if (p !== undefined && p < aMaMin) aMaMin = p;
      }
      
      let bMaMin = Infinity;
      for (const ma of b.martialArts) {
        const p = priorityMap.get(ma);
        if (p !== undefined && p < bMaMin) bMaMin = p;
      }
      
      const aMaMatch = aMaMin !== Infinity;
      const bMaMatch = bMaMin !== Infinity;
      
      if (aMaMatch && !bMaMatch) return -1;
      if (!aMaMatch && bMaMatch) return 1;
      
      if (aMaMatch && bMaMatch) {
         if (aMaMin !== bMaMin) return aMaMin - bMaMin;
      }

      // If both match/don't match or have same MA priority, sort by team
      const aTeamIdx = teamPriorityMap.get(a.team) ?? Infinity;
      const bTeamIdx = teamPriorityMap.get(b.team) ?? Infinity;
      
      if (aTeamIdx !== bTeamIdx) return aTeamIdx - bTeamIdx;
      
      return 0;
    });
  }, [players, maFilter, teamPriorityMap]);

  const getMatchingPlayerIds = (maName: string) => {
    return players
      .filter(p => p.martialArts.includes(maName))
      .map(p => p.id);
  };

  const getDeselectPlayerIds = (maName: string, currentFilter: string[]) => {
    const nextFilter = currentFilter.filter(n => n !== maName);
    return players
      .filter(p => p.martialArts.includes(maName) && !p.martialArts.some(ma => nextFilter.includes(ma)))
      .map(p => p.id);
  };

  const toggleFilter = (maName: string) => {
    setMaFilter(prev => 
      prev.includes(maName) 
        ? prev.filter(n => n !== maName) 
        : [...prev, maName]
    );
  };

  const clearFilter = () => {
    setMaFilter([]);
    setMaStates({});
    setShowSummary(false);
    setHasManuallyClosed(false);
  };

  const toggleSummary = () => {
    const newState = !showSummary;
    setShowSummary(newState);
    if (newState) setHasManuallyClosed(false);
  };

  const closeSummaryManually = () => {
    setShowSummary(false);
    setHasManuallyClosed(true);
  };

  return {
    maFilter,
    setMaFilter,
    maStates,
    setMaStates,
    showSummary,
    setShowSummary,
    popupPos,
    filterBtnRef,
    handleMouseDown,
    filteredPlayers,
    sortedPlayers,
    toggleFilter,
    clearFilter,
    toggleSummary,
    closeSummaryManually,
    getMatchingPlayerIds,
    getDeselectPlayerIds
  };
};
