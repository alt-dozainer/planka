import Http from './http';

const { external: http } = Http;

/* Vehicles */

const getMakes = ({ q }, headers) =>
  http.get(
    `https://public.opendatasoft.com/api/records/1.0/search/?q=${q}&dataset=all-vehicles-model`,
    undefined,
    headers,
  );

export default {
  getMakes,
};
