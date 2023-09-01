import Player from 'griffith'
import {Wrapper} from "@/components/Shared/Video/style";


export const Video = ({url}: { url: string }) => {
    const sources = {
        hd: {
            play_url: url,
        },
    }

    return <Wrapper>
        <Player
            id={url}
            sources={sources}
            autoplay
            initialObjectFit={'cover'}
            hiddenQualityMenu
            disablePictureInPicture
        />
    </Wrapper>

}