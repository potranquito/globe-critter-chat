import { useState, useCallback } from 'react';
import { LearningPhase, TaughtSpecies, LearningSession, getNextPhase } from '../types/learning';
import type { RegionSpecies } from '@/services/regionService';

/**
 * Hook for managing 3-phase learning sessions (Plants → Birds → Predators)
 * Tracks taught species and enforces 5-species-per-phase rule
 */
export function useLearningSession(parkId: string, ecoregionName: string) {
  const [session, setSession] = useState<LearningSession>({
    parkId,
    ecoregionName,
    phases: {
      plants: [],
      birds: [],
      predators: []
    },
    currentPhase: 'plants',
    completedPhases: []
  });

  /**
   * Get filters for the current learning phase
   */
  const getCurrentPhaseFilters = useCallback((): string[] => {
    switch (session.currentPhase) {
      case 'plants':
        return ['producer-diet', 'plant'];
      case 'birds':
        return ['bird'];
      case 'predators':
        return ['carnivore-diet'];
      default:
        return [];
    }
  }, [session.currentPhase]);

  /**
   * Check if species matches current phase requirements
   */
  const isSpeciesValidForPhase = useCallback((species: RegionSpecies, phase: LearningPhase): boolean => {
    switch (phase) {
      case 'plants':
        // Producer or Plant type
        return species.dietaryCategory === 'Producer' || species.speciesType === 'Plant';
      case 'birds':
        // Bird species type
        return species.speciesType === 'Bird' || species.animalType?.toLowerCase().includes('bird');
      case 'predators':
        // Carnivore dietary category
        return species.dietaryCategory === 'Carnivore';
      default:
        return false;
    }
  }, []);

  /**
   * Filter species list for current phase
   */
  const filterSpeciesForCurrentPhase = useCallback((allSpecies: RegionSpecies[]): RegionSpecies[] => {
    return allSpecies.filter(sp => isSpeciesValidForPhase(sp, session.currentPhase));
  }, [session.currentPhase, isSpeciesValidForPhase]);

  /**
   * Add a taught species to current phase
   */
  const addTaughtSpecies = useCallback((species: RegionSpecies) => {
    const taughtSpecies: TaughtSpecies = {
      id: species.id,
      scientificName: species.scientificName,
      commonName: species.commonName,
      imageUrl: species.imageUrl,
      phase: session.currentPhase
    };

    setSession(prev => ({
      ...prev,
      phases: {
        ...prev.phases,
        [prev.currentPhase]: [...prev.phases[prev.currentPhase], taughtSpecies]
      }
    }));
  }, [session.currentPhase]);

  /**
   * Get count of species taught in current phase
   */
  const getCurrentPhaseCount = useCallback((): number => {
    return session.phases[session.currentPhase].length;
  }, [session.currentPhase, session.phases]);

  /**
   * Check if current phase is complete (5 species taught)
   */
  const isCurrentPhaseComplete = useCallback((): boolean => {
    return getCurrentPhaseCount() >= 5;
  }, [getCurrentPhaseCount]);

  /**
   * Advance to next phase
   */
  const advanceToNextPhase = useCallback(() => {
    const nextPhase = getNextPhase(session.currentPhase);

    if (nextPhase) {
      setSession(prev => ({
        ...prev,
        currentPhase: nextPhase,
        completedPhases: [...prev.completedPhases, prev.currentPhase]
      }));
      return true;
    }

    // All phases complete
    return false;
  }, [session.currentPhase]);

  /**
   * Check if all 3 phases are complete
   */
  const isAllPhasesComplete = useCallback((): boolean => {
    return session.completedPhases.length === 3 ||
           (session.currentPhase === 'predators' && isCurrentPhaseComplete());
  }, [session.completedPhases.length, session.currentPhase, isCurrentPhaseComplete]);

  /**
   * Get all taught species across all completed phases
   */
  const getAllTaughtSpecies = useCallback((): TaughtSpecies[] => {
    return [
      ...session.phases.plants,
      ...session.phases.birds,
      ...session.phases.predators
    ];
  }, [session.phases]);

  /**
   * Get taught species for a specific phase
   */
  const getTaughtSpeciesForPhase = useCallback((phase: LearningPhase): TaughtSpecies[] => {
    return session.phases[phase];
  }, [session.phases]);

  /**
   * Reset the entire learning session
   */
  const resetSession = useCallback(() => {
    setSession({
      parkId,
      ecoregionName,
      phases: {
        plants: [],
        birds: [],
        predators: []
      },
      currentPhase: 'plants',
      completedPhases: []
    });
  }, [parkId, ecoregionName]);

  return {
    session,
    currentPhase: session.currentPhase,
    currentPhaseCount: getCurrentPhaseCount(),
    getCurrentPhaseFilters,
    filterSpeciesForCurrentPhase,
    addTaughtSpecies,
    isCurrentPhaseComplete,
    advanceToNextPhase,
    isAllPhasesComplete,
    getAllTaughtSpecies,
    getTaughtSpeciesForPhase,
    resetSession,
    completedPhasesCount: session.completedPhases.length
  };
}
