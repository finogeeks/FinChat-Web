<template>
  <div class="login">
    <div class="logo-container">
      <!-- <img src="@/assets/images/login_logo.svg" alt=""> -->
      手机号验证
    </div>
    <div class="user-name">手机号：</div>
    <div class="user-name-input">
      <Input
        v-model="phoneNum" placeholder="请输入11位手机号" 
        style="width: 336px"
        @keyup.enter.native="handleGoNext"
        @keyup.native="handlePhoneInput"
        />
    </div>
    <div class="user-psw">验证码：</div>
    <div class="user-psw-input">
      <Input
        v-model="verifyCode" 
        placeholder="请输入6位验证码" 
        style="width: 336px" 
        @keyup.enter.native="handleGoNext"
        @keyup.native="handleInput"
        />
      <!-- <img v-if="showPass" @click="showPass = false" class="show-pass" src="@/assets/images/show_pass.png" alt="">
      <img v-else class="show-pass" @click="showPass = true" src="@/assets/images/hide_pass.png" alt=""> -->
      <div v-if="!canGetVerifyCode" @click.stop="" class="get-verify-code mask"></div>
      <div v-if="countDown" class="get-verify-code grey">({{countSeconds}}s)后重新发送</div>
      <div v-else class="get-verify-code" @click="getVerifyCode">获取验证码</div>
    </div>
    <Button
      type="primary"
      class="login-btn"
      @click="handleGoNext"
      >
      <!-- <span v-if="loging">
        <Icon type="ios-loading" size=18 class="demo-spin-icon-load"></Icon>Loging
      </span> -->
      <div v-if="loging || !canGoNext" @click.stop="" class="load-mask"></div>
      <span>下一步</span>
    </Button>
    <div class="access-options">
      <div class="access-options-btn" @click="changeStep('login')">返回</div>
      <!-- <div class="access-options-btn">快速注册</div> -->
    </div>
  </div>
</template>

<script lang="js">
import IAM from '@/model/iam';
import Matrix from '@/matrix';
import emitter from '@/utils/event-emitter';
import { cloneDeep } from 'lodash';
// const { login, startMatrix } = require('./utils.js');
import { login, startMatrix } from '../../../utils.js';
import {isDev} from '@/jwtRefresh';

export default {
  beforeRouteEnter(to, from, next) {
    // console.log('router enter login');
    next();
  },
  data() {
    return {
      phoneNum: '',
      verifyCode: '',
      loging: false,
      canGoNext: false,
      showPass: true,
      canGetVerifyCode: false,
      // login-登录页  register-注册页  userinfo-设置用户名和面   verifyphone-找回密码验证手机号  resetinfo-重置密码 
      step: 'login',
      countDown: false,
      countSeconds: 60
    };
  },
  async mounted() {
    this.$store.commit('setAfterlog', false);
  },
  methods: {
    async getVerifyCode() {
      console.log('getVerifyCode');
      const getVerifyCodeRes = await IAM.getVerifyCode(this.phoneNum);
      if (getVerifyCodeRes.status !== 200) {
        this.$Message.error(getVerifyCodeRes.data.error);
        return
      }
      this.$Message.info('验证码发送成功，请查看短信');
      this.countDown = true;
      this.startCount();
    },
    startCount() {
      const counter = setInterval(() => {
        if (this.countSeconds > 0) {
          this.countSeconds--
        } else {
          clearInterval(counter);
          this.countDown = false;
          this.countSeconds = 60;
        }
      }, 1000);
    },
    handlePhoneInput() {
      this.phoneNum = this.checkNum(this.phoneNum)
    },
    checkNum(str){ 
      var temp="" 
      for(var i=0;i<str.length;i++) 
           if(!isNaN(str[i])) 
              temp+=str[i] 
      return temp 
    },
    async handleGoNext() {
      if (this.loging || !this.canGoNext) return;
      const verifyres = await IAM.verifyVerifyCode(this.phoneNum, this.verifyCode, 'register');
      console.log('verifyVerifyCode', verifyres);
      if (verifyres.status !== 200) {
        this.$Message.error(verifyres.data.error);
        return;
      }
      this.changeStep('userinfo');
      this.$emit('transmitData', 'registeData', {
        phoneNum: this.phoneNum,
        verifyCode: this.verifyCode,
      })
      // this.loging = true;
      // const loginRes = await login(this.phoneNum, this.verifyCode);
      // this.loging = false;
      // if (loginRes) {
      //   // console.log(loginRes);
      //   this.$Message.info(loginRes.data.error);
      //   this.$store.commit('setShowLoadingMask', false);
      // }
    },
    handleInput() {
      // // console.log(this.verifyCode.indexOf(/[^/x00-/x80]/));
      // // console.log('handleInput');
      this.verifyCode=this.checkStr(this.verifyCode);
    },
    checkStr(str){ 
      var temp="" 
      for(var i=0;i<str.length;i++) 
           if(str.charCodeAt(i)>0&&str.charCodeAt(i)<255) 
              temp+=str.charAt(i) 
      return temp 
    },
    changeStep(step) {
      this.$emit('changeStep', step)
    }
  },
  watch: {
    phoneNum() {
      // if (!this.phoneNum || !this.verifyCode) {
      //   this.canGoNext = false;
      // }
      // if (this.phoneNum && this.verifyCode) {
      //   this.canGoNext = true;
      // }
      if (this.phoneNum.length === 11) {
        this.canGetVerifyCode = true;
      } else {
        this.canGetVerifyCode = false;
      }
      if (this.phoneNum.length === 11 && this.verifyCode.length === 6) {
        this.canGoNext = true;
      } else {
        this.canGoNext = false;
      }
    },
    verifyCode(val) {
      // // console.log(this.checkStr(val));
      // if (!this.phoneNum || !this.verifyCode) {
      //   this.canGoNext = false;
      // }
      // if (this.phoneNum && this.verifyCode) {
      //   this.canGoNext = true;
      // }
      if (this.phoneNum.length === 11 && this.verifyCode.length === 6) {
        this.canGoNext = true;
      } else {
        this.canGoNext = false;
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
    .get-verify-code{
      position: absolute;
      right: 60px;
      cursor: pointer;
      color: #4285f4;
      font-weight: 700;
      font-size: 14px;
      line-height: 32px;
      top: 0;
      &.mask{
        width: 100px;
        height: 30px;
        background-color: rgba(255,255,255,0.5);
        z-index: 1;
        top: 1px;
        cursor: auto;
      }
      &.grey{
        color: grey;
        cursor: auto;
        font-weight: 400;
      }
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
