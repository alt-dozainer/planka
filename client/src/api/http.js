import { fetch } from 'whatwg-fetch';

import Config from '../constants/Config';

const http = {};
const httpExternal = {};

// TODO: add all methods
['GET', 'POST'].forEach((method) => {
  http[method.toLowerCase()] = (url, data, headers) => {
    const formData =
      data &&
      Object.keys(data).reduce((result, key) => {
        result.append(key, data[key]);

        return result;
      }, new FormData());

    return fetch(`${Config.SERVER_BASE_URL}/api${url}`, {
      method,
      headers,
      body: formData,
    })
      .then((response) =>
        response.json().then((body) => ({
          body,
          isError: response.status !== 200,
        })),
      )
      .then(({ body, isError }) => {
        if (isError) {
          throw body;
        }

        return body;
      });
  };
});

['GET', 'POST'].forEach((method) => {
  httpExternal[method.toLowerCase()] = (url, data, headers) => {
    const formData =
      data &&
      Object.keys(data).reduce((result, key) => {
        result.append(key, data[key]);

        return result;
      }, new FormData());

    return fetch(`${url}`, {
      method,
      headers,
      body: formData,
    })
      .then((response) =>
        response.json().then((body) => ({
          body,
          isError: response.status !== 200,
        })),
      )
      .then(({ body, isError }) => {
        if (isError) {
          throw body;
        }

        return body;
      });
  };
});

http.external = httpExternal;

export default http;
