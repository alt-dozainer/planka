import React, { useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
// import TextareaAutosize from 'react-textarea-autosize';
import { Button, Form, Dropdown } from 'semantic-ui-react';
import { useDidUpdate, useToggle } from '../../../lib/hooks';

import { useClosableForm, useForm } from '../../../hooks';

import styles from './Add.module.scss';

const DEFAULT_DATA = {
  name: '',
};

const Add = React.forwardRef(({ children, onCreate, options, optionsId }, ref) => {
  const [t] = useTranslation();
  const [isOpened, setIsOpened] = useState(false);
  const [data, handleFieldChange, setData] = useForm(DEFAULT_DATA);
  const [focusNameFieldState, focusNameField] = useToggle();

  const nameField = useRef(null);
  const submitButtonRef = useRef(null);

  const open = useCallback(() => {
    setIsOpened(true);
  }, []);

  const close = useCallback(() => {
    setIsOpened(false);
  }, []);

  const submit = useCallback(() => {
    const cleanData = {
      ...data,
      name: data.name.trim(),
    };

    if (!cleanData.name) {
      // nameField.current.ref.current.select();
      return;
    }

    onCreate(cleanData);

    setData(DEFAULT_DATA);
    focusNameField();
  }, [onCreate, data, setData, focusNameField]);

  useImperativeHandle(
    ref,
    () => ({
      open,
      close,
    }),
    [open, close],
  );

  const handleChildrenClick = useCallback(() => {
    open();
  }, [open]);

  // const handleFieldKeyDown = useCallback(
  //   (event) => {
  //     if (event.key === 'Enter') {
  //       event.preventDefault();

  //       submit();
  //     }
  //   },
  //   [submit],
  // );

  const [handleFieldBlur, handleControlMouseOver, handleControlMouseOut] = useClosableForm(
    close,
    isOpened,
  );

  const handleSubmit = useCallback(() => {
    submit();
    close();
  }, [submit, close]);

  useEffect(() => {
    if (isOpened) {
      // nameField.current.ref.current.focus();
      nameField.current.searchRef.current.focus();
    }
  }, [isOpened]);

  useDidUpdate(() => {
    // nameField.current.ref.current.focus();
  }, [focusNameFieldState]);

  if (!isOpened) {
    return React.cloneElement(children, {
      onClick: handleChildrenClick,
    });
  }

  if (optionsId) {
    //
  }

  const getValue = options.find((i) => i.text === data.value)?.value;

  return (
    <Form className={styles.wrapper} onSubmit={handleSubmit}>
      {/* <TextArea
        ref={nameField}
        as={TextareaAutosize}
        name="name"
        value={data.name}
        placeholder={t('common.enterTaskDescription')}
        minRows={2}
        spellCheck={false}
        className={styles.field}
        onKeyDown={handleFieldKeyDown}
        onChange={handleFieldChange}
        onBlur={handleFieldBlur}
      /> */}
      <Dropdown
        ref={nameField}
        value={getValue || data.value}
        placeholder={getValue || data.name || t('common.enterTaskDescription')}
        // className={styles.field}
        // onKeyDown={handleFieldKeyDown}
        selection
        allowAdditions
        additionLabel=""
        onChange={(e, o) => {
          handleFieldChange(e, {
            name: 'name',
            value: o.options.find((i) => i.value === o.value)?.text || o.value,
          });
          // handleSubmit();
          setTimeout(() => {
            submitButtonRef.current?.ref?.current?.click();
          }, 100);
        }}
        onBlur={handleFieldBlur}
        search
        options={options}
        className="tasks-dropdown"
      />

      <div className={styles.controls}>
        {/* eslint-disable-next-line jsx-a11y/mouse-events-have-key-events */}
        <Button
          positive
          content={t('action.addTask')}
          onMouseOver={handleControlMouseOver}
          onMouseOut={handleControlMouseOut}
          ref={submitButtonRef}
        />
      </div>
    </Form>
  );
});

Add.propTypes = {
  children: PropTypes.element.isRequired,
  onCreate: PropTypes.func.isRequired,
  options: PropTypes.array.isRequired, // eslint-disable-line react/forbid-prop-types
  optionsId: PropTypes.string,
};

Add.defaultProps = {
  optionsId: undefined,
};

export default React.memo(Add);
