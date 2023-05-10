import styled from '@emotion/styled';


export const DescriptionContainer = styled.div`
    display: block;
    position: relative;
    width: 100%;
    height: auto;
    margin-bottom: 24px;
`;

export const DescriptionText = styled.div<{ showMore: boolean }>`
    display: block;
    position: relative;
    width: 100%;
    height: auto;
    overflow: hidden;
    max-height: ${props => props.showMore ? '100%' : '100px'};
    transition: max-height 0.3s ease-in-out;
`;

export const ShowMoreButton = styled.button`
    display: block;
    position: relative;
    width: 100%;
    height: auto;
    font-size: 14px;
    font-weight: 400;
    color: ${props => props.theme.color.primary};
    background: none;
    border: none;
    cursor: pointer;
    margin-top: 8px;
`;