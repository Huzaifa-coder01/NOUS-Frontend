import { useContext } from 'react';

import { NousDataContext } from './nous-data-provider';

// ----------------------------------------------------------------------

export function useNousData() {
  const context = useContext(NousDataContext);

  if (!context) {
    throw new Error('useNousData: must be used inside NousDataProvider');
  }

  return context;
}
