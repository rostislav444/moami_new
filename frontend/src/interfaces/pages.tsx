export interface PageState {
    name: string,
    slug: string,
    description: string
}

export interface PagesProps {
    pages: PageState[]
}