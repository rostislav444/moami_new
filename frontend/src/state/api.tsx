import {createApi, fetchBaseQuery} from '@reduxjs/toolkit/query/react'
// import fetch from 'cross-fetch';
import {HYDRATE} from 'next-redux-wrapper'


const baseUrl = 'http://localhost:8000/api/'

export const api = createApi({
    baseQuery: (url, api, extraOptions) => {
        return fetch(baseUrl + url, {
            headers: {
                'Content-Type': 'application/json',
            },
        }).then((response) => {
            if (!response.ok) {
                throw {error: new Error(response.statusText)}
            }
            return {data: response.json()}
        })
    },
    extractRehydrationInfo(action, {reducerPath}) {
        if (action.type === HYDRATE) {
            return action.payload[reducerPath]
        }
    },
    endpoints: (build) => ({
        getCategories: build.query({
            query: () => 'category/categories/',
        }),
        getCollections: build.query({
            query: () => 'category/collections/',
        }),
        getProductsByCategory: build.query({
            query: (categorySlug) => `catalogue/?category=${categorySlug}`,
        }),
    }),
})

export const {util: {getRunningQueriesThunk},} = api;
export const {getCategories, getCollections} = api.endpoints;