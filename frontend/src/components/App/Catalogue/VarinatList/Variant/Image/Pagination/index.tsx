import {Dot, Wrapper} from "@/components/App/Catalogue/VarinatList/Variant/Image/Pagination/style";


interface PaginationProps {
    slidesLength: number;
    activeSlide: number;
    setActiveSlide: (slide: number) => void;
}


export const Pagination = ({slidesLength, activeSlide, setActiveSlide}: PaginationProps) => {
    return (
        <Wrapper>
            {Array.from(Array(slidesLength)
                .keys())
                  .map((key) =>
                      <Dot
                          key={key}
                          onClick={() => setActiveSlide(key)}
                          active={activeSlide === key}
                      />
                  )}
        </Wrapper>
    )
}