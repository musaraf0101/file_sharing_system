import axios from "axios";

export const SERVER_URL = import.meta.env.PROD 
  ? window.location.origin 
  : "http://localhost:5000";

export const api = axios.create({
  baseURL: SERVER_URL,
});
