<template>
  <!-- <div class="login">
    <div class="logo-container">
      <img src="@/assets/images/login_logo.svg" alt="">
    </div>
    <div class="user-name">用户名：</div>
    <div class="user-name-input">
      <Input
        v-model="userId" placeholder="请输入" 
        style="width: 336px"
        @keyup.enter.native="handleLogin" 
        />
    </div>
    <div class="user-psw">密码：</div>
    <div class="user-psw-input">
      <Input
        :type="showPass ? 'password' : 'text'" 
        v-model="password" 
        placeholder="请输入" 
        style="width: 336px" 
        @keyup.enter.native="handleLogin"
        @keyup.native="handleInput"
        />
      <img v-if="showPass" @click="showPass = false" class="show-pass" src="@/assets/images/show_pass.png" alt="">
      <img v-else class="show-pass" @click="showPass = true" src="@/assets/images/hide_pass.png" alt="">
    </div>
    <Button
      type="primary"
      class="login-btn"
      @click="handleLogin"
      >
      <span v-if="loging">
        <Icon type="ios-loading" size=18 class="demo-spin-icon-load"></Icon>Loging
      </span>
      <span v-else>登陆</span>
      <div v-if="loging || cantLogin" @click.stop="" class="load-mask"></div>
    </Button>
    <div class="access-options">
      <div class="access-options-btn">忘记密码?</div>
      <div class="access-options-btn">快速注册</div>
    </div>
  </div> -->
  <div>
    <Login v-if="step === 'login'" @changeStep="changeStep"></Login>
    <Register v-if="step === 'register'" @changeStep="changeStep" @transmitData="transmitData"></Register>
    <Resetinfo v-if="step === 'resetinfo'" @changeStep="changeStep" @resetPassword="resetPassword"></Resetinfo>
    <Userinfo v-if="step === 'userinfo'" @changeStep="changeStep" @signUp="signUp"></Userinfo>
    <Verifyphone v-if="step === 'verifyphone'" @changeStep="changeStep" @transmitData="transmitData"></Verifyphone>
  </div>
</template>

<script lang="js">
import IAM from '@/model/iam';
import Matrix from '@/matrix';
import emitter from '@/utils/event-emitter';
import { cloneDeep } from 'lodash';
// const { login, startMatrix } = require('./utils.js');
import { login, startMatrix } from '../../utils.js';
import Login from './Components/Login.vue';
import Register from './Components/Register.vue';
import Resetinfo from './Components/Resetinfo.vue';
import Userinfo from './Components/Userinfo.vue';
import Verifyphone from './Components/Verifyphone.vue';

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
      registeData: {},
      resetInfo: {},
    };
  },
  components: {
    'Login': Login,
    'Register': Register,
    'Resetinfo': Resetinfo,
    'Userinfo': Userinfo,
    'Verifyphone': Verifyphone,
  },
  async mounted() {
    this.$store.commit('setAfterlog', false);
  },
  methods: {
    async resetPassword(password) {
      const resetRes = await IAM.changeBySms({
        phone: this.resetInfo.phoneNum,
        verifyCode: this.resetInfo.verifyCode,
        password: password
      });
      console.log('resetPassword: ', resetRes);
      if (resetRes.status === 200) {
        this.$Message.info('重置密码成功！');
        this.step = 'login';
      } else {
        this.$Message.error(resetRes.data.error)
      }
    },
    transmitData(key, data) {
      this[key] = Object.assign(this[key], data)
    },
    async signUp(userId, password) {
      const registeRes = await IAM.userRegist({
        phone: this.registeData.phoneNum,
        verifyCode: this.registeData.verifyCode,
        account: userId,
        password: password
      });
      console.log('singUp: ', registeRes);
      if (registeRes.status === 201) {
        this.$Message.info('注册成功！');
        this.step = 'login';
        this.userId = userId;
        this.password = password;
      } else {
        this.$Message.error(registeRes.data.error)
      }
    },
    async handleLogin() {
      // console.log('handleLogin');
      if (this.loging || this.cantLogin) return;
      this.loging = true;
      const loginRes = await login(this.userId, this.password);
      this.loging = false;
      if (loginRes) {
        // console.log(loginRes);
        this.$Message.info(loginRes.data.error);
        this.$store.commit('setShowLoadingMask', false);
      }
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
    changeStep(newstep) {
      this.step = newstep;
    },
  },
  watch: {
    userId() {
      if (!this.userId || !this.password) {
        this.cantLogin = true;
      }
      if (this.userId && this.password) {
        this.cantLogin = false;
      }
    },
    password(val) {
      // // console.log(this.checkStr(val));
      if (!this.userId || !this.password) {
        this.cantLogin = true;
      }
      if (this.userId && this.password) {
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
    display: flex;
    justify-content: space-between;
    width: 336px;
    margin: 0 auto;
    color: #4285f4;
    margin-top: 8px;
    font-weight: 700;
    .access-options-btn{
      cursor: pointer;
    }
  }
}
</style>
