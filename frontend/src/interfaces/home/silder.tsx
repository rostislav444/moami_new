export interface HomeSlideState {
    link_type: 'category' | 'collection' | 'product';
    title: string;
    description: string;
    image: string;
    image_2: string;
    link: string;
}

export interface HomeSliderProps {
    slides: HomeSlideState[];
}