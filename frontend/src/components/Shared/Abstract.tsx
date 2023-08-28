import styled from "@emotion/styled";

interface MarginProps {
    ml?: number;
    mr?: number;
    mt?: number;
    mb?: number;
    center?: boolean;
    bold?: boolean;
    grey?: boolean;
    white?: boolean;
    upper?: boolean;
}

const margins = (props: any) => `
    margin: 0;
    padding 0;
    margin-left: ${props.ml ? props.ml * 4 : 0}px;
    margin-right: ${props.mr ? props.mr * 4 : 0}px;
    margin-top: ${props.mt ? props.mt * 4 : 0}px;
    margin-bottom: ${props.mb ? props.mb * 4 : 0}px;
    text-align: ${props.center ? 'center' : 'left'};
    font-weight: ${props.bold ? '500' : '400'};
    
    color: ${
        props.grey ? 'grey' :
            props.white ? 'white !important' :
                'inherit'
    };
    text-transform: ${props.upper ? 'uppercase' : 'none'};
`;

export const div = styled.div<MarginProps>`${margins}`;
export const img = styled.img<MarginProps>`${margins}`;
export const p = styled.p<MarginProps>`${margins}`;
export const span = styled.span<MarginProps>`${margins}`;
export const h1 = styled.h1<MarginProps>`${margins}`;
export const h2 = styled.h2<MarginProps>`${margins}`;
export const h3 = styled.h3<MarginProps>`${margins}`;
export const h4 = styled.h4<MarginProps>`${margins}`;
export const h5 = styled.h5<MarginProps>`${margins}`;
export const h6 = styled.h6<MarginProps>`${margins}`;



