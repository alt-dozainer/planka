import React, { useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
// import TextareaAutosize from 'react-textarea-autosize';
import { Button, Form, Dropdown, Icon } from 'semantic-ui-react';

import { useField } from '../../../hooks';
// import { focusEnd } from '../../../utils/element-helpers';

import styles from './NameEdit.module.scss';

const NameEdit = React.forwardRef(
  ({ children, defaultValue, onUpdate, options /* , isCurrentUserManager */ }, ref) => {
    const [t] = useTranslation();
    const [isOpened, setIsOpened] = useState(false);
    const [value, handleFieldChange, setValue] = useField(null);

    const field = useRef(null);

    const open = useCallback(() => {
      setIsOpened(true);
      setValue(defaultValue);
    }, [defaultValue, setValue]);

    const close = useCallback(() => {
      setIsOpened(false);
      setValue(null);
    }, [setValue]);

    const submit = useCallback(() => {
      const cleanValue = value.trim();

      if (cleanValue && cleanValue !== defaultValue) {
        onUpdate(cleanValue);
      }

      close();
    }, [defaultValue, onUpdate, value, close]);

    useImperativeHandle(
      ref,
      () => ({
        open,
        close,
      }),
      [open, close],
    );

    // const handleFieldKeyDown = useCallback(
    //   (event) => {
    //     if (event.key === 'Enter') {
    //       event.preventDefault();

    //       submit();
    //     }
    //   },
    //   [submit],
    // );

    const handleFieldBlur = useCallback(() => {
      submit();
    }, [submit]);

    const handleSubmit = useCallback(() => {
      submit();
    }, [submit]);

    useEffect(() => {
      if (isOpened) {
        // focusEnd(field.current.ref.current);
      }
    }, [isOpened]);

    if (!isOpened) {
      return children;
    }

    const resetValue = () => {
      handleFieldChange(undefined, {
        name: 'name',
        value: defaultValue,
      });
      close();
    };

    const getValue = options.find((i) => i.text === value)?.value;

    return (
      <Form onSubmit={handleSubmit} className={styles.wrapper}>
        {/* <TextArea
          ref={field}
          as={TextareaAutosize}
          value={value}
          minRows={2}
          spellCheck={false}
          className={styles.field}
          onKeyDown={handleFieldKeyDown}
          onChange={handleFieldChange}
          onBlur={handleFieldBlur}
        /> */}
        <Dropdown
          ref={field}
          value={getValue || value}
          placeholder={getValue || value}
          className={styles.dropdown}
          // onKeyDown={handleFieldKeyDown}
          selection
          allowAdditions
          additionLabel=""
          onChange={(e, o) => {
            // handleFieldChange(e, {
            //   name: 'value',
            //   value: o.value, // o.options.find((i) => i.value === o.value)?.text,
            // });
            handleFieldChange(e, {
              name: 'name',
              value: o.options.find((i) => i.value === o.value)?.text || o.value,
            });
          }}
          onBlur={handleFieldBlur}
          search
          options={options}
        />
        <div className={styles.controls}>
          <Button positive content={t('action.save')} />
          <Button onClick={() => resetValue()}>
            <Icon fitted name="times" size="small" />
          </Button>
        </div>
      </Form>
    );
  },
);

NameEdit.propTypes = {
  children: PropTypes.element.isRequired,
  defaultValue: PropTypes.string.isRequired,
  onUpdate: PropTypes.func.isRequired,
  options: PropTypes.array.isRequired, // eslint-disable-line react/forbid-prop-types
  // isCurrentUserManager: PropTypes.bool.isRequired,
};

export default React.memo(NameEdit);
