import styled from "@emotion/styled";

export interface MarginProps {
    ml?: number;
    mr?: number;
    mt?: number;
    mb?: number;
    pl?: number;
    pr?: number;
    pt?: number;
    pb?: number;
    center?: boolean;
    bold?: boolean;
    grey?: boolean;
    white?: boolean;
    upper?: boolean;
    capitalize?: boolean;
}

const margins = (props: any) => `
    margin: 0;
    padding 0;
    margin-left: ${props.ml ? props.ml * 4 : 0}px;
    margin-right: ${props.mr ? props.mr * 4 : 0}px;
    margin-top: ${props.mt ? props.mt * 4 : 0}px;
    margin-bottom: ${props.mb ? props.mb * 4 : 0}px;
    padding-left: ${props.pl ? props.pl * 4 : 0}px;
    padding-right: ${props.pr ? props.pr * 4 : 0}px;
    padding-top: ${props.pt ? props.pt * 4 : 0}px;
    padding-bottom: ${props.pb ? props.pb * 4 : 0}px;
    text-align: ${props.center ? 'center' : 'left'};
    font-weight: ${props.bold ? '500' : '400'};
    color: ${
        props.grey ? 'grey' :
            props.white ? 'white !important' :
                'inherit'
    };
    text-transform: ${props.upper ? 'uppercase' : props.capitalize ? 'capitalize' : 'none'};
`;

export const Div = styled.div<MarginProps>`${margins}`;
export const img = styled.img<MarginProps>`${margins}`;
export const p = styled.p<MarginProps>`${margins}`;
export const span = styled.span<MarginProps>`${margins}`;
export const h1 = styled.h1<MarginProps>`${margins}`;
export const h2 = styled.h2<MarginProps>`${margins}`;
export const h3 = styled.h3<MarginProps>`${margins}`;
export const h4 = styled.h4<MarginProps>`${margins}`;
export const h5 = styled.h5<MarginProps>`${margins}`;
export const h6 = styled.h6<MarginProps>`${margins}`;



