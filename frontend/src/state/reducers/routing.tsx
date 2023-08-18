import {createSlice} from "@reduxjs/toolkit";


export interface RouteInterface {
    title: string,
    description?: string,
    image?: string,
    breadcrumbs: Array<object>,
}

export interface RouteProps {
    route: RouteInterface
}

const initialState: RouteProps = {
    route: {
        title: '',
        description: '',
        image: '',
        breadcrumbs: [],
    }
}


const routingSlice = createSlice({
    name: 'routing',
    initialState,
    reducers: {
        setRoute: (state, action) => {
            state.route = action.payload
        },
    },
})

export const {setRoute} = routingSlice.actions

export const selectRoute = (state: any) => state.routing.route

export default routingSlice.reducer
