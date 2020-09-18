import Vue from 'vue'
import Vuex from 'vuex'
import { debounce as _debounce } from 'lodash';

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    roomList: [],
    roomsInited: false,
    viewingRoom: '',
    roomTimeLine: {},
    hasOldTimelineTable: {},
    showRoomList: true,
    windowHeight: '',
    windowWidth: '',
    userList: [],
    myinfo: {},
    chatRoom: '',
    showLoadingMask: false, // 全局loading事件
    afterlog: false,  //  判断登录状态
    roomListWidth: 241, //  房间列表宽
    roomListDraging: false, //  房间列表拖拽状态
    editorHeight: 120, //  房间列表宽
    editorDraging: false, //  房间列表拖拽状态
  },
  mutations: {
    setShowRoomList: (state, val) => {
      state.showRoomList = val;
    },
    setWindowHeight: (state, val) => {
      state.windowHeight = val;
    },
    setWindowWidth: (state, val) => {
      state.windowWidth = val;
    },
    initRoomList: (state, rooms) => {
      // // console.log(rooms);
      state.roomList = sortRoomByFavourive(rooms.filter(e => !e.isArchiveChannel));
    },
    setViewingRoom: (state, roomId) => {
      state.viewingRoom = roomId;
    },
    setRoomTimeLine: (state, room) => {

    },
    initRoomTimeline: (state, {roomId, roomTimeLine}) => {
      // console.log('STORE: initRoomTimeline');
      Vue.set(state.roomTimeLine, roomId, roomTimeLine);
      // console.log(state.roomTimeLine);
    },
    updateRoomTimeline: (state, {message, roomId}) => {
      // console.log('STORE: updateRoomTimeline');
      // console.log(state.roomTimeLine, message, roomId);
      if (message.redacts) {
        state.roomTimeLine[roomId].forEach(m => {
          if (m.eventId === message.redacts) {
            m.isRedacted = true;
          }
        });
      }
      state.roomTimeLine[roomId].push(message);
    },
    loadMoreTimeline: (state, {message, roomId}) => {
      // console.log('STORE: LOAD MORE TIMELINE');
      // // console.log(message, roomId);
      const resMessage = message.reverse();
      resMessage.forEach(e => {
        state.roomTimeLine[roomId].unshift(e);
      });
      // console.log(state.roomTimeLine);
    },
    // _debounce(async function () { // eslint-disable-line
    //   // // console.log('滚动到底部啦~~~');
    //   window.matrix.viewingRoom.setReceipt(this.viewingRoomId);
    // }, 500, { leading: true, trailing: false }),
    updateRoomList: (state, newroom) => {
      if (state.viewingRoom === newroom.roomId) {
        newroom.unread = 0;
      };
      // console.log('STORE: updateRoomList');
      if (newroom && (newroom.membership === 'leave' || newroom.isArchiveChannel)) {
        // console.log("newroom.membership === 'leave'");
        const idx = state.roomList.find(e => e.roomId === newroom.roomId);
        (!!idx) && state.roomList.splice(idx, 1);
      } else if (newroom) {
        let isNew = true;
        state.roomList.forEach((r, idx) => {
          if (newroom.roomId === r.roomId) {
            isNew = false;
            newroom.roomEditingMsg = r.roomEditingMsg;
            state.roomList.splice(idx, 1, newroom);
          }
        });
        if (isNew) {
          newroom.roomEditingMsg = '';
          state.roomList.push(newroom);
        }
      }
      state.roomList = sortRoomByFavourive(sortRoomByHasEditMsg(sortRoomByLastUpdateTime(state.roomList)));
      // state.roomList = sortRoomByFavourive(sortRoomByLastUpdateTime(state.roomList));
    },
    initUserList: (state, users) => {
      state.userList = users;
    },
    setMyInfo: (state, myinfo) => {
      state.myinfo = myinfo;
    },
    setOldTimelineTable: (state, { roomId, hasOldTimeline }) => {
      state.hasOldTimelineTable[roomId] =  hasOldTimeline;
    },
    setChatRoom: (state, val) => {
      state.chatRoom = val;
    },
    setShowLoadingMask: (state, val) => {
      state.showLoadingMask = val;
    },
    roomsHasInited: (state) => {
      state.roomsInited = true;
    },
    setAfterlog: (state, val) => {
      state.afterlog = val;
    },
    setRoomListWidth: (state, val) => {
      if (val < 241 || val > 640) return;
      state.roomListWidth = val;
    },
    setRoomListDraging: (state, val) => {
      state.roomListDraging = val;
    },
    setEditorHeight: (state, val) => {
      if (val < 80 || val > 450) return;
      state.editorHeight = val;
    },
    setEditorDraging: (state, val) => {
      state.editorDraging = val;
    }
  },
  actions: {

  }
})


const sortRoomByLastUpdateTime = (rooms) => {
  return rooms.sort((a, b) => {
    if (!a.lastUpdateTime) {
      return 1;
    }
    if (!b.lastUpdateTime) {
      return -1;
    }
    return a.lastUpdateTime - b.lastUpdateTime >= 0 ? -1 : 1;
  });
}

const sortRoomByFavourive = (rooms) => {
  return rooms.reduce((total, item) => {
    if (item.isTop) {
      total.unshift(item);
    } else {
      total.push(item);
    }
    return total;
  }, []);
}

const sortRoomByHasEditMsg = (rooms) => {
  return rooms.reduce((total, item) => {
    if (item.roomEditingMsg && !item.isTop && item.roomEditingMsg !== '<br>') {
      total.unshift(item);
    } else {
      total.push(item);
    }
    return total;
  }, []);
}