import { tokens } from './tokens'

export const lightTheme = {
  ...tokens,
  background: tokens.colors.gray[50],
  surface: '#FFFFFF',
  text: tokens.colors.gray[900],
  textSecondary: tokens.colors.gray[600],
  border: tokens.colors.gray[200],
}

export const darkTheme = {
  ...tokens,
  background: tokens.colors.gray[900],
  surface: tokens.colors.gray[800],
  text: '#FFFFFF',
  textSecondary: tokens.colors.gray[400],
  border: tokens.colors.gray[700],
}

export default lightTheme
