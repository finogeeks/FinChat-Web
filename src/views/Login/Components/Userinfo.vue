<template>
  <div class="login">
    <div class="logo-container">
      <!-- <img src="@/assets/images/login_logo.svg" alt=""> -->
      设置用户名和密码
    </div>
    <div class="user-name">用户名：</div>
    <div class="user-name-input">
      <Input
        autocomplete='off'
        v-model="userId" placeholder="5-16字符" 
        style="width: 336px"
        />
      <input type="password" autocomplete="new-password" style="display: none"/>
      <div class="tip">用户名允许小写字母、数字、下划线，首位需字母</div>
    </div>
    <div class="user-psw">密码：</div>
    <div class="user-psw-input">
      <Input
        autocomplete='off'
        :type="showPass ? 'password' : 'text'" 
        v-model="password" 
        placeholder="6-16字符" 
        style="width: 336px" 
        @keyup.native="handleInput"
        />
      <input type="password" autocomplete="new-password" style="display: none"/>
      <img v-if="showPass" @click="showPass = false" class="show-pass" src="@/assets/images/show_pass.png" alt="">
      <img v-else class="show-pass" @click="showPass = true" src="@/assets/images/hide_pass.png" alt="">
    </div>
    <Button
      type="primary"
      class="login-btn"
      @click="handleRegiste"
      >
      <span v-if="loging">
        <Icon type="ios-loading" size=18 class="demo-spin-icon-load"></Icon>Loging
      </span>
      <span v-else>注册</span>
      <div v-if="loging || cantLogin" @click.stop="" class="load-mask"></div>
    </Button>
    <div class="access-options">
      <div>
        <Checkbox v-model="hasRead">我已阅读并同意</Checkbox>
        <span style="margin-left: -8px;" class="blue" @click.stop="lookAgreement">《FinChat服务协议》</span>
      </div>
      <div class="go-back" @click="changeStep">
        返回
      </div>
    </div>
  </div>
</template>

<script lang="js">
import IAM from '@/model/iam';
import Matrix from '@/matrix';
import emitter from '@/utils/event-emitter';
import { cloneDeep } from 'lodash';
import { login, startMatrix } from '../../../utils.js';
import { testHostnameList } from '@/jwtRefresh';

export default {
  beforeRouteEnter(to, from, next) {
    // console.log('router enter login');
    next();
  },
  data() {
    return {
      userId: '',
      password: '',
      loging: false,
      cantLogin: true,
      showPass: true,
      // login-登录页  register-注册页  userinfo-设置用户名和面   verifyphone-找回密码验证手机号  resetinfo-重置密码 
      step: 'login',
      hasRead: false
    };
  },
  async mounted() {
    this.$store.commit('setAfterlog', false);
  },
  methods: {
    changeStep() {
      this.$emit('changeStep', 'register')
    },
    async handleRegiste() {
      if (this.loging || this.cantLogin) return;
      if (!this.validate()) return;
      this.$emit('signUp', this.userId, this.password);
      // this.loging = true;
      // const loginRes = await login(this.userId, this.password);
      // this.loging = false;
      // if (loginRes) {
      //   // console.log(loginRes);
      //   this.$Message.info(loginRes.data.error);
      //   this.$store.commit('setShowLoadingMask', false);
      // }
    },
    validate() {
      const p = /^[a-z][a-z0-9_]{5,15}$/;
      if (!p.test(this.userId)) {
        this.$Message.error('用户名需5-16位，允许小写字母、数字、下划线，首位需字母');
        return false
      }
      if (this.password.length < 6 || this.password.length > 16) {
        this.$Message.error('密码需6-16位字符');
        return false
      }
      return true;
    },
    handleInput() {
      // // console.log(this.password.indexOf(/[^/x00-/x80]/));
      // // console.log('handleInput');
      this.password=this.checkStr(this.password);
    },
    checkStr(str){ 
      var temp="" 
      for(var i=0;i<str.length;i++) 
           if(str.charCodeAt(i)>0&&str.charCodeAt(i)<255) 
              temp+=str.charAt(i) 
      return temp 
    },
    lookAgreement() {
      const hostname = window.location.hostname;
      window.open(`https://${hostname === 'localhost' ? 'finchat-dev.finogeeks.club' : hostname}/statics/agreement/index.html`)
    }
  },
  watch: {
    userId() {
      if (!this.userId || !this.password || !this.hasRead) {
        this.cantLogin = true;
      }
      if (this.userId && this.password && this.hasRead) {
        this.cantLogin = false;
      }
    },
    password() {
      if (!this.userId || !this.password || !this.hasRead) {
        this.cantLogin = true;
      }
      if (this.userId && this.password && this.hasRead) {
        this.cantLogin = false;
      }
    },
    hasRead() {
      if (!this.userId || !this.password || !this.hasRead) {
        this.cantLogin = true;
      }
      if (this.userId && this.password && this.hasRead) {
        this.cantLogin = false;
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.login{
  width: 440px;
  height: 401px;
  background-color: #ffffff;
  border-radius: 2px;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  position: absolute;
  .logo-container{
    font-size: 25px;
    text-align: left;
    width: 336px;
    margin: 0 auto;
    margin-top: 42px;
    img{
      margin-top: 38px;
    }
  }
  .user-name{
    margin-top: 36px;
    text-align: left;
    text-indent: 52px;
  }
  .user-name-input{
    margin-top: 8px;
    position: relative;
    .tip{
      position: absolute;
      left: 52px;
      color: #c8cbd0;
    }
  }
  .user-psw{
    margin-top: 20px;
    text-align: left;
    text-indent: 52px;
  }
  .user-psw-input{
    margin-top: 8px;
    position:relative;
    .show-pass{
      position: absolute;
      top: -3px;
      right: 46px;
      width: 40px;
      cursor: pointer;
    }
  }
  .login-btn{
    margin-top: 26px;
    width: 336px;
    position:relative;
    .load-mask{
      position: absolute;
      top: -1px;
      left: -1px;
      right: -1px;
      bottom: -1px;
      background-color: rgba(255, 255, 255, 0.5);
      cursor: not-allowed;
    }
  }
  .access-options{
    position: relative;
    display: flex;
    justify-content: space-around;
    width: 336px;
    margin: 0 auto;
    color: #c8cbd0;
    margin-top: 8px;
    font-weight: 700;
    .access-options-btn{
      cursor: pointer;
    }
    .blue{
      color: #4285f4;
      cursor: pointer;
    }
    .go-back{
      position: absolute;
      left: 0;
      cursor: pointer;
      color: #4285f4;
      font-weight: 700;
    }
  }
}
</style>
