// ThemeProvider.tsx
import { ThemeProvider as EmotionThemeProvider } from '@emotion/react';
import {theme} from './Theme';

type ThemeProviderProps = {
  children: React.ReactNode;
};

const ThemeProvider = ({ children }: ThemeProviderProps) => {
  return <EmotionThemeProvider theme={theme}>{children}</EmotionThemeProvider>;
};

export default ThemeProvider;
