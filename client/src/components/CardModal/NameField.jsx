import React, { useCallback, useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
// import TextareaAutosize from 'react-textarea-autosize';
import { TextArea, Dropdown } from 'semantic-ui-react';
import { useDidUpdate, usePrevious } from '../../lib/hooks';

import api from '../../api';

import { useField } from '../../hooks';

import styles from './NameField.module.scss';

const NameField = React.memo(({ defaultValue, onUpdate, onBlur }) => {
  const { t } = useTranslation();
  const prevDefaultValue = usePrevious(defaultValue);
  const currentValue = useRef(defaultValue);
  const [value, handleChange, setValue] = useField(defaultValue);
  const [options, setOptions] = useState([{ text: defaultValue, value: defaultValue }]);

  const nameField = useRef();

  const isFocused = useRef(false);

  const scheduled = t('scheduled');

  useEffect(() => {
    if (value === scheduled) {
      nameField.current.searchRef.current.focus();
    }
  }, []); // eslint-disable-line

  // const handleFocus = useCallback(
  //   (e) => {
  //     isFocused.current = true;
  //     if (value === scheduled) {
  //       e.target.select();
  //     }
  //   },
  //   [value, scheduled],
  // );

  const handleKeyDown = useCallback((event) => {
    if (event.key === 'Enter') {
      event.preventDefault();

      event.target.blur();

      // return;
    }
  }, []);

  const handleKeyUp = useCallback((event) => {
    const q = event.target.value.trim();
    //
    if (q) {
      if (event.key.length === 1 || event.key === 'Backspace') {
        api.getMakes({ q }).then((r) => {
          const cars = [
            ...new Set(r.records?.map((car) => `${car.fields.make} ${car.fields.model}`)),
          ];

          setOptions(
            cars.map((car) => ({
              text: car,
              value: car,
            })) || [{ text: q, value: q }],
          );
        });
      }
    } else {
      setOptions([]);
    }
  }, []);

  const handleBlur = useCallback(
    (propagation) => {
      isFocused.current = false;

      const cleanValue = currentValue.current.trim();
      if (cleanValue) {
        if (cleanValue !== value) {
          onUpdate(cleanValue);
        }
      } else {
        setValue(defaultValue);
      }

      //
      if (propagation === false) {
        //
      } else {
        onBlur(propagation);
      }
    },
    [defaultValue, onUpdate, currentValue, value, setValue, onBlur],
  );

  useDidUpdate(() => {
    if (!isFocused.current && defaultValue !== prevDefaultValue) {
      setValue(defaultValue);
    }
  }, [defaultValue, prevDefaultValue, setValue]);

  const getValue = options.find((i) => i.text === value)?.value;

  return (
    <>
      {/* <TextArea
        as={TextareaAutosize}
        value={value}
        spellCheck={false}
        className={styles.field}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        onChange={handleChange}
        onBlur={handleBlur}
        autoFocus={value === scheduled}
        ref={nameField}
      /> */}
      <Dropdown
        ref={nameField}
        value={getValue || value}
        className={`${styles.field} ${styles.dropdown}`}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        selection
        allowAdditions
        additionLabel=""
        onChange={(e, o) => {
          const val = o.options.find((i) => i.value === o.value)?.text;
          setValue(val || o.value);
          currentValue.current = val || o.value;

          if (!val) {
            setOptions([{ text: o.value, value: o.value }]);
          }
          onUpdate(val || o.value);
        }}
        // onChange={handleChange}
        onBlur={handleBlur}
        search={(opts) => {
          const addition = opts.find((o) => o.key === 'addition');
          const r = opts.filter((o) => o.key !== 'addition');
          if (addition) {
            r.push(addition);
          }
          return r;
        }}
        options={options}
        autoFocus={value === scheduled}
        selectOnNavigation={false}
      />
      <TextArea
        autoFocus={value !== scheduled}
        onBlur={handleBlur}
        style={{ width: 1, height: 1, padding: 0, border: 0, outline: 0, opacity: 0.5 }}
      />
    </>
  );
});

NameField.propTypes = {
  defaultValue: PropTypes.string.isRequired,
  onUpdate: PropTypes.func.isRequired,
  onBlur: PropTypes.func.isRequired,
};

export default NameField;
