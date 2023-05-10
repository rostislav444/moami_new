import '@emotion/react';

declare module '@emotion/react' {
    export interface Theme {
        colors: {
            background: string;
        };
         color: {
            primary: string;
            primaryDark: string;
            primaryLight: string;
            grey: string;
            positive: string;
            negative: string;
            error: string;
        },
    }
}