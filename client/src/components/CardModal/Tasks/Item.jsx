import React, { useCallback, useRef } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Draggable } from 'react-beautiful-dnd';
import { Button, Checkbox, Icon, Input } from 'semantic-ui-react';
import { usePopup } from '../../../lib/popup';

import NameEdit from './NameEdit';
import ActionsStep from './ActionsStep';
import Linkify from '../../Linkify';

import styles from './Item.module.scss';
import globalStyles from '../../../styles.module.scss';

const Item = React.memo(
  ({
    id,
    index,
    name,
    isCompleted,
    isPersisted,
    canEdit,
    onUpdate,
    onDelete,
    description,
    options,
  }) => {
    const nameEdit = useRef(null);

    const handleClick = useCallback(
      (e) => {
        const isDescription = e.target.id.indexOf('task-description') >= 0;
        if (isPersisted && canEdit && !isDescription) {
          nameEdit.current.open();
        }
      },
      [isPersisted, canEdit],
    );

    const handleNameUpdate = useCallback(
      (newName, type) => {
        onUpdate({
          name: type === 'description' ? `${name.split(' [')[0]} [${newName}]` : newName,
        });
      },
      [onUpdate, name],
    );

    const handleToggleChange = useCallback(() => {
      onUpdate({
        isCompleted: !isCompleted,
      });
    }, [isCompleted, onUpdate]);

    const handleNameEdit = useCallback(() => {
      nameEdit.current.open();
    }, []);

    const ActionsPopup = usePopup(ActionsStep);

    const getDescription = name.split('[')?.[1]?.split(']')?.[0];

    const getName = name.split(' [')[0];

    const getValue = options.find((o) => o.text === name)?.value || name;

    return (
      <Draggable draggableId={id} index={index} isDragDisabled={!isPersisted || !canEdit}>
        {({ innerRef, draggableProps, dragHandleProps }, { isDragging }) => {
          const contentNode = (
            // eslint-disable-next-line react/jsx-props-no-spreading
            <div {...draggableProps} {...dragHandleProps} ref={innerRef} className={styles.wrapper}>
              <span className={styles.checkboxWrapper}>
                <Checkbox
                  checked={isCompleted}
                  disabled={!isPersisted || !canEdit}
                  className={styles.checkbox}
                  onChange={handleToggleChange}
                />
              </span>
              <NameEdit
                ref={nameEdit}
                defaultValue={getValue}
                onUpdate={handleNameUpdate}
                options={options}
              >
                <div className={classNames(canEdit && styles.contentHoverable)}>
                  {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events,
                                               jsx-a11y/no-static-element-interactions */}
                  <span
                    className={classNames(styles.text, canEdit && styles.textEditable)}
                    onClick={handleClick}
                  >
                    <span className={classNames(styles.task, isCompleted && styles.taskCompleted)}>
                      <Linkify linkStopPropagation>{getName}</Linkify>
                    </span>
                    {/* <span className="task-description">{description}</span> */}
                    <Input
                      id={`task-description-${id}`}
                      className={classNames(
                        'task-description-edit',
                        'task-description',
                        getDescription
                          ? `${globalStyles.backgroundEggYellow} input-transparent`
                          : '',
                      )}
                      value={getDescription || description}
                      onChange={(e) => handleNameUpdate(e.target.value, 'description')}
                    />
                  </span>
                  {isPersisted && canEdit && (
                    <ActionsPopup onNameEdit={handleNameEdit} onDelete={onDelete}>
                      <Button
                        className={classNames(styles.button, styles.target)}
                        style={{ marginTop: 4 }}
                      >
                        <Icon fitted name="pencil" size="small" />
                      </Button>
                    </ActionsPopup>
                  )}
                </div>
              </NameEdit>
            </div>
          );

          return isDragging ? ReactDOM.createPortal(contentNode, document.body) : contentNode;
        }}
      </Draggable>
    );
  },
);

Item.propTypes = {
  id: PropTypes.string.isRequired,
  index: PropTypes.number.isRequired,
  name: PropTypes.string.isRequired,
  isCompleted: PropTypes.bool.isRequired,
  isPersisted: PropTypes.bool.isRequired,
  canEdit: PropTypes.bool.isRequired,
  onUpdate: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  description: PropTypes.string,
  options: PropTypes.array.isRequired, // eslint-disable-line react/forbid-prop-types
};

Item.defaultProps = {
  description: '',
};

export default Item;
