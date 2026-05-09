import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

export default createVuetify({
  components,
  directives,
  defaults: {
    VCard: {
      rounded: 'lg',
      elevation: 0,
    },
    VBtn: {
      rounded: 'lg',
      style: 'text-transform: none; letter-spacing: 0;',
    },
    VChip: {
      rounded: 'md',
    },
    VTextField: {
      variant: 'outlined',
      density: 'comfortable',
    },
    VSelect: {
      variant: 'outlined',
      density: 'comfortable',
    },
    VTextarea: {
      variant: 'outlined',
      density: 'comfortable',
    },
  },
  theme: {
    defaultTheme: 'flux',
    themes: {
      flux: {
        dark: true,
        colors: {
          background: '#0F1023',
          surface: '#1A1B36',
          'surface-bright': '#2D2E47',
          'surface-light': '#3E7996',
          'surface-variant': '#2D2E47',
          'on-surface-variant': '#E5E7F0',
          primary: '#00BAB4',
          'primary-darken-1': '#069E6E',
          secondary: '#069E6E',
          'secondary-darken-1': '#057B57',
          accent: '#3E7996',
          info: '#2F6C82',
          success: '#069E6E',
          warning: '#F4A261',
          error: '#FF4D6D',
          'on-background': '#E5E7F0',
          'on-surface': '#E5E7F0',
          'on-primary': '#0F1023',
          'on-secondary': '#FFFFFF',
        },
        variables: {
          'border-color': '#3E7996',
          'border-opacity': 0.18,
          'high-emphasis-opacity': 1,
          'medium-emphasis-opacity': 0.72,
          'disabled-opacity': 0.4,
          'theme-on-surface': '#E5E7F0',
        },
      },
      'flux-light': {
        dark: false,
        colors: {
          background: '#F0F4F8',
          surface: '#FFFFFF',
          'surface-bright': '#FFFFFF',
          'surface-light': '#E5E9EF',
          'surface-variant': '#E5E9EF',
          'on-surface-variant': '#1A1B36',
          primary: '#069E6E',
          'primary-darken-1': '#057B57',
          secondary: '#00BAB4',
          'secondary-darken-1': '#069E6E',
          accent: '#2F6C82',
          info: '#2F6C82',
          success: '#069E6E',
          warning: '#E0822E',
          error: '#E03B5A',
          'on-background': '#1A1B36',
          'on-surface': '#1A1B36',
          'on-primary': '#FFFFFF',
          'on-secondary': '#FFFFFF',
        },
        variables: {
          'border-color': '#3E7996',
          'border-opacity': 0.22,
          'high-emphasis-opacity': 0.95,
          'medium-emphasis-opacity': 0.7,
          'disabled-opacity': 0.4,
          'theme-on-surface': '#1A1B36',
        },
      },
    },
  },
})
