import {theme} from "@/styles/Theme";

import {css} from '@emotion/react';


const globalStyles = css`
  html, body {
    background-color: ${theme.colors.background};
    font-size: 14px;
  },
  a {
    color: inherit;
    text-decoration: none;
  }
`;


 export default globalStyles