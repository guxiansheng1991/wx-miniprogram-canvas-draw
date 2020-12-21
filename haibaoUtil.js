/**
 * 海报util
 */

let dpr = 0;
let windowWidth = 0;
function getSystemInfo() {
  const systemInfo = wx.getSystemInfoSync();
  dpr = systemInfo.pixelRatio;
  windowWidth = systemInfo.windowWidth;
}
getSystemInfo();

module.exports = {
  dpr: dpr,
  windowWidth: windowWidth,
  /**
   * 获取canvas实例和上下文
   * @param {canvas的id} canvasId 
   */
  createHaibao(canvasId) {
    return new Promise((resolve, reject) => {
      // 通过 SelectorQuery 获取 Canvas 节点
      wx.createSelectorQuery()
      .select(`#${canvasId}`)
      .fields({
        node: true,
        size: true,
      })
      .exec((res) => {
        if (res[0]) {
          const width = res[0].width;
          const height = res[0].height;
          const canvas = res[0].node;
          this.canvas = canvas;
          const ctx = canvas.getContext('2d');
          canvas.width = width * dpr;
          canvas.height = height * dpr;
          ctx.scale(dpr, dpr);
          resolve({canvas, ctx});
        }else {
          // 生成海报失败
          wx.showToast({
            title: '生成海报失败, 请稍后重试~',
            icon: 'none'
          });
          reject({});
        }
      });
    });
  },
  /**
   * 生成canvas后,获取canvas生成的图片的临时路径
   * @param {canvas实例} canvas 
   */
  createHaibaoUrl(canvas) {
    return new Promise((resolve, reject) => {
      wx.canvasToTempFilePath({
        x: 0,
        y: 0,
        width: canvas.width/dpr,
        height: canvas.height/dpr,
        destWidth: canvas.width,
        destHeight: canvas.height,
        canvas: canvas,
        fileType: 'png',
        success(res) {
          resolve(res.tempFilePath);
        },
        fail(error) {
          reject(error);
        }
      })
    });
  },
  /**
   * 保存canvas到本地图片
   */
  saveHaibao(tempPath) {
    const _this = this;
    return new Promise((resolve, reject) => {
      wx.getSetting({
        success: (res) => {
          let authSetting = res.authSetting
          if (authSetting['scope.writePhotosAlbum']) {
            // 已授权
            _this._saveImg(tempPath, (type) => {
              if (type === 'success') {
                resolve(type);
              } else {
                reject(type);
              }
            });
          } else if (!res.authSetting['scope.writePhotosAlbum']) {
            wx.hideLoading();
            wx.authorize({
              scope: 'scope.writePhotosAlbum',
              success() {
                _this._saveImg(tempPath, (type) => {
                  if (type === 'success') {
                    resolve(type);
                  } else {
                    reject(type);
                  }
                });
              },
              fail(e) {
                wx.hideLoading();
                wx.showModal({
                  title: '您未开启保存到相册的权限,是否去开启？',
                  success: res => {
                    console.log(res)
                    if (res.confirm) {
                      wx.openSetting()
                    }
                  }
                })
              }
            })
          }
        },
        fail(e) {
          console.log(e)
        }
      });
    });
  },
  // 保存图片
  _saveImg(tempFilePath, cb) {
    wx.saveImageToPhotosAlbum({
      filePath: tempFilePath,
      success(res) {
        cb('success');
      },
      fail(e) {
        cb('fail');
      }
    })
  },
    /**
   * 画圆角矩形、圆角边框和圆角图片所用到的方法
   * @param params
   * @param ctx
   */
  toDrawRadiusRect(params, ctx) {
    const {
      left,
      top,
      width,
      height,
      borderRadius,
      borderTopLeftRadius,
      borderTopRightRadius,
      borderBottomRightRadius,
      borderBottomLeftRadius
    } = params
    ctx.beginPath()
    if (borderRadius) {
      // 全部有弧度
      const br = borderRadius / 2
      ctx.moveTo(left + br, top) // 移动到左上角的点
      ctx.lineTo(left + width - br, top) // 画上边的线
      ctx.arcTo(left + width, top, left + width, top + br, br) // 画右上角的弧
      ctx.lineTo(left + width, top + height - br) // 画右边的线
      ctx.arcTo(left + width, top + height, left + width - br, top + height, br) // 画右下角的弧
      ctx.lineTo(left + br, top + height) // 画下边的线
      ctx.arcTo(left, top + height, left, top + height - br, br) // 画左下角的弧
      ctx.lineTo(left, top + br) // 画左边的线
      ctx.arcTo(left, top, left + br, top, br) // 画左上角的弧
    } else {
      const topLeftBr = borderTopLeftRadius ? borderTopLeftRadius / 2 : 0
      const topRightBr = borderTopRightRadius ? borderTopRightRadius / 2 : 0
      const bottomRightBr = borderBottomRightRadius ? borderBottomRightRadius / 2 : 0
      const bottomLeftBr = borderBottomLeftRadius ? borderBottomLeftRadius / 2 : 0
      ctx.moveTo(left + topLeftBr, top)
      ctx.lineTo(left + width - topRightBr, top)
      if (topRightBr) { // 画右上角的弧度
        ctx.arcTo(left + width, top, left + width, top + topRightBr, topRightBr)
      }
      ctx.lineTo(left + width, top + height - bottomRightBr) // 画右边的线
      if (bottomRightBr) { // 画右下角的弧度
        ctx.arcTo(left + width, top + height,
          left + width - bottomRightBr, top + height, bottomRightBr)
      }
      ctx.lineTo(left + bottomLeftBr, top + height)
      if (bottomLeftBr) {
        ctx.arcTo(left, top + height, left, top + height - bottomLeftBr, bottomLeftBr)
      }
      ctx.lineTo(left, top + topLeftBr)
      if (topLeftBr) {
        ctx.arcTo(left, top, left + topLeftBr, top, topLeftBr)
      }
    }
  },
  /**
   * 获取屏幕和dpr后计算的数值
   * */
  computedWAndD(number) {
    // 屏幕缩放比率
    const zoomRate = windowWidth*dpr/750;
    // 物理长度
    const physicalLength = number/dpr;
    return zoomRate*physicalLength;
  },
  loadImg(canvas, imgUrl) {
    return new Promise((resolve, reject) => {
      const img = canvas.createImage();
      img.src = imgUrl;
      img.onload = () => {
        resolve(img);
      }
      img.onerror = () => {
        wx.showToast({
          title: '加载海报图片失败, 请稍后重试~',
          icon: 'none'
        })
        reject(null);
      }
    });
  },
  // load base64 img
  loadImgBase64(data) {
    return new Promise((resolve, reject) => {
      const fsm = wx.getFileSystemManager();
      const FILE_BASE_NAME = 'tmp_base64src';
      const filePath = `${wx.env.USER_DATA_PATH}/${FILE_BASE_NAME}`;
      //base64 数据转换为 ArrayBuffer 数据
      const buffer = wx.base64ToArrayBuffer(data);
      fsm.writeFile({
        filePath: filePath,
        data: buffer,
        encoding: 'binary',
        success: () => {
          resolve(filePath);
        },
        fail: err => {
          console.log('loadImgBase64失败', err);
          reject(null);
        },
      });
    });
  },
  /**
   * 画多行文本
   * 思路: 利用measureText计算文本最终渲染时的长度, 计算文本何时换行
   * @param {文本} str 
   * @param {文本行高} lineHeight 
   * @param {共画多少行文本} rows 
   * @param {是否需要展示折叠符合(3个点)} needFold 
   * @param {文本每行长度} maxWidth 
   * @param {文本x坐标} x 
   * @param {文本y坐标} y 
   * return 实际画了多少行
   */
  drawTextWrapper(ctx, str, lineHeight, rows, needFold, maxWidth, x, y) {
    let strArray = str.split('');
    let renderStrArray = [];
    let tempStr = '';
    const maxWidth1 = this.computedWAndD(maxWidth);
    for (let index = 0; index < strArray.length; index++) {
      const item = strArray[index];
      tempStr = tempStr + item;
      const itemLength = ctx.measureText(tempStr).width;
      if (itemLength >= maxWidth1) {
        renderStrArray.push(tempStr);
        tempStr = '';  
      } else if ((index + 1) === strArray.length){
        renderStrArray.push(tempStr);
      }
    }
    // 并未达到一行的长度
    if (renderStrArray.length === 0) {
      renderStrArray.push(tempStr);
    }
    const flag = Math.min(renderStrArray.length, rows);
    for (let index = 0; index < flag; index++) {
      let item = renderStrArray[index];
      // 最后一行
      if ((index + 1) === rows && needFold && ctx.measureText(item).width >= maxWidth1) {
        // 减掉3个点的长度
        item = item.substr(0, item.length - 1);
        item = item + '...';
      }
      ctx.fillText(item, this.computedWAndD(x), this.computedWAndD(y + lineHeight*index), maxWidth1);
    }
    return flag;
  }
}