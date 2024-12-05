import React, { useCallback, useImperativeHandle, useMemo, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { Button, Form, TextArea, Label } from 'semantic-ui-react';
import SimpleMDE from 'react-simplemde-editor';
import TextareaAutosize from 'react-textarea-autosize';

import styles from './DescriptionEdit.module.scss';

const DescriptionEdit = React.forwardRef(
  ({ children, defaultValue, onUpdate, isCurrentUserManager }, ref) => {
    const [t] = useTranslation();
    const [isOpened, setIsOpened] = useState(true);
    const [value, setValue] = useState(defaultValue);

    const firstField = useRef(null);
    const secondField = useRef(null);
    const editorRef = useRef(null);

    // const showToolbar = () => {
    //   let toolbar = editorRef.current;
    //   toolbar = toolbar.querySelector('.editor-toolbar');
    //   if (toolbar) {
    //     toolbar.style.display = 'block';
    //   }
    // };

    // const hideToolbar = () => {
    //   let toolbar = editorRef.current;
    //   toolbar = toolbar.querySelector('.editor-toolbar');
    //   if (toolbar) {
    //     toolbar.style.display = 'none';
    //   }
    // };

    const open = useCallback(() => {
      setIsOpened(true);
      setValue(defaultValue || '');
    }, [defaultValue, setValue]);

    const close = useCallback(() => {
      const cleanValue = value.trim() || null;

      if (cleanValue !== defaultValue) {
        onUpdate(cleanValue);
      }

      // setIsOpened(false);
      setValue(null);
    }, [defaultValue, onUpdate, value, setValue]);

    useImperativeHandle(
      ref,
      () => ({
        open,
        close,
        firstField,
        secondField,
      }),
      [open, close],
    );

    const handleChildrenClick = useCallback(() => {
      if (!getSelection().toString()) {
        open();
      }
    }, [open]);

    const focusEditor = () => {
      const editor = editorRef.current?.querySelector('.CodeMirror textarea');
      if (editor) {
        editor.focus();
      }
    };

    const handleFieldKeyDown = useCallback(
      (event) => {
        // if (event.key === 'Tab') {
        //   focusEditor();
        // }
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
        autofocus: false,
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

    const tabToDescription = (e) => {
      if (e.key === 'Tab') {
        setTimeout(() => {
          focusEditor(e);
        }, 100);
      }
    };

    return (
      <Form onSubmit={handleSubmit}>
        {/* {JSON.stringify(value)} */}
        {isCurrentUserManager && (
          <>
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
                onChange={(v) => setJSON(v, 'clientName')}
                tabIndex={1} // eslint-disable-line
                ref={firstField}
              />
            </div>
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
                onChange={(v) => setJSON(v, 'phoneNo')}
                tabIndex={2} // eslint-disable-line
                onKeyDown={tabToDescription}
                ref={secondField}
              />
            </div>
            {/* <div className="field">
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
                onChange={(v) => setJSON(v, 'carMake')}
              />
            </div> */}

            <Label pointing="below">Observații</Label>
          </>
        )}
        <SimpleMDE
          value={getJSON('description')}
          options={mdEditorOptions}
          placeholder={t('common.enterDescription')}
          className={styles.field}
          onKeyDown={handleFieldKeyDown}
          onChange={(v) => setJSON(v, 'description')}
          tabIndex={3} // eslint-disable-line
          ref={editorRef}
          // onFocus={showToolbar}
          // onBlur={hideToolbar}
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
