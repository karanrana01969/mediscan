export const COLORS = {
  primary: '#4361EE',    
  secondary: '#3A0CA3',  
  accent: '#4CC9F0',     
  background: '#F8F9FA', 
  surface: '#FFFFFF',    
  text: '#2B2D42',       
  textLight: '#8D99AE',  
  error: '#EF233C',      
  success: '#20BF55',    
};

export const SIZES = {
  base: 8,
  small: 12,
  font: 16,
  medium: 18,
  large: 24,
  extraLarge: 32,
  radius: 16,
};

export const SHADOWS = {
  light: {
    shadowColor: COLORS.text,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: COLORS.text,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  }
};
