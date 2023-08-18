import {setCategories} from "@/state/reducers/categories";
import {api} from "@/state/api";


export const fetchCategories = () => async dispatch => {
    const response = await fetch('http://localhost:8000/api/category/categories/');
    const categories = await response.json();
    dispatch(setCategories(categories));
};