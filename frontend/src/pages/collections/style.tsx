import style from '@emotion/styled'


export const CollectionList = style.ul`
    position: relative;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    grid-gap: 24px;
    padding: 0;
    margin: 0;
    list-style: none;
`


export const CollectionItem = style.li`
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
`

export const CollectionImageWrapper = style.div`
    width: 100%;
    height: auto;
    padding-top: 100%;
    position: relative;
    overflow: hidden;
    border-radius: 50%;
    background-color: #f5f5f5;
    // border: 8px solid #f5f5f5;
`

export const CollectionImage = style.img`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-position: center;
    object-fit: cover;
`
