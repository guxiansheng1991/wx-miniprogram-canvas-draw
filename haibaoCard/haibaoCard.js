const requestWrap = require('../../../../common/requestWrap');
const url = require('../../../../common/url.js');
const logger = require('../../../../logs/log.js');
const haibaoUtil = require('../../common/haibaoUtil');
const util = require('../../../../common/util');
const storage = require('../../../../common/storage');

const storageTime = 30 * 60; // 半小时

/**
 * 邀请海报卡片
 * 新增模板思路如下(画canvas时为方便调试,可以将wxss中class为canvas1的定位代码注释,同时在wxml中将swiper注释,待调试结束再恢复原状):
 * 1. wxml中新增一个canvas, 设置不同的canvasId
 * 2. 再次调用const {canvas:canvasc1, ctx:ctxc1} = await this.createHaibao('c1');
              this.renderType0(canvasc1, ctxc1, 0);
 * 3. 新增一个renderType方法, 画出图片
*/
Page({

  /**
   * 页面的初始数据
   */
  data: {
    swiperData: [
      {
        index: 0, // 邀请码样式类别
        bg: ''
      },
      {
        index: 1,
        bg: ''
      },
      {
        index: 2,
        bg: ''
      }
    ],
    currentIndex: 0,
    qr: '',
    avatarUrl: '',
    nickName: ''
  },

  onLoad() {},
  async onShow() {
    const avatarUrl = wx.getStorageSync('avatarUrl');
    const nickName = wx.getStorageSync('nickName');
    this.setData({
      avatarUrl: avatarUrl || 'https://paio-cdn.visitshanghai.com.cn/domestic/yshxcx/fenxiao/2020/12/02/images/real-name-auth-avatar.png',
      nickName: nickName || ''
    });
    const sd = storage.get('haibao.geren', 'swiperData');
    if (sd) {
      this.setData({
        swiperData: sd
      });
    } else {
      this.getShareData();
    }
  },
  onShareAppMessage: function (res) {
    return util.getDefaultPageShareMessage();
  },
  getShareData() {
    wx.showLoading({
      title: '加载中...',
    });
    let _this = this;
    const data = {
      page: 'pages/haibao/gerenHaibao/recruitment/recruitment',
      bizType: 'PERSON_POSTER',
      extData: {
        "productId": ""
      },
    };
    requestWrap({
      url: url.getUrl.build,
      data: data,
      method: 'post',
      async success(res) {
        wx.hideLoading();
        if (res.data && res.data.code === 0) {
          // 海报生成逻辑
          try {
            const qrPath = await haibaoUtil.loadImgBase64(res.data.result);
            _this.setData({
              qr: `${qrPath}`
            });
            const {canvas:canvasc1, ctx:ctxc1} = await haibaoUtil.createHaibao('c1');
            _this.renderType0(canvasc1, ctxc1, 0);
            const {canvas:canvasc2, ctx:ctxc2} = await haibaoUtil.createHaibao('c2');
            _this.renderType1(canvasc2, ctxc2, 1);
            const {canvas:canvasc3, ctx:ctxc3} = await haibaoUtil.createHaibao('c3');
            _this.renderType2(canvasc3, ctxc3, 2);
          } catch(e) {
            wx.showToast({
              title: '生成海报失败',
              icon: 'none'
            });
          }
        } else if (res.data && res.data.code === 405) {
          util.goLoginPage();
        } else {
          wx.showToast({
            title: res.data && res.data.msg,
            icon: 'none'
          });
        }
      },
      fail(err) {
        logger.error(`数据返回异常${err}`);
        wx.showToast({
          title: '系统异常,请稍后重试',
          icon: 'none'
        });
      }
    })
  },
  myChange(e) {
    const source = e.detail.source;
    if (source === 'touch' || source === 'autoplay') {
      this.setData({
        currentIndex: e.detail.current
      });
    }
  },
  // 第一种样式
  async renderType0(canvas, ctx, arrayIndex) {
    wx.showLoading({
      title: '加载中...',
    });
    const imgBg = await haibaoUtil.loadImg(canvas, 'https://paio-cdn.visitshanghai.com.cn/domestic/yshxcx/fenxiao/2020/12/10/images/geren-haibao-1.jpg');
    const imgAvatar = await haibaoUtil.loadImg(canvas, this.data.avatarUrl);
    const imgQR = await haibaoUtil.loadImg(canvas, this.data.qr);
    const imgLine = await haibaoUtil.loadImg(canvas, 'https://paio-cdn.visitshanghai.com.cn/domestic/yshxcx/fenxiao/2020/12/09/images/haibao/haibao-line-img.png');
    /*------------画海报背景图片--------------*/
    ctx.drawImage(imgBg, 0, 0, canvas.width/haibaoUtil.dpr, canvas.height/haibaoUtil.dpr);

    // 画分享人黑色带圆角的背景
    haibaoUtil.toDrawRadiusRect({
      left: haibaoUtil.computedWAndD(30),
      top: haibaoUtil.computedWAndD(1065),
      width: haibaoUtil.computedWAndD(690),
      height: haibaoUtil.computedWAndD(221),
      borderRadius: haibaoUtil.computedWAndD(20),
    }, ctx);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    // 画头像
    ctx.save();
    ctx.beginPath();
    ctx.arc(haibaoUtil.computedWAndD(110), haibaoUtil.computedWAndD(1145), haibaoUtil.computedWAndD(50), 0, 2*Math.PI);
    ctx.clip();
    ctx.drawImage(imgAvatar, haibaoUtil.computedWAndD(60), haibaoUtil.computedWAndD(1095), haibaoUtil.computedWAndD(100), haibaoUtil.computedWAndD(100));
    ctx.restore();
    // 画分享人昵称
    ctx.font = `normal bold ${haibaoUtil.computedWAndD(30)}px sans-serif`;
    ctx.fillStyle = "#333333";
    // ctx.fillText(this.data.nickName, haibaoUtil.computedWAndD(183), haibaoUtil.computedWAndD(1128));
    haibaoUtil.drawTextWrapper(ctx, this.data.nickName, 42, 1, true, 308, 183, 1128);
    // 画分享文案
    ctx.font = `normal normal ${haibaoUtil.computedWAndD(22)}px sans-serif`;
    ctx.fillStyle = "#333333";
    ctx.fillText('邀请你成为游上海优选的小达人', haibaoUtil.computedWAndD(183), haibaoUtil.computedWAndD(1170));
    // 画分享文案下方图片
    ctx.drawImage(imgLine, haibaoUtil.computedWAndD(183), haibaoUtil.computedWAndD(1197), haibaoUtil.computedWAndD(284), haibaoUtil.computedWAndD(10));
    // 画扫描或长按识别二维码文字下的rect
    ctx.fillStyle = 'rgba(255,98,52,0.39)';
    ctx.fillRect(haibaoUtil.computedWAndD(183), haibaoUtil.computedWAndD(1250), haibaoUtil.computedWAndD(260), haibaoUtil.computedWAndD(9));
    // 画扫描或长按识别二维码文案
    ctx.font = `normal middle ${haibaoUtil.computedWAndD(26)}px sans-serif`;
    ctx.fillStyle = "#333333";
    ctx.fillText('扫描或长按识别二维码', haibaoUtil.computedWAndD(183), haibaoUtil.computedWAndD(1252));
    // 画分享码
    ctx.drawImage(imgQR, haibaoUtil.computedWAndD(526), haibaoUtil.computedWAndD(1095), haibaoUtil.computedWAndD(164), haibaoUtil.computedWAndD(164));
    try {
      const tempPath = await haibaoUtil.createHaibaoUrl(canvas);
      const k = `swiperData[${arrayIndex}].bg`;
      this.setData({
        [k]: tempPath
      });
      // 缓存到本地,有效期半小时
      storage.set('haibao.geren', 'swiperData', this.data.swiperData, storageTime);
    } catch(e) {
      console.error(e);
      logger.error('保存海报图片失败, 请稍后重试~',e);
    }
  },
  // 第二种样式
  async renderType1(canvas, ctx, arrayIndex) {
    wx.showLoading({
      title: '加载中...',
    });
    const imgBg = await haibaoUtil.loadImg(canvas, 'https://paio-cdn.visitshanghai.com.cn/domestic/yshxcx/fenxiao/2020/12/10/images/geren-haibao-2.jpg');
    const imgAvatar = await haibaoUtil.loadImg(canvas, this.data.avatarUrl);
    const imgQR = await haibaoUtil.loadImg(canvas, this.data.qr);
    const imgLine = await haibaoUtil.loadImg(canvas, 'https://paio-cdn.visitshanghai.com.cn/domestic/yshxcx/fenxiao/2020/12/09/images/haibao/haibao-line-img.png');
    
    /*------------画海报背景图片--------------*/
    ctx.drawImage(imgBg, 0, 0, canvas.width/haibaoUtil.dpr, canvas.height/haibaoUtil.dpr);

    // 画分享人黑色带圆角的背景
    haibaoUtil.toDrawRadiusRect({
      left: haibaoUtil.computedWAndD(30),
      top: haibaoUtil.computedWAndD(1065),
      width: haibaoUtil.computedWAndD(690),
      height: haibaoUtil.computedWAndD(221),
      borderRadius: haibaoUtil.computedWAndD(20),
    }, ctx);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    // 画头像
    ctx.save();
    ctx.beginPath();
    ctx.arc(haibaoUtil.computedWAndD(110), haibaoUtil.computedWAndD(1145), haibaoUtil.computedWAndD(50), 0, 2 * Math.PI);
    ctx.clip();
    ctx.drawImage(imgAvatar, haibaoUtil.computedWAndD(60), haibaoUtil.computedWAndD(1095), haibaoUtil.computedWAndD(100), haibaoUtil.computedWAndD(100));
    ctx.restore();
    // 画分享人昵称
    ctx.font = `normal bold ${haibaoUtil.computedWAndD(30)}px sans-serif`;
    ctx.fillStyle = "#333333";
    // ctx.fillText(this.data.nickName, haibaoUtil.computedWAndD(183), haibaoUtil.computedWAndD(1128));
    haibaoUtil.drawTextWrapper(ctx, this.data.nickName, 42, 1, true, 308, 183, 1128);
    // 画分享文案
    ctx.font = `normal normal ${haibaoUtil.computedWAndD(22)}px sans-serif`;
    ctx.fillStyle = "#333333";
    ctx.fillText('邀请你成为游上海优选的小达人', haibaoUtil.computedWAndD(183), haibaoUtil.computedWAndD(1170));
    // 画分享文案下方图片
    ctx.drawImage(imgLine, haibaoUtil.computedWAndD(183), haibaoUtil.computedWAndD(1197), haibaoUtil.computedWAndD(284), haibaoUtil.computedWAndD(10));
    // 画扫描或长按识别二维码文字下的rect
    ctx.fillStyle = 'rgba(255,98,52,0.39)';
    ctx.fillRect(haibaoUtil.computedWAndD(183), haibaoUtil.computedWAndD(1250), haibaoUtil.computedWAndD(260), haibaoUtil.computedWAndD(9));
    // 画扫描或长按识别二维码文案
    ctx.font = `normal middle ${haibaoUtil.computedWAndD(26)}px sans-serif`;
    ctx.fillStyle = "#333333";
    ctx.fillText('扫描或长按识别二维码', haibaoUtil.computedWAndD(183), haibaoUtil.computedWAndD(1252));
    // 画分享码
    ctx.drawImage(imgQR, haibaoUtil.computedWAndD(526), haibaoUtil.computedWAndD(1095), haibaoUtil.computedWAndD(164), haibaoUtil.computedWAndD(164));
    try {
      const tempPath = await haibaoUtil.createHaibaoUrl(canvas);
      const k = `swiperData[${arrayIndex}].bg`;
      this.setData({
        [k]: tempPath
      });
      // 缓存到本地,有效期半小时
      storage.set('haibao.geren', 'swiperData', this.data.swiperData, storageTime);
    } catch (e) {
      console.error(e);
      logger.error('保存海报图片失败, 请稍后重试~',e);
    }
  },
  // 第三种样式
  async renderType2(canvas, ctx, arrayIndex) {
    wx.showLoading({
      title: '加载中...',
    });
    const imgBg = await haibaoUtil.loadImg(canvas, 'https://paio-cdn.visitshanghai.com.cn/domestic/yshxcx/fenxiao/2020/12/10/images/geren-haibao-3.jpg');
    const imgAvatar = await haibaoUtil.loadImg(canvas, this.data.avatarUrl);
    const imgQR = await haibaoUtil.loadImg(canvas, this.data.qr);
    const imgLine = await haibaoUtil.loadImg(canvas, 'https://paio-cdn.visitshanghai.com.cn/domestic/yshxcx/fenxiao/2020/12/09/images/haibao/haibao-line-img.png');
    /*------------画海报背景图片--------------*/
    ctx.drawImage(imgBg, 0, 0, canvas.width/haibaoUtil.dpr, canvas.height/haibaoUtil.dpr);

    // 画分享人黑色带圆角的背景
    haibaoUtil.toDrawRadiusRect({
      left: haibaoUtil.computedWAndD(30),
      top: haibaoUtil.computedWAndD(1065),
      width: haibaoUtil.computedWAndD(690),
      height: haibaoUtil.computedWAndD(221),
      borderRadius: haibaoUtil.computedWAndD(20),
    }, ctx);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    // 画头像
    ctx.save();
    ctx.beginPath();
    ctx.arc(haibaoUtil.computedWAndD(110), haibaoUtil.computedWAndD(1145), haibaoUtil.computedWAndD(50), 0, 2*Math.PI);
    ctx.clip();
    ctx.drawImage(imgAvatar, haibaoUtil.computedWAndD(60), haibaoUtil.computedWAndD(1095), haibaoUtil.computedWAndD(100), haibaoUtil.computedWAndD(100));
    ctx.restore();
    // 画分享人昵称
    ctx.font = `normal bold ${haibaoUtil.computedWAndD(30)}px sans-serif`;
    ctx.fillStyle = "#333333";
    // ctx.fillText(this.data.nickName, haibaoUtil.computedWAndD(183), haibaoUtil.computedWAndD(1128));
    haibaoUtil.drawTextWrapper(ctx, this.data.nickName, 42, 1, true, 308, 183, 1128);
    // 画分享文案
    ctx.font = `normal normal ${haibaoUtil.computedWAndD(22)}px sans-serif`;
    ctx.fillStyle = "#333333";
    ctx.fillText('邀请你成为游上海优选的小达人', haibaoUtil.computedWAndD(183), haibaoUtil.computedWAndD(1170));
    // 画分享文案下方图片
    ctx.drawImage(imgLine, haibaoUtil.computedWAndD(183), haibaoUtil.computedWAndD(1197), haibaoUtil.computedWAndD(284), haibaoUtil.computedWAndD(10));
    // 画扫描或长按识别二维码文字下的rect
    ctx.fillStyle = 'rgba(255,98,52,0.39)';
    ctx.fillRect(haibaoUtil.computedWAndD(183), haibaoUtil.computedWAndD(1250), haibaoUtil.computedWAndD(260), haibaoUtil.computedWAndD(9));
    // 画扫描或长按识别二维码文案
    ctx.font = `normal middle ${haibaoUtil.computedWAndD(26)}px sans-serif`;
    ctx.fillStyle = "#333333";
    ctx.fillText('扫描或长按识别二维码', haibaoUtil.computedWAndD(183), haibaoUtil.computedWAndD(1252));
    // 画分享码
    ctx.drawImage(imgQR, haibaoUtil.computedWAndD(526), haibaoUtil.computedWAndD(1095), haibaoUtil.computedWAndD(164), haibaoUtil.computedWAndD(164));
    try {
      const tempPath = await haibaoUtil.createHaibaoUrl(canvas);
      const k = `swiperData[${arrayIndex}].bg`;
      this.setData({
        [k]: tempPath
      });
      // 缓存到本地,有效期半小时
      storage.set('haibao.geren', 'swiperData', this.data.swiperData, storageTime);
    } catch(e) {
      console.error(e);
      logger.error('保存海报图片失败, 请稍后重试~',e);
    }
  },
  // 图片加载成功
  imgLoaded(e) {
    wx.hideLoading();
  },
  // 导出图片到相册
  async saveHaibao() {
    const tempPath = this.data.swiperData[this.data.currentIndex].bg;
    if (!tempPath) {
      return;
    }
    wx.showLoading({
      title: '保存中~',
    });
    try {
      await haibaoUtil.saveHaibao(tempPath);
      wx.hideLoading();
      wx.showToast({
        title: '已存至相册中',
      });
    }catch(e) {
      console.error(e);
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      });
    }
  }
})