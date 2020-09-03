<template>
  <div class="about">
    <div class="button" @click="getEnv">
      getEnv {{env}}
    </div>
    {{wxdata}}
  </div>
</template>

<script lang="js">
export default {
  data() {
    return {
      wxdata: {},
      env: '',
    };
  },
  async mounted() {
    console.log(wx.miniProgram.getEnv);
    wx.miniProgram.getEnv(function(res) { 
      console.log(res);
    });
    // console.log(this.$route);
    const wxdata = JSON.parse(this.$route.query.wxdata);
    // console.log(wxdata);
    this.wxdata = wxdata;
    // function ready() {
    //   alert(window.__wxjs_environment === 'miniprogram') // true
    // }
    // if (!window.WeixinJSBridge || !WeixinJSBridge.invoke) {
    //   document.addEventListener('WeixinJSBridgeReady', ready, false)
    // } else {
    //   ready()
    // }
    // if () {

    // }
  },
  methods: {
    async getEnv() {
      // console.log(wx.miniProgram);
      // let env = 'etst';
      // await new Promise((resolve, reject) => {
      //   wx.miniProgram.getEnv(function(res) { 
      //     env = res.miniprogram;
      //     alert('in wx.miniprogram.getenv') 
      //     resolve();
      //   });
      //   setTimeout(() => {
      //     resolve();
      //   }, 1000);
      // })
      // console.log(env);
      // alert(`env: 123`);
      wx.miniProgram.switchTab({url: '/pages/home/index'})
      wx.miniProgram.postMessage({ data: 'foo' })
      wx.miniProgram.postMessage({ data: {foo: 'bar'} })
      // // wx.miniProgram.postMessage({
      // //   env,
      // // });
      // this.env = env;
      // // this.$router.push('/login');
      // window.location = 'https://www.baidu.com/'
    }
  },
  watch: {
    
  }
}
</script>

<style lang="scss" scoped>
.button{
  height: 50px;
  line-height: 50px;
  border-bottom: 1px solid;
}
</style>