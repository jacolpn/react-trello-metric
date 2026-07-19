import { createGlobalStyle } from 'styled-components';

export const GlobalStyles = createGlobalStyle`
  :root {
    --main-bg-color: ${({ mode }) =>
      mode === 'light' ? '#eef2f6' : '#1f2229'};
    --primary-color: ${({ mode }) =>
      mode === 'light' ? '#47b4ec' : '#3aa8e6'};
    --primary-hover-transparency-color: ${({ mode }) =>
      mode === 'light'
        ? 'rgba(71, 180, 236, 0.05)'
        : 'rgba(100, 200, 255, 0.05)'};
    --primary-high-transparency-color: ${({ mode }) =>
      mode === 'light'
        ? 'rgba(71, 180, 236, 0.2)'
        : 'rgba(100, 200, 255, 0.2)'};
    --primary-medium-transparency-color: ${({ mode }) =>
      mode === 'light'
        ? 'rgba(71, 180, 236, 0.5)'
        : 'rgba(100, 200, 255, 0.5)'};
    --primary-low-transparency-color: ${({ mode }) =>
      mode === 'light'
        ? 'rgba(71, 180, 236, 0.5)'
        : 'rgba(100, 200, 255, 0.8)'};
    --secondary-color: ${({ mode }) =>
      mode === 'light' ? '#3b9dd8' : '#4db3f5'};
    --secondary-two-color: ${({ mode }) =>
      mode === 'light' ? '#4e7593' : '#7fa8c7'};
    --text-dark-color: ${({ mode }) =>
      mode === 'light' ? '#58595a' : '#e0e0e0'};
    --text-light-color: ${({ mode }) =>
      mode === 'light' ? '#6d7072' : '#b0b0b0'};
    --grey-light-color: ${({ mode }) =>
      mode === 'light' ? '#909597' : '#a8aaab'};
    --white-color: ${({ mode }) => (mode === 'light' ? '#ffffff' : '#212121')};
    --white-color-inverted: ${({ mode }) =>
      mode === 'light' ? '#212121' : '#ffffff'};
    --border-line-color: ${({ mode }) =>
      mode === 'light' ? '#e5e5e5' : '#333333'};
    --yellow-color: ${({ mode }) => (mode === 'light' ? '#e7aa3f' : '#ffc152')};
    --light-gray-red: ${({ mode }) =>
      mode === 'light' ? '#d7d8d9' : '#515151'};
    --medium-gray-red: ${({ mode }) =>
      mode === 'light' ? '#efefef' : '#2a2a2a'};
    --gray-red-40: ${({ mode }) => (mode === 'light' ? '#fafafa' : '#1a1a1a')};
    --gray-red-50: ${({ mode }) => (mode === 'light' ? '#fcfcfc' : '#181818')};
    --input-disabled: ${({ mode }) =>
      mode === 'light' ? '#f0f0f0' : '#252525'};
    --gray-red-400: ${({ mode }) => (mode === 'light' ? '#888888' : '#909090')};
    --gray-red-200: ${({ mode }) => (mode === 'light' ? '#eeeeee' : '#333333')};
    --gray-red-300: ${({ mode }) => (mode === 'light' ? '#dddddd' : '#444444')};
    --gray-red-500: ${({ mode }) => (mode === 'light' ? '#707070' : '#909090')};
    --gray-red-600: ${({ mode }) => (mode === 'light' ? '#616161' : '#a0a0a0')};
    --gray-red-700: ${({ mode }) => (mode === 'light' ? '#212121' : '#e0e0e0')};
    --gray-red-800: ${({ mode }) => (mode === 'light' ? '#303030' : '#d0d0d0')};
    --teal-200: ${({ mode }) => (mode === 'light' ? '#9ce0de' : '#b1f0ee')};
    --light-blue-100: ${({ mode }) =>
      mode === 'light' ? '#f2fbff' : '#002b36'};
    --gray-blue-100: ${({ mode }) =>
      mode === 'light' ? '#f1f6f9' : '#0f1d24'};
    --gray-blue-200: ${({ mode }) =>
      mode === 'light' ? '#e5e9eb' : '#1e2d35'};
    --red-500: ${({ mode }) => (mode === 'light' ? '#ff4343' : '#ff6b6b')};
    --red-600: ${({ mode }) => (mode === 'light' ? '#ff0000' : '#ff3d3d')};
    --red-900: ${({ mode }) => (mode === 'light' ? '#750f0f' : '#ffa8a8')};
    --orange-500: ${({ mode }) => (mode === 'light' ? '#ffaa1d' : '#ffc233')};
    --gray-half-transparent: ${({ mode }) =>
      mode === 'light'
        ? 'rgba(128, 128, 128, 0.5)'
        : 'rgba(128, 128, 128, 0.7)'};
    --black-05: ${({ mode }) =>
      mode === 'light' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)'};
    --black-10: ${({ mode }) =>
      mode === 'light' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)'};
    --black-12: ${({ mode }) =>
      mode === 'light' ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.12)'};
    --black-14: ${({ mode }) =>
      mode === 'light' ? 'rgba(0, 0, 0, 0.14)' : 'rgba(255, 255, 255, 0.14)'};
    --black-20: ${({ mode }) =>
      mode === 'light' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.2)'};
    --black-26: ${({ mode }) =>
      mode === 'light' ? 'rgba(0, 0, 0, 0.26)' : 'rgba(255, 255, 255, 0.26)'};
    --green-400: ${({ mode }) => (mode === 'light' ? '#38b05d' : '#45c86f')};
    --input-adornment-color: ${({ mode }) =>
      mode === 'light' ? '#9e9e9e' : '#757575'};
    --blue-50: ${({ mode }) => (mode === 'light' ? '#fafcff' : '#0a1e2e')};
    --blue-600: ${({ mode }) => (mode === 'light' ? '#1976d2' : '#90caf9')};
    --blue-border: ${({ mode }) =>
      mode === 'light' ? 'rgba(25,118,210,0.25)' : 'rgba(144,202,249,0.25)'};
    --green-700: ${({ mode }) => (mode === 'light' ? '#2e7d32' : '#a5d6a7')};
    --red-700: ${({ mode }) => (mode === 'light' ? '#c62828' : '#ffcdd2')};
    --yellow-400: ${({ mode }) => (mode === 'light' ? '#f59e0b' : '#fcd34d')};
    --yellow-50: ${({ mode }) => (mode === 'light' ? '#fff8e1' : '#1a1200')};
    --blue-100: ${({ mode }) => (mode === 'light' ? '#e3f2fd' : '#0a2540')};
    --blue-800: ${({ mode }) => (mode === 'light' ? '#1565c0' : '#90caf9')};
    --purple-50: ${({ mode }) => (mode === 'light' ? '#f3e5f5' : '#1a0a2e')};
    --purple-800: ${({ mode }) => (mode === 'light' ? '#6a1b9a' : '#ce93d8')};
    --orange-50: ${({ mode }) => (mode === 'light' ? '#fff3e0' : '#1a0e00')};
    --orange-800: ${({ mode }) => (mode === 'light' ? '#e65100' : '#ffb74d')};
    --green-50: ${({ mode }) => (mode === 'light' ? '#e8f5e9' : '#001a00')};
    --pink-50: ${({ mode }) => (mode === 'light' ? '#fce4ec' : '#1a0010')};
    --green-700-10: ${({ mode }) =>
      mode === 'light' ? 'rgba(46,125,50,0.1)' : 'rgba(165,214,167,0.12)'};
    --red-700-10: ${({ mode }) =>
      mode === 'light' ? 'rgba(198,40,40,0.1)' : 'rgba(255,205,210,0.12)'};
    --black-04: ${({ mode }) =>
      mode === 'light' ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)'};
    --black-08: ${({ mode }) =>
      mode === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'};
    --black-40: ${({ mode }) =>
      mode === 'light' ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.4)'};
    --black-48: ${({ mode }) =>
      mode === 'light' ? 'rgba(0,0,0,0.48)' : 'rgba(255,255,255,0.48)'};
    --green-400-08: ${({ mode }) =>
      mode === 'light' ? 'rgba(56,176,93,0.08)' : 'rgba(56,176,93,0.15)'};
    --green-400-10: ${({ mode }) =>
      mode === 'light' ? 'rgba(56,176,93,0.10)' : 'rgba(56,176,93,0.18)'};
    --green-400-12: ${({ mode }) =>
      mode === 'light' ? 'rgba(56,176,93,0.12)' : 'rgba(56,176,93,0.20)'};
    --red-santander: #ec0000;
    --blue-itau: #003087;
    --red-bradesco: #cc092f;
    --white: #ffffff;
    --primary-mix-9: ${({ mode }) =>
      mode === 'light'
        ? 'rgba(71, 180, 236, 0.09)'
        : 'rgba(58, 168, 230, 0.14)'};
    --primary-mix-10: ${({ mode }) =>
      mode === 'light'
        ? 'rgba(71, 180, 236, 0.10)'
        : 'rgba(58, 168, 230, 0.16)'};
    --primary-mix-14: ${({ mode }) =>
      mode === 'light'
        ? 'rgba(71, 180, 236, 0.14)'
        : 'rgba(58, 168, 230, 0.20)'};
    --primary-mix-16: ${({ mode }) =>
      mode === 'light'
        ? 'rgba(71, 180, 236, 0.16)'
        : 'rgba(58, 168, 230, 0.22)'};
  }

  html, body {
    background-color: var(--main-bg-color);
  }

  *, body, input, textarea, button {
    font: 400 Roboto, sans-serif;
  }

  body {
    margin: 0;
    -webkit-font-smoothing: antialiased;
  }
`;
