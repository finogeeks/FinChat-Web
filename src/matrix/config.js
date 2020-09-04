export const DEFAULT_ENCRYPTION_ALGORITHM = 'm.megolm.v1.aes-sha2';
// export const DB_NAME = `${APP_ALIAS}-new-${DEBUG ? 'debug' : 'prod'}`;
export const AVATAR_SIZE = 64;
export const MAX_MESSAGES_SHOW = 50;
export const FILTER_DEFINITION = {
  room: {
    timeline: {
      limit: MAX_MESSAGES_SHOW,
      types: [
        'm.room.message',
        'm.room.create',
        'm.room.member',
        'm.room.name',
        'm.room.encryption',
        'm.room.encrypted',
        'm.room.redaction',
        'm.room.power_levels',
        'm.room.history_visibility',
        'm.room.archive',
        'm.room.topic',
        'm.call.invite',
        'm.call.answer',
        'm.call.candidates',
        'm.call.hangup',
        'm.presence',
      ],
    },
  },
};
