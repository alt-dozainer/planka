import React, { useCallback, useImperativeHandle, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { Button, Form, TextArea, Label } from 'semantic-ui-react';
import SimpleMDE from 'react-simplemde-editor';
import TextareaAutosize from 'react-textarea-autosize';

import styles from './DescriptionEdit.module.scss';

const DescriptionEdit = React.forwardRef(
  ({ children, defaultValue, onUpdate, isCurrentUserManager }, ref) => {
    const [t] = useTranslation();
    const [isOpened, setIsOpened] = useState(false);
    const [value, setValue] = useState(null);

    const open = useCallback(() => {
      setIsOpened(true);
      setValue(defaultValue || '');
    }, [defaultValue, setValue]);

    const close = useCallback(() => {
      const cleanValue = value.trim() || null;

      if (cleanValue !== defaultValue) {
        onUpdate(cleanValue);
      }

      setIsOpened(false);
      setValue(null);
    }, [defaultValue, onUpdate, value, setValue]);

    useImperativeHandle(
      ref,
      () => ({
        open,
        close,
      }),
      [open, close],
    );

    const handleChildrenClick = useCallback(() => {
      if (!getSelection().toString()) {
        open();
      }
    }, [open]);

    const handleFieldKeyDown = useCallback(
      (event) => {
        if (event.ctrlKey && event.key === 'Enter') {
          close();
        }
      },
      [close],
    );

    const handleSubmit = useCallback(() => {
      close();
    }, [close]);

    const mdEditorOptions = useMemo(
      () => ({
        autoDownloadFontAwesome: false,
        autofocus: true,
        spellChecker: false,
        status: false,
        toolbar: [
          'bold',
          'italic',
          'heading',
          'strikethrough',
          '|',
          'quote',
          'unordered-list',
          'ordered-list',
          'table',
          '|',
          'link',
          'image',
          '|',
          'undo',
          'redo',
          '|',
          'guide',
        ],
      }),
      [],
    );

    if (!isOpened) {
      return React.cloneElement(children, {
        onClick: handleChildrenClick,
      });
    }

    const setJSON = (v, k) => {
      let currentJson = {};
      try {
        currentJson = JSON.parse(value || '{}');
      } catch (e) {
        currentJson = { description: value };
      }
      const o = {
        ...currentJson,
        [k]: typeof v?.target?.value !== 'undefined' ? v?.target?.value : v,
      };
      setValue(JSON.stringify(o));
    };

    const getJSON = (k) => {
      let p = {};
      try {
        p = JSON.parse(value || '{}');
      } catch (e) {
        p = { [k]: k === 'description' ? value : '' };
      }
      return p[k];
    };

    const revert = () => {
      setValue(defaultValue);
    };

    return (
      <Form onSubmit={handleSubmit}>
        {/* {JSON.stringify(value)} */}
        {isCurrentUserManager && (
          <>
            <div className="field">
              <Label pointing="right">Telefon</Label>
              <TextArea
                // ref={textField}
                as={TextareaAutosize}
                name="phoneNo"
                value={getJSON('phoneNo')}
                placeholder="Număr telefon"
                minRows={1}
                spellCheck={false}
                className={styles.field}
                // onFocus={handleFieldFocus}
                // onKeyDown={handleFieldKeyDown}
                onChange={(v) => setJSON(v, 'phoneNo')}
                // onBlur={handleFieldBlur}
              />
            </div>
            <div className="field">
              <Label pointing="right">Client</Label>
              <TextArea
                // ref={textField}
                as={TextareaAutosize}
                name="clientName"
                value={getJSON('clientName')}
                placeholder="Client"
                minRows={1}
                spellCheck={false}
                className={styles.field}
                // onFocus={handleFieldFocus}
                // onKeyDown={handleFieldKeyDown}
                onChange={(v) => setJSON(v, 'clientName')}
                // onBlur={handleFieldBlur}
              />
            </div>
            <div className="field">
              <Label pointing="right">Mașină</Label>
              <TextArea
                // ref={textField}
                as={TextareaAutosize}
                name="carMake"
                value={getJSON('carMake')}
                placeholder="Mașină"
                minRows={1}
                spellCheck={false}
                className={styles.field}
                // onFocus={handleFieldFocus}
                // onKeyDown={handleFieldKeyDown}
                onChange={(v) => setJSON(v, 'carMake')}
                // onBlur={handleFieldBlur}
              />
            </div>
            <Label pointing="below">Descriere</Label>
          </>
        )}
        <SimpleMDE
          value={getJSON('description')}
          options={mdEditorOptions}
          placeholder={t('common.enterDescription')}
          className={styles.field}
          onKeyDown={handleFieldKeyDown}
          onChange={(v) => setJSON(v, 'description')}
        />
        <div className={styles.controls}>
          <Button positive content={t('action.save')} />
          <Button color="orange" onClick={revert}>
            Renunță
          </Button>
        </div>
      </Form>
    );
  },
);

DescriptionEdit.propTypes = {
  children: PropTypes.element.isRequired,
  defaultValue: PropTypes.string,
  onUpdate: PropTypes.func.isRequired,
  isCurrentUserManager: PropTypes.bool,
};

DescriptionEdit.defaultProps = {
  defaultValue: undefined,
  isCurrentUserManager: false,
};

export default React.memo(DescriptionEdit);
