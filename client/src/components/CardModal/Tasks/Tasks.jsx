import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import { Progress } from 'semantic-ui-react';
import { closePopup } from '../../../lib/popup';

import DroppableTypes from '../../../constants/DroppableTypes';
import Item from './Item';
import Add from './Add';

import styles from './Tasks.module.scss';

const Tasks = React.memo(
  ({
    items,
    canEdit,
    onCreate,
    onUpdate,
    onMove,
    onDelete,
    options,
    optionsId,
    isCurrentUserManager,
  }) => {
    const [t] = useTranslation();

    const handleDragStart = useCallback(() => {
      closePopup();
    }, []);

    const handleDragEnd = useCallback(
      ({ draggableId, source, destination }) => {
        if (!destination || source.index === destination.index) {
          return;
        }

        onMove(draggableId, destination.index);
      },
      [onMove],
    );

    const handleUpdate = useCallback(
      (id, data) => {
        onUpdate(id, data);
      },
      [onUpdate],
    );

    const handleDelete = useCallback(
      (id) => {
        onDelete(id);
      },
      [onDelete],
    );

    const completedItems = items.filter((item) => item.isCompleted);

    const filteredOptions = options.map((option) => ({
      ...option,
      description: isCurrentUserManager ? option.description : '',
    }));

    const getDescriptionForItem = (item) => {
      return (
        options.find((option) => option.text === item.name)?.description ||
        item.name.split('[')?.[1]?.split(']')?.[0]
      );
    };

    const getTotal = items.reduce((i, s) => {
      const sum = getDescriptionForItem(s);
      return i + parseInt(sum || 0, 10);
    }, 0);

    return (
      <>
        {items.length > 0 && (
          <>
            <span className={styles.progressWrapper}>
              <Progress
                autoSuccess
                value={completedItems.length}
                total={items.length}
                color="blue"
                size="tiny"
                className={styles.progress}
              />
            </span>
            <span className={styles.count}>
              {completedItems.length}/{items.length}
            </span>
          </>
        )}
        <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <Droppable droppableId="tasks" type={DroppableTypes.TASK}>
            {({ innerRef, droppableProps, placeholder }) => (
              // eslint-disable-next-line react/jsx-props-no-spreading
              <div {...droppableProps} ref={innerRef}>
                {items.map((item, index) => (
                  <Item
                    description={getDescriptionForItem(item)}
                    key={item.id}
                    id={item.id}
                    index={index}
                    name={item.name}
                    isCompleted={item.isCompleted}
                    isPersisted={item.isPersisted}
                    canEdit={canEdit}
                    onUpdate={(data) => handleUpdate(item.id, data)}
                    onDelete={() => handleDelete(item.id)}
                    options={options}
                    optionsId={optionsId}
                    isCurrentUserManager={isCurrentUserManager}
                  />
                ))}
                <span className="tasks-footer">
                  {!!items.length && isCurrentUserManager && (
                    <p>
                      {t('total')} <span className="total-value">{getTotal}</span>
                    </p>
                  )}
                </span>
                {placeholder}
                {canEdit && (
                  <Add onCreate={onCreate} options={filteredOptions} optionsId={optionsId}>
                    <button type="button" className={styles.taskButton}>
                      <span className={styles.taskButtonText}>
                        {items.length > 0 ? t('action.addAnotherTask') : t('action.addTask')}
                      </span>
                    </button>
                  </Add>
                )}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </>
    );
  },
);

Tasks.propTypes = {
  items: PropTypes.array.isRequired, // eslint-disable-line react/forbid-prop-types
  canEdit: PropTypes.bool.isRequired,
  onCreate: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
  onMove: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  options: PropTypes.array.isRequired, // eslint-disable-line react/forbid-prop-types
  optionsId: PropTypes.string,
  isCurrentUserManager: PropTypes.bool,
};

Tasks.defaultProps = {
  optionsId: undefined,
  isCurrentUserManager: false,
};

export default Tasks;
