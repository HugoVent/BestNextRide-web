import styled from 'styled-components';
import { rgba } from 'polished';

export const theme = {
  colors: {
    primary: '#387eb2',    // Using your blue shades as primary accents
    secondary: '#439ee1',
    success: '#16a34a',
    warning: '#eab308',
    danger: '#dc2626',
    info: '#0284c7',
    light: '#f8fafc',
    dark: '#1e293b',
    background: '#f1f5f9',
    text: '#334155',
    gray: '#64748b',
    accent1: '#ffc5e0',
    accent2: '#ffabd2',
    accent3: '#c7af76',
  },
  shadows: {
    sm: '0 1px 3px rgba(0,0,0,0.1)',
    md: '0 4px 6px rgba(0,0,0,0.1)',
    lg: '0 10px 15px rgba(0,0,0,0.1)',
  },
  radii: {
    sm: '6px',
    md: '8px',
    lg: '12px',
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
  },
  categoryColors: {
    Short: '#16a34a',
    Medium: '#eab308',
    Long: '#ea580c',
    'Very Long': '#dc2626',
    Closed: '#64748b',
  },
};

export const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: ${theme.spacing.xl};
  background-color: ${theme.colors.background};
  min-height: 100vh;
  font-family: 'Roboto', sans-serif;
`;

export const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  flex: 1;
  padding: ${theme.spacing.lg} ${theme.spacing.xl};
  border: none;
  border-radius: ${theme.radii.md};
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.2s ease;
  font-size: 1.25rem;
  min-height: 60px;

  ${({ variant = 'primary' }) =>
    variant === 'primary'
      ? `
        background-color: ${theme.colors.primary};
        color: #fff;
        &:hover { 
          background-color: ${rgba(theme.colors.primary, 0.9)};
          transform: translateY(-2px);
        }
      `
      : `
        background-color: ${theme.colors.secondary};
        color: #fff;
        &:hover { 
          background-color: ${rgba(theme.colors.secondary, 0.9)};
          transform: translateY(-2px);
        }
      `}

  &:disabled {
    background-color: ${theme.colors.gray};
    cursor: not-allowed;
  }
`;

export const ButtonGroup = styled.div`
  display: flex;
  gap: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.lg};
`;

export const Input = styled.input`
  width: 100%;
  padding: ${theme.spacing.sm};
  border: 1px solid ${theme.colors.gray};
  border-radius: ${theme.radii.md};
  margin-bottom: ${theme.spacing.sm};
  font-size: 1rem;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
    box-shadow: 0 0 0 3px ${rgba(theme.colors.primary, 0.2)};
  }
`;

export const AttractionItem = styled.div<{ color?: string }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${theme.spacing.sm};
  background-color: #fff;
  margin-bottom: ${theme.spacing.sm};
  border-radius: ${theme.radii.md};
  box-shadow: ${theme.shadows.sm};
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  border-left: 5px solid ${({ color }) => color || theme.colors.gray};

  &:hover {
    transform: translateY(-3px);
    box-shadow: ${theme.shadows.md};
  }
`;

export const CategoryHeader = styled.div<{ category: keyof typeof theme.categoryColors }>`
  padding: ${theme.spacing.sm};
  margin-bottom: ${theme.spacing.md};
  border-radius: ${theme.radii.md};
  background-color: ${({ category }) => theme.categoryColors[category]};
  color: #fff;
  font-weight: bold;
  text-align: center;
  font-size: 1.1rem;
  box-shadow: ${theme.shadows.sm};
`;

export const ChartContainer = styled.div`
  height: 300px;
  width: 100%;
  margin-bottom: ${theme.spacing.md};
  background-color: #fff;
  padding: ${theme.spacing.md};
  border-radius: ${theme.radii.lg};
  box-shadow: ${theme.shadows.sm};
`;

export const StatsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.md};
  justify-content: center;
`;

export const StatBox = styled.div`
  flex: 1;
  min-width: 200px;
  background-color: #fff;
  padding: ${theme.spacing.md};
  border-radius: ${theme.radii.md};
  box-shadow: ${theme.shadows.sm};
  text-align: center;
  transition: transform 0.2s ease;

  &:hover {
    transform: translateY(-2px);
  }
`;

export const ErrorMessage = styled.div`
  padding: ${theme.spacing.md};
  background-color: ${rgba(theme.colors.danger, 0.1)};
  color: ${theme.colors.danger};
  border-radius: ${theme.radii.md};
  margin-bottom: ${theme.spacing.md};
  border: 1px solid ${rgba(theme.colors.danger, 0.2)};
  text-align: center;
`;

export const WaitTime = styled.span<{ color: string }>`
  color: ${({ color }) => color};
  font-weight: bold;
  font-size: 1.2rem;
`;

export const UpdateInfo = styled.div`
  text-align: center;
  color: ${theme.colors.gray};
  margin-top: ${theme.spacing.sm};
  font-size: 0.9rem;
`;

export const AttractionTitle = styled.h2`
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: ${theme.spacing.md};
  text-align: center;
  color: ${theme.colors.text};
`;

/* Auto-suggest search results */
export const SearchSuggestions = styled.ul`
  background: #fff;
  border: 1px solid ${theme.colors.gray};
  border-radius: ${theme.radii.md};
  max-height: 200px;
  overflow-y: auto;
  margin-top: -${theme.spacing.sm};
  margin-bottom: ${theme.spacing.md};
  list-style: none;
  padding: 0;
  box-shadow: ${theme.shadows.sm};
`;

export const SearchSuggestionItem = styled.li`
  padding: ${theme.spacing.sm};
  cursor: pointer;
  transition: background-color 0.2s ease;
  &:hover {
    background-color: ${rgba(theme.colors.primary, 0.1)};
  }
`;

/* Date Mode Selection styles */
export const DateModeContainer = styled.div`
  margin-bottom: ${theme.spacing.lg};
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
`;

export const RadioGroup = styled.div`
  display: flex;
  gap: ${theme.spacing.sm};
  align-items: center;
`;

export const RadioLabel = styled.label`
  font-size: 1rem;
  color: ${theme.colors.primary};
  cursor: pointer;
  input {
    margin-right: ${theme.spacing.xs};
  }
`;

/* Stylish Date Input using your palette */
export const DateInput = styled.input`
  appearance: none;
  -webkit-appearance: none;
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  font-size: 1rem;
  border: 2px solid ${theme.colors.primary};
  border-radius: ${theme.radii.lg};
  color: ${theme.colors.primary};
  background-image: linear-gradient(45deg, ${theme.colors.accent1}, ${theme.colors.accent2});
  background-clip: padding-box;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;

  &:focus {
    outline: none;
    border-color: ${theme.colors.secondary};
    box-shadow: 0 0 0 3px ${rgba(theme.colors.secondary, 0.2)};
  }
`;
