import 'src/global.css';

import { Router } from 'src/routes/sections';

import { ThemeProvider } from 'src/theme/theme-provider';
import { NousDataProvider } from 'src/context/nous-data';

import { Snackbar } from 'src/components/snackbar';
import { ProgressBar } from 'src/components/progress-bar';
import { MotionLazy } from 'src/components/animate/motion-lazy';
import { SettingsDrawer, defaultSettings, SettingsProvider } from 'src/components/settings';

import { AuthProvider } from 'src/auth/context/jwt';

// ----------------------------------------------------------------------

export default function App() {
  return (
    <SettingsProvider settings={defaultSettings}>
      <ThemeProvider>
        <MotionLazy>
          <AuthProvider>
            <NousDataProvider>
              <Snackbar />
              <ProgressBar />
              <SettingsDrawer />
              <Router />
            </NousDataProvider>
          </AuthProvider>
        </MotionLazy>
      </ThemeProvider>
    </SettingsProvider>
  );
}
