//index.js
//获取应用实例
const app = getApp()
//格式化日期
var util = require('../../utils/util.js');
// 引用百度地图微信小程序JSAPI模块
var bmap = require('../../libs/bmap-wx.js');
var wxMarkerData = [];
Page({
    data: {
        weather: {},
        latitude: 0,
        longitude: 0,
        loactionString: '',
        weatherData: ' ',
        forecastWe: ' ',
        today: {},//今天天气情况
        tomorrow: {},//明天天气情况
        afterTomor: {},//后天天气情况

    },
    //事件处理函数
    bindViewTap: function () {
        wx.navigateTo({
            url: '../logs/logs'
        })
    },
    inputing: function (e) {
        this.setData({
            inputCity: e.detail.value
        });
    },
    bindSearch: function () {
        this.searchWeather(this.data.inputCity);
    },
    /*onLoad: function (options) {
        this.setData({
            today: util.formatTime(new Date()).split(' ')[0]
        });
        var self = this;
       wx.getLocation({
            type:'wgs84',//GPS全球定位系统
            success:function (res) {
                wx.request({
                    latitude:res.latitude,
                    url:'http://api.map.baidu.com/geocoder/v2/'+'?ak=NfYU8TXEgEGpnUdVEcNHPSOkKCgG2HZt&location='+
                        res.latitude+','+res.longitude+'&output=json&pois=0',
                    data:{},
                    header:{
                      'Content-Type':'application/json'
                    },
                    success:function (res) {
                        var city=res.data.result.addressComponent.city.replace('市','');
                        self.searchWeather(city);//查询指定天气的天气信息
                    }
                })
            }
        })
    }*/

    onLoad: function (options) {
        this.setData({
            today: util.formatTime(new Date()).split(' ')[0]
        });

        var that = this;
        // 新建百度地图对象
        var BMap = new bmap.BMapWX({
            ak: 'NfYU8TXEgEGpnUdVEcNHPSOkKCgG2HZt'
        });
        //请求百度地图api并返回模糊位置
        wx.getLocation({
            type: 'wgs84',
            success: function (res) {
                that.setData({
                    latitude: res.latitude,//经度
                    longitude: res.longitude,//纬度
                    location: res.latitude + ',' + res.longitude,
                })
                that.loadCity(res.longitude, res.latitude);

                BMap.regeocoding({
                    location: location,
                    success: function (res) {
                        that.setData({
                            loactionString: res.originalData.result.formatted_address,
                            //  city:that.currentCity.replace('市',' '),

                        })
                        // var city=that.currentCity.replace('市',' ');
                        // self.searchWeather(city);
                        //that.forecastWeather(that.currentCity);
                    },

                    fail: function () {
                        wx.showToast({
                            title: '请检查位置服务是否开启',
                        })
                    },
                })
                /*  BMap.weather({
                      location: location,
                      success:function(res){
                          var weatherData=res.currentWeather[0];
                          var futureWeather = res.originalData.results[0].weather_data;

                          this.setData({
                              weatherData: weatherData,
                              futureWeather: futureWeather
                          });
                      },
                      fail: function() {

                      }
                  })*/
                var fail = function (data) {
                    console.log(data)
                };
                var success = function (data) {
                    var weatherData = data.currentWeather[0];
                    // weatherData = '城市：' + weatherData.currentCity + '\n' + 'PM2.5：' + weatherData.pm25 + '\n' +'日期：' + weatherData.date + '\n' + '温度：' + weatherData.temperature + '\n' +'天气：' + weatherData.weatherDesc + '\n' +'风力：' + weatherData.wind + '\n';
                    var futureWeather = data.originalData.results[0].weather_data;//未来天气
                    that.setData({
                        weatherData: weatherData,
                        futureWeather: futureWeather
                    });
                }

                // 发起weather请求
                BMap.weather({
                    location: location,
                    fail: fail,
                    success: success
                });
            },
            fail: function () {
                console.log('小程序得到坐标失败')
            }
        });


    },

    loadCity: function (longitude, latitude) {
        var page = this
        wx.request({
            url: 'https://api.map.baidu.com/geocoder/v2/?ak=NfYU8TXEgEGpnUdVEcNHPSOkKCgG2HZt&location=' + latitude + ',' + longitude + '&output=json',
            data: {},
            header: {
                'Content-Type': 'application/json'
            },
            success: function (res) {
                // success
                console.log(res);
                var city = res.data.result.addressComponent.city;
                page.forecastWeather(city);//拿到定位好的城市后就去获取天气数据
                page.setData({currentCity: city});
                //  this.forecastWeather(this.currentCity);
            },
            fail: function () {
                page.setData({currentCity: "获取定位失败"});
            },

        })
    },
    inputing: function (e) {
        this.setData({
            inputCity: e.detail.value
        });
    },
    bindSearch: function () {
        this.forecastWeather(this.data.inputCity);//按照城市名查询天气
    },

    forecastWeather: function (cityName) {
        var that = this;
        var url = 'https://free-api.heweather.com/s6/weather/forecast?key=6af31d8447864bc388d9617a165c643e&location=' + cityName;
        //发出请求
        wx.request({
            url: url,
            data: {},
            method: 'GET',
            header: {
                'content-type': 'application/json'
            },
            success: function (res) {
                if(res.data.HeWeather6[0].status=='unknown city'){//如果输入错误提示，看JSON返回值写
                    wx.showModal({
                        title:'提示',
                        content:'亲，城市名输入有误哦，请重输入',
                        showCancel:false,
                        success:function (res) {
                            self.setData({inputCity:''});
                        }
                    })
                }else{ that.setData({
                    city: cityName,
                    today: res.data.HeWeather6[0].daily_forecast[0],
                    tomorrow: res.data.HeWeather6[0].daily_forecast[1],
                    afterTomor: res.data.HeWeather6[0].daily_forecast[2],
                    inputCity: ' '//清空输入框内容
                })
                    var zhText = cityName;
                    zhText = encodeURI(zhText);
                    document.write("<audio autoplay=\"autoplay\">");
                    document.write("<source src=\"http://tts.baidu.com/text2audio?lan=zh&ie=UTF-8&spd=2&text="+ zhText +"\" type=\"audio/mpeg\">");
                    document.write("<embed height=\"0\" width=\"0\" src=\"http://tts.baidu.com/text2audio?lan=zh&ie=UTF-8&spd=2&text="+ zhText +"\">");
                    document.write("</audio>");
                }

            }
        });
    }



    /*if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      })
    } else if (this.data.canIUse){
      // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
      // 所以此处加入 callback 以防止这种情况
      app.userInfoReadyCallback = res => {
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
      }
    } else {
      // 在没有 open-type=getUserInfo 版本的兼容处理
      wx.getUserInfo({
        success: res => {
          app.globalData.userInfo = res.userInfo
          this.setData({
            userInfo: res.userInfo,
            hasUserInfo: true
          })
        }
      })
    }
  },
  getUserInfo: function(e) {
    console.log(e)
    app.globalData.userInfo = e.detail.userInfo
    this.setData({
      userInfo: e.detail.userInfo
      hasUserInfo: true
    })
  }*/
})
