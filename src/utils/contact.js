
/* eslint-disable */
class ContactManager {
  init($fcNormal, userId) {
    this.$fcNormal = $fcNormal;
    this.userId = userId;
    this.branches = null;
  }

  async getData(forceUpdate) {
    if (this.branches && !forceUpdate) {
      const data = JSON.parse(JSON.stringify(this.branches));
      this.getData(true);
      return data;
    }
    const branches = await this.getBranchOwn();
    this.branches = branches;
    return branches;
  }

  async processData(data, fn) {
    if (data.type === 'branch') {
      data.children = await Promise.all(data.children.map(async (item) => {
        try {
          const res = await this.processData(item, fn);
          return res;
        } catch (error) {
          console.log(error);
        }
        return item;
      }));
      const res = await fn(data);
      return res;
    }
    const res = await fn(data);
    return res;
  }

  async getBranchOwn() {
    const response = await this.getBranchByUserIds(this.userId);
    return response;
  }

  async getBranchByUserId(userId) {
    let response = {};
    let myBranches = [];
    response = await this.$fcNormal.getContactTopo(userId, 'branches');
    myBranches = response.data.branches;

    if (response.status && myBranches.length > 0) {
      const data = await Promise.all(myBranches.map(async (item) => {
        const branches = {
          id: item.id,
          name: item.name,
          type: 'branch',
          children: [],
          avatar: item.icon || 'company',
        };
        branches.children = [];
        branches.total = 0;
        try {
          await this.getBranches(branches);
        } catch (error) {
          console.log(error);
        }
        return branches;
      }));
      return data;
    }
    return [];
  }


  async getBranchByUserIds(userId) {
    let returnData = [];
    let response = {};
    let myBranches = [];
    let myUsers = [];
    // 获取首级目录 
    let bestBanches = [];
    let GETBEST = await this.$fcNormal.getContactTopo(userId, '');
    bestBanches = GETBEST.data;
    const myOrz = bestBanches.find((val)=>{
      return val.type === 'branches';
    });
    let newOrzObj = {
      id: 0,
      name: myOrz.name,
      avatar: 'company',
      type: "branch",
      total: 30,
      children: []
    };
    response = await this.$fcNormal.getContactTopo(userId, 'branches');
    // 新增user
    let sortString = response.data.sortBy;
    myUsers = response.data.users;
    myBranches = response.data.branches;
    if (response.status) {
      let branchList = [];
      let userList = [];
      let hasChildTotal = 0;
      let hasNoChildTotal = 0;
      if(myBranches.length > 0) {
        const data = await Promise.all(myBranches.map(async (item) => {
          const branches = {
            id: item.id,
            name: item.name,
            type: 'branch',
            children: [],
            avatar: item.icon || 'company',
          };
          branches.children = [];
          branches.total = 0;
          try {
            await this.getBranches(branches);
          } catch (error) {
            console.log(error);
          }
          return branches;
        }));
        for(let t of data) {
          if (t.type === 'item') {
            hasNoChildTotal += 1;
          } else {
            hasChildTotal += t.total;
          }
        };
        branchList = data;
      };
      if (!!myUsers && myUsers.length > 0) {
        let sortUsers = myUsers.sort((a, b)=>{
          return a[sortString] - b[sortString];
        })
        sortUsers.map((val)=>{
          branchList.unshift({
            id: val.fcid,
            fcid: val.fcid,
            userId: val.fcid,
            name: val.name,
            type: 'item',
            avatar: val.avatar
          });
        })
      };
      newOrzObj.total = hasChildTotal + hasNoChildTotal + userList.length;
      newOrzObj.children = branchList;
      returnData.push(newOrzObj);
      return returnData;
    } else {
      return [];
    }


    // bestBanches.map(async(val, index)=>{
    //   val.sortBy = 'topTime';
    //   val.avatar = val.icon;
    //   val.id = `tree-${index}`;
    //   response = await this.$fcNormal.getContactTopo(userId, val.type);
    //   myBranches = response.data.branches;

    //   if (response.status && myBranches.length > 0) {
    //     const data = await Promise.all(myBranches.map(async (item) => {
    //       const branches = {
    //         id: item.id,
    //         name: item.name,
    //         type: 'branch',
    //         children: [],
    //         avatar: item.icon || 'company',
    //       };
    //       branches.children = [];
    //       branches.total = 0;
    //       try {
    //         await this.getBranches(branches);
    //       } catch (error) {
    //         console.log(error);
    //       }
    //       return branches;
    //     }));
    //     console.log("处理后的data", data);
    //     val.children = data;
    //     // return data;
    //   }
    //   val.type = 'branch';
    //   // return [];
    // });
    // console.log("ssssssss----", bestBanches);
    // return bestBanches;
  }

  async getBranches(parentBranches) {
    const id = parentBranches.id;
    let response = {};
    response = await this.$fcNormal.getBranchesList(this.userId, id);
    const branches = [];
    let users = [];
    let total = 0;
    let sortBy = '';
    if (response.status) {
      sortBy = response.data.sortBy;
      parentBranches.sortBy = sortBy;
      if (response.data.users) {
        users = response.data.users.map(user => ({
          ...user,
          type: 'item',
          info: {
            branch: parentBranches.name,
          },
        }));
        if (sortBy === 'topTime') {
          users.sort((pre, cur) => {
            if (pre.topTime > cur.topTime) {
              return -1;
            }
            return 1;
          });
        }
        if (sortBy === 'rank') {
          users.sort((pre, cur) => {
            if (pre.rank > cur.rank) {
              return -1;
            }
            return 1;
          });
        }
        parentBranches.children.push(...users);
        parentBranches.total += users.length;
        total += users.length;
      }
      if (response.data.branches) {
        for (let i = 0; i < response.data.branches.length; i += 1) {
          const branch = {
            id: response.data.branches[i].id,
            name: response.data.branches[i].name,
            type: 'branch',
            children: [],
            avatar: 'group',
          };
          const data = await this.getBranches(branch); // eslint-disable-line
          // 此处等于0为了展示空部门
          if (data.total >= 0) {
            branch.children = data.result;
            branch.total = data.total;
            total += data.total;
            branches.push(branch);
            parentBranches.children.push(branch);
            parentBranches.total += branch.total;
          }
        }
      }
    }
    return {
      result: [].concat(users, branches),
      total,
      sortBy,
    };
  }
}

module.exports = ContactManager;
module.exports.default = ContactManager;
