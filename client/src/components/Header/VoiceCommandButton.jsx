import React, { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Icon, Loader, Menu, Popup } from 'semantic-ui-react';

import styles from './VoiceCommandButton.module.css';

const STATES = {
  IDLE: 'idle',
  RECORDING: 'recording',
  PROCESSING: 'processing',
};

const SILENCE_THRESHOLD = 0.01;
const SILENCE_DURATION = 2000; // ms of silence before auto-stop
const MIN_RECORD_TIME = 1000; // minimum recording time before silence detection kicks in

// Generate a 10s silent WAV blob for media session activation
function createSilentWavBlob() {
  const sampleRate = 8000;
  const numSamples = sampleRate * 10;
  const wavBuffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(wavBuffer);
  const writeStr = (offset, str) => {
    for (let i = 0; i < str.length; i += 1) view.setUint8(offset + i, str.charCodeAt(i));
  };
  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, numSamples * 2, true);
  // Data is already zeroed (silence)
  return new Blob([wavBuffer], { type: 'audio/wav' });
}

const VoiceCommandButton = React.memo(({ boardId, onProcess }) => {
  const [state, setState] = useState(STATES.IDLE);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const animFrameRef = useRef(null);
  const recordStartRef = useRef(null);
  const mediaSessionRef = useRef(null);
  const programmaticPauseRef = useRef(false);
  const stateRef = useRef(state);

  stateRef.current = state;

  const stopRecording = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const startRecording = useCallback(async () => {
    if (stateRef.current !== STATES.IDLE) return;

    // Pause silent media session audio so it doesn't interfere with mic
    if (mediaSessionRef.current) {
      programmaticPauseRef.current = true;
      mediaSessionRef.current.pause();
      programmaticPauseRef.current = false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm',
      });

      chunksRef.current = [];
      mediaRecorderRef.current = mediaRecorder;
      recordStartRef.current = Date.now();

      // Set up audio analysis for silence detection
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      const dataArray = new Float32Array(analyser.fftSize);

      const checkSilence = () => {
        if (!analyserRef.current) return;

        analyserRef.current.getFloatTimeDomainData(dataArray);

        // Calculate RMS volume
        let sum = 0;
        for (let i = 0; i < dataArray.length; i += 1) {
          sum += dataArray[i] * dataArray[i];
        }
        const rms = Math.sqrt(sum / dataArray.length);

        const elapsed = Date.now() - recordStartRef.current;

        if (rms < SILENCE_THRESHOLD && elapsed > MIN_RECORD_TIME) {
          if (!silenceTimerRef.current) {
            silenceTimerRef.current = setTimeout(() => {
              stopRecording();
            }, SILENCE_DURATION);
          }
        } else if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }

        animFrameRef.current = requestAnimationFrame(checkSilence);
      };

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach((track) => track.stop());

        // Resume silent media session audio for headset button support
        if (mediaSessionRef.current) {
          programmaticPauseRef.current = true;
          mediaSessionRef.current
            .play()
            .catch(() => {})
            .finally(() => {
              programmaticPauseRef.current = false;
            });
        }

        setState(STATES.PROCESSING);
        onProcess(boardId, audioBlob);

        setTimeout(() => {
          setState(STATES.IDLE);
        }, 3000);
      };

      mediaRecorder.start();
      setState(STATES.RECORDING);
      animFrameRef.current = requestAnimationFrame(checkSilence);
    } catch (error) {
      setState(STATES.IDLE);
    }
  }, [boardId, onProcess, stopRecording]);

  const handleClick = useCallback(() => {
    if (state === STATES.IDLE) {
      startRecording();
    } else if (state === STATES.RECORDING) {
      stopRecording();
    }
  }, [state, startRecording, stopRecording]);

  // Keyboard shortcut: Ctrl+Shift+V
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.code === 'KeyV') {
        e.preventDefault();
        if (stateRef.current === STATES.IDLE) {
          startRecording();
        } else if (stateRef.current === STATES.RECORDING) {
          stopRecording();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [startRecording, stopRecording]);

  // Bluetooth headset button support via silent audio + media session.
  // Windows SMTC routes headset buttons to the <audio> element's pause event.
  useEffect(() => {
    if (!('mediaSession' in navigator)) return undefined;

    const blob = createSilentWavBlob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.loop = true;

    let debounceTimer = null;
    audio.addEventListener('pause', () => {
      if (programmaticPauseRef.current) return;
      if (debounceTimer) return;
      debounceTimer = setTimeout(() => {
        debounceTimer = null;
      }, 500);

      if (stateRef.current === STATES.IDLE) {
        startRecording();
      } else if (stateRef.current === STATES.RECORDING) {
        stopRecording();
        // Resume silent audio so headset button stays active for next press
        programmaticPauseRef.current = true;
        audio
          .play()
          .catch(() => {})
          .finally(() => {
            programmaticPauseRef.current = false;
          });
      }
    });

    mediaSessionRef.current = audio;

    // Activate on first user gesture
    const handleGesture = () => {
      audio.play().catch(() => {});
      navigator.mediaSession.metadata = new window.MediaMetadata({
        title: 'Planka Voice Command',
        artist: 'Ready',
      });
      navigator.mediaSession.playbackState = 'playing';
      window.removeEventListener('click', handleGesture);
    };
    window.addEventListener('click', handleGesture);

    return () => {
      window.removeEventListener('click', handleGesture);
      audio.pause();
      audio.src = '';
      URL.revokeObjectURL(url);
      mediaSessionRef.current = null;
    };
  }, [startRecording, stopRecording]);

  // Cleanup on unmount
  useEffect(
    () => () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    },
    [],
  );

  const renderIcon = () => {
    if (state === STATES.PROCESSING) {
      return <Loader active inline size="tiny" inverted />;
    }
    return <Icon fitted name="microphone" />;
  };

  const popupContent = () => {
    switch (state) {
      case STATES.RECORDING:
        return 'Recording... (auto-stops on silence)';
      case STATES.PROCESSING:
        return 'Processing voice command...';
      default:
        return 'Voice command (Ctrl+Shift+V)';
    }
  };

  return (
    <Popup
      content={popupContent()}
      position="bottom right"
      trigger={
        <Menu.Item
          className={classNames(styles.button, {
            [styles.recording]: state === STATES.RECORDING,
            [styles.processing]: state === STATES.PROCESSING,
          })}
          onClick={handleClick}
        >
          {renderIcon()}
        </Menu.Item>
      }
    />
  );
});

VoiceCommandButton.propTypes = {
  boardId: PropTypes.string.isRequired,
  onProcess: PropTypes.func.isRequired,
};

export default VoiceCommandButton;
