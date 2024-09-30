import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { Popup } from '../lib/custom-ui';

import UserInformationEdit from './UserInformationEdit';

const UserInformationEditStep = React.memo(
  ({ defaultData, isNameEditable, onUpdate, onBack, onClose, currentUser }) => {
    const [t] = useTranslation();

    const handleUpdate = useCallback(
      (data) => {
        onUpdate(data);
        onClose();
      },
      [onUpdate, onClose],
    );

    return (
      <>
        <Popup.Header onBack={onBack}>
          {t('common.editInformation', {
            context: 'title',
          })}
        </Popup.Header>
        <Popup.Content>
          <UserInformationEdit
            defaultData={defaultData}
            isNameEditable={isNameEditable}
            onUpdate={handleUpdate}
            currentUser={currentUser}
          />
        </Popup.Content>
      </>
    );
  },
);

UserInformationEditStep.propTypes = {
  defaultData: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
  isNameEditable: PropTypes.bool.isRequired,
  onUpdate: PropTypes.func.isRequired,
  onBack: PropTypes.func,
  onClose: PropTypes.func.isRequired,
  currentUser: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
};

UserInformationEditStep.defaultProps = {
  onBack: undefined,
};

export default UserInformationEditStep;
