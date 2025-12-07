import axios from "axios";

const tmdbAxiosInstance = axios.create({
  baseURL: "https://api.themoviedb.org/3",
  headers: {
    Accept: "application/json",
  },
});

export default tmdbAxiosInstance;
