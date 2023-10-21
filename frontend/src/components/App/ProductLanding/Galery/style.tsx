import styled from '@emotion/styled'

export const GalleryWrapper = styled.div`
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    grid-gap: 1px;
    margin: 0;
    padding: 0;
    list-style: none;
`


export const GalleryImageWrapper = styled.div`
    width: 100%;
    height: auto;
    padding-top: 100%;
    position: relative;
    background-color: ${({theme}) => theme.color.primaryLight};
    
    img {
        position: absolute;
        width: 100%;
        height: 100%;
        object-fit: cover;
        top: 0;
    }
`