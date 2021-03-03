export default {
  googleMapApiKey:
    process.env === "production"
      ? process.env.VUE_APP_GOOGLE_MAP_API_KEY
      : "AIzaSyByYRsYCaqKfkTKJO8OmIjc8oypF1m6kMY",
  googleGeocodingApiKey:
    process.env === "production"
      ? process.env.VUE_APP_GOOGLE_GEOCODING_API_KEY
      : "AIzaSyDmvnHW-jV1RVwE3VjqxMNjIouiacB9mvA"
};
