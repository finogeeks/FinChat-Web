(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["chunk-0b631430"],{1206:function(t,e,n){},"3ea7":function(t,e,n){"use strict";n.r(e);var r=function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("div",{staticClass:"join-room"},[t._m(0),n("div",{staticClass:"room-name"},[t._v("\n    "+t._s(t.roomInfo.name)+"\n  ")]),t.canJoin?n("div",{staticClass:"join-btn",on:{click:t.joinRoom}},[t._v("\n    加入该频道\n  ")]):n("div",{staticClass:"cant-join-btn"},[t._v("\n    加入该频道\n  ")])])},o=[function(){var t=this,e=t.$createElement,r=t._self._c||e;return r("div",{staticClass:"room-avatar"},[r("img",{staticClass:"avatar-img",attrs:{src:n("a974"),alt:""}})])}],i=(n("1c01"),n("58b2"),n("8e6e"),n("f3e2"),n("ac6a"),n("456d"),n("0cd8"),n("d25f"),n("bd86")),a=(n("7514"),n("96cf"),n("3b8d")),c=n("2f62"),s=(n("7823"),n("a9e1")),u=n("e047");n("bc3a");function l(t,e){var n=Object.keys(t);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(t);e&&(r=r.filter((function(e){return Object.getOwnPropertyDescriptor(t,e).enumerable}))),n.push.apply(n,r)}return n}function m(t){for(var e=1;e<arguments.length;e++){var n=null!=arguments[e]?arguments[e]:{};e%2?l(n,!0).forEach((function(e){Object(i["a"])(t,e,n[e])})):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(n)):l(n).forEach((function(e){Object.defineProperty(t,e,Object.getOwnPropertyDescriptor(n,e))}))}return t}window.matrix;var R={components:{},props:[],data:function(){return{roomInfo:{},canJoin:!0}},mounted:function(){var t=Object(a["a"])(regeneratorRuntime.mark((function t(){var e,n,r,o=this;return regeneratorRuntime.wrap((function(t){while(1)switch(t.prev=t.next){case 0:if(!this.chatRoom){t.next=5;break}return t.next=3,s["a"].getChannelDetail(this.chatRoom);case 3:e=t.sent,this.roomInfo=e.data;case 5:n=function(){var t=setInterval((function(){var e=o.$store.state.roomList.find((function(t){return t.roomId===o.chatRoom}));e&&"leave"!==e.membership&&(clearInterval(t),o.enterRoom(e),u["a"].removeListener("ROOM_UPDATE",r))}),500)},r=function(){var t=Object(a["a"])(regeneratorRuntime.mark((function t(e){return regeneratorRuntime.wrap((function(t){while(1)switch(t.prev=t.next){case 0:if(e.roomId===o.chatRoom){t.next=2;break}return t.abrupt("return");case 2:if(o.viewingRoomId!==o.chatRoom){t.next=4;break}return t.abrupt("return");case 4:n();case 5:case"end":return t.stop()}}),t)})));return function(e){return t.apply(this,arguments)}}(),u["a"].addListener("ROOM_UPDATE",r),u["a"].addListener("ROOMS_INIT",(function(){setTimeout((function(){o.canJoin=!0}),0)}));case 9:case"end":return t.stop()}}),t,this)})));function e(){return t.apply(this,arguments)}return e}(),methods:{joinRoom:function(){var t=Object(a["a"])(regeneratorRuntime.mark((function t(){var e,n=this;return regeneratorRuntime.wrap((function(t){while(1)switch(t.prev=t.next){case 0:if(this.canJoin=!1,e=this.$store.state.roomList.find((function(t){return t.roomId===n.chatRoom})),e){t.next=22;break}if(t.prev=3,"public_chat"!==this.roomInfo.preset){t.next=9;break}return t.next=7,s["a"].joinRoom(this.chatRoom);case 7:t.next=16;break;case 9:if("private_chat"!==this.roomInfo.preset){t.next=14;break}return t.next=12,s["a"].inviteAndJoin(this.chatRoom,this.roomInfo.creator);case 12:t.next=16;break;case 14:return t.next=16,s["a"].joinRoom(this.chatRoom);case 16:t.next=21;break;case 18:t.prev=18,t.t0=t["catch"](3),this.$Message.error({background:!0,content:"无法加入该频道"});case 21:return t.abrupt("return");case 22:this.enterRoom(e);case 23:case"end":return t.stop()}}),t,this,[[3,18]])})));function e(){return t.apply(this,arguments)}return e}(),enterRoom:function(t){this.$emit("hideLingRoom"),this.$emit("enterRoom",t)}},computed:m({},Object(c["b"])(["showRoomList","windowHeight","windowWidth","userList","myinfo","hasOldTimelineTable","chatRoom"]),{roomList:function(){return this.isConsultMode?this.$store.state.roomList.filter((function(t){return"DISPATCH"!==t.roomType})):this.$store.state.roomList},hasUnread:function(){return this.roomList.reduce((function(t,e){return t+e.unread}),0)},viewingRoom:function(){var t=this;return this.roomList.find((function(e){return e.roomId===t.viewingRoomId}))||{}}}),watch:{}},h=R,f=(n("ab7d"),n("2877")),F=Object(f["a"])(h,r,o,!1,null,"6370342a",null);e["default"]=F.exports},a974:function(t,e){t.exports="data:image/png;base64,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"},ab7d:function(t,e,n){"use strict";var r=n("1206"),o=n.n(r);o.a}}]);