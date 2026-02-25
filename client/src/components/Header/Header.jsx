import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Link } from 'react-router-dom';
import { Button, Icon, Menu } from 'semantic-ui-react';
import { usePopup } from '../../lib/popup';

import Paths from '../../constants/Paths';
import Config from '../../constants/Config';
import { ProjectBackgroundTypes } from '../../constants/Enums';
import NotificationsStep from './NotificationsStep';
import VoiceCommandButton from './VoiceCommandButton';
import User from '../User';
import UserStep from '../UserStep';

import styles from './Header.module.scss';

const POPUP_PROPS = {
  position: 'bottom right',
};

const { APP_NAME } = Config;

const Header = React.memo(
  ({
    project,
    user,
    notifications,
    isLogouting,
    canEditProject,
    canEditUsers,
    boardId,
    onProjectSettingsClick,
    onUsersClick,
    onNotificationDelete,
    onUserSettingsClick,
    onLogout,
    onVoiceCommand,
  }) => {
    const handleProjectSettingsClick = useCallback(() => {
      if (canEditProject) {
        onProjectSettingsClick();
      }
    }, [canEditProject, onProjectSettingsClick]);

    const NotificationsPopup = usePopup(NotificationsStep, POPUP_PROPS);
    const UserPopup = usePopup(UserStep, POPUP_PROPS);

    return (
      <div className={styles.wrapper}>
        {!project && (
          <Link to={Paths.ROOT} className={classNames(styles.logo, styles.title)}>
            {APP_NAME}
          </Link>
        )}
        <Menu inverted size="large" className={styles.menu}>
          {project && (
            <Menu.Menu position="left">
              <Menu.Item
                as={Link}
                to={Paths.ROOT}
                className={classNames(styles.item, styles.itemHoverable)}
              >
                <Icon fitted name="arrow left" />
              </Menu.Item>
              <Menu.Item className={classNames(styles.item, styles.title)}>
                {project.backgroundImage &&
                project.backgroundImage.url &&
                project.background.type === ProjectBackgroundTypes.GRADIENT ? (
                  <img
                    className="ui"
                    src={project.backgroundImage.url}
                    alt={project.name}
                    style={{ height: '2em', marginLeft: '-1em' }}
                  />
                ) : (
                  project.name
                )}
                {canEditProject && (
                  <Button
                    className={classNames(styles.editButton, styles.target)}
                    onClick={handleProjectSettingsClick}
                  >
                    <Icon fitted name="pencil" size="small" />
                  </Button>
                )}
              </Menu.Item>
            </Menu.Menu>
          )}
          <Menu.Menu position="right">
            {canEditUsers && (
              <Menu.Item
                className={classNames(styles.item, styles.itemHoverable)}
                onClick={onUsersClick}
              >
                <Icon fitted name="users" />
              </Menu.Item>
            )}
            {boardId && (
              <Menu.Item className={classNames(styles.item, styles.itemHoverable)}>
                <VoiceCommandButton boardId={boardId} onProcess={onVoiceCommand} />
              </Menu.Item>
            )}
            <NotificationsPopup items={notifications} onDelete={onNotificationDelete}>
              <Menu.Item className={classNames(styles.item, styles.itemHoverable)}>
                <Icon fitted name="bell" />
                {notifications.length > 0 && (
                  <span className={styles.notification}>{notifications.length}</span>
                )}
              </Menu.Item>
            </NotificationsPopup>
            <UserPopup
              isLogouting={isLogouting}
              onSettingsClick={onUserSettingsClick}
              onLogout={onLogout}
            >
              <Menu.Item className={classNames(styles.item, styles.itemHoverable)}>
                <span className={styles.userName}>{user.name}</span>
                <User name={user.name} avatarUrl={user.avatarUrl} size="small" />
              </Menu.Item>
            </UserPopup>
          </Menu.Menu>
        </Menu>
      </div>
    );
  },
);

Header.propTypes = {
  /* eslint-disable react/forbid-prop-types */
  project: PropTypes.object,
  user: PropTypes.object.isRequired,
  notifications: PropTypes.array.isRequired,
  /* eslint-enable react/forbid-prop-types */
  isLogouting: PropTypes.bool.isRequired,
  canEditProject: PropTypes.bool.isRequired,
  canEditUsers: PropTypes.bool.isRequired,
  boardId: PropTypes.string,
  onProjectSettingsClick: PropTypes.func.isRequired,
  onUsersClick: PropTypes.func.isRequired,
  onNotificationDelete: PropTypes.func.isRequired,
  onUserSettingsClick: PropTypes.func.isRequired,
  onLogout: PropTypes.func.isRequired,
  onVoiceCommand: PropTypes.func.isRequired,
};

Header.defaultProps = {
  project: undefined,
  boardId: undefined,
};

export default Header;
