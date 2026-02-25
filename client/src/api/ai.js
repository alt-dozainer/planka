import { fetch } from 'whatwg-fetch';

import Config from '../constants/Config';

const processVoiceCommand = (boardId, audioBlob, headers) => {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'audio.webm');

  return fetch(`${Config.SERVER_BASE_URL}/api/ai/voice-command?boardId=${boardId}`, {
    method: 'POST',
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

export default {
  processVoiceCommand,
};
