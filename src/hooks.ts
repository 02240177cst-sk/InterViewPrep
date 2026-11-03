import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { onSynced } from './sync';

export function useLoad(load: () => void | Promise<void>, deps: any[] = []) {
  const [tick, setTick] = useState(0);
  useEffect(() => onSynced(() => setTick((t) => t + 1)), []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useFocusEffect(useCallback(() => { load(); }, [tick, ...deps]));
}