import '@emotion/react';

declare module '@emotion/react' {
    export interface Theme {
        fontFamily: string;
        colors: {
            background: string;
        };
         color: {
            primary: string;
            primaryDark: string;
            primaryLight: string;
            light: string;
            grey: string;
            positive: string;
            negative: string;
            error: string;
        },
    }
}